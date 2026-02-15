"""Dataset service — upload, parse, preview, distribution."""

from __future__ import annotations

import csv
import io
import json
import logging
import os
import uuid
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dataset import Dataset

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("uploads/datasets")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 500 * 1024 * 1024 


class DatasetService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── List ──────────────────────────────────────────

    async def list_datasets(self, user_id: uuid.UUID) -> list[Dataset]:
        result = await self.db.execute(
            select(Dataset)
            .where(Dataset.user_id == user_id)
            .order_by(Dataset.created_at.desc())
        )
        return list(result.scalars().all())

    # ── Get ───────────────────────────────────────────

    async def get_dataset(self, dataset_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Dataset]:
        result = await self.db.execute(
            select(Dataset)
            .where(Dataset.id == dataset_id, Dataset.user_id == user_id)
        )
        return result.scalar_one_or_none()

    # ── Upload & Parse ────────────────────────────────

    async def upload_dataset(
        self, user_id: uuid.UUID, filename: str, content: bytes
    ) -> Dataset:
        if len(content) > MAX_FILE_SIZE:
            raise ValueError("File exceeds 500MB limit")

        # Detect format
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in ("csv", "json", "jsonl"):
            raise ValueError("Unsupported format. Use CSV, JSON, or JSONL.")

        file_id = uuid.uuid4().hex[:12]
        safe_name = f"{file_id}_{filename}"
        file_path = UPLOAD_DIR / safe_name
        file_path.write_bytes(content)

        dataset = Dataset(
            user_id=user_id,
            name=filename,
            description="",
            format=ext,
            file_path=str(file_path),
            size=len(content),
            status="processing",
        )
        self.db.add(dataset)
        await self.db.commit()
        await self.db.refresh(dataset)

        try:
            rows, columns = self._parse_file(content, ext)
            dataset.row_count = len(rows)
            dataset.column_count = len(columns)
            dataset.columns = columns
            dataset.status = "ready"

            text_col, label_col = self._detect_columns(columns, rows)
            dataset.text_column = text_col
            dataset.label_column = label_col

            await self.db.commit()
            await self.db.refresh(dataset)
            logger.info("Dataset parsed: %s (%d rows, %d cols)", filename, len(rows), len(columns))

        except Exception as exc:
            dataset.status = "error"
            dataset.error_message = str(exc)
            await self.db.commit()
            await self.db.refresh(dataset)
            logger.error("Failed to parse dataset %s: %s", filename, exc)

        return dataset

    # ── Preview ───────────────────────────────────────

    async def get_preview(
        self, dataset_id: uuid.UUID, user_id: uuid.UUID, limit: int = 50
    ) -> dict:
        dataset = await self.get_dataset(dataset_id, user_id)
        if not dataset:
            raise ValueError("Dataset not found")

        content = Path(dataset.file_path).read_bytes()
        rows, columns = self._parse_file(content, dataset.format)

        return {
            "headers": columns,
            "rows": [[str(cell) for cell in row] for row in rows[:limit]],
            "total_rows": len(rows),
        }

    # ── Label Distribution ────────────────────────────

    async def get_label_distribution(
        self, dataset_id: uuid.UUID, user_id: uuid.UUID
    ) -> list[dict]:
        dataset = await self.get_dataset(dataset_id, user_id)
        if not dataset:
            raise ValueError("Dataset not found")
        if not dataset.label_column:
            return []

        content = Path(dataset.file_path).read_bytes()
        rows, columns = self._parse_file(content, dataset.format)

        label_idx = columns.index(dataset.label_column) if dataset.label_column in columns else None
        if label_idx is None:
            return []

        labels = [str(row[label_idx]) for row in rows if label_idx < len(row)]
        counter = Counter(labels)
        total = len(labels)

        return [
            {
                "label": label,
                "count": count,
                "percentage": round(count / total * 100, 1) if total > 0 else 0,
            }
            for label, count in counter.most_common()
        ]

    # ── Update ────────────────────────────────────────

    async def update_dataset(
        self, dataset_id: uuid.UUID, user_id: uuid.UUID, **kwargs
    ) -> Optional[Dataset]:
        dataset = await self.get_dataset(dataset_id, user_id)
        if not dataset:
            return None

        for key, value in kwargs.items():
            if value is not None and hasattr(dataset, key):
                setattr(dataset, key, value)

        dataset.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(dataset)
        return dataset

    # ── Delete ────────────────────────────────────────

    async def delete_dataset(self, dataset_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        dataset = await self.get_dataset(dataset_id, user_id)
        if not dataset:
            return False

        # Delete file
        try:
            file_path = Path(dataset.file_path)
            if file_path.exists():
                file_path.unlink()
        except Exception as exc:
            logger.warning("Failed to delete file %s: %s", dataset.file_path, exc)

        await self.db.delete(dataset)
        await self.db.commit()
        return True

    # ── Helpers ───────────────────────────────────────

    def _parse_file(self, content: bytes, fmt: str) -> tuple[list[list], list[str]]:
        text = content.decode("utf-8-sig")

        if fmt == "csv":
            reader = csv.reader(io.StringIO(text))
            all_rows = list(reader)
            if not all_rows:
                raise ValueError("CSV file is empty")
            columns = all_rows[0]
            rows = all_rows[1:]

        elif fmt == "json":
            data = json.loads(text)
            if isinstance(data, list) and len(data) > 0:
                columns = list(data[0].keys())
                rows = [[item.get(col, "") for col in columns] for item in data]
            else:
                raise ValueError("JSON must be an array of objects")

        elif fmt == "jsonl":
            lines = [line.strip() for line in text.strip().split("\n") if line.strip()]
            if not lines:
                raise ValueError("JSONL file is empty")
            items = [json.loads(line) for line in lines]
            columns = list(items[0].keys())
            rows = [[item.get(col, "") for col in columns] for item in items]

        else:
            raise ValueError(f"Unsupported format: {fmt}")

        return rows, columns

    def _detect_columns(
        self, columns: list[str], rows: list[list]
    ) -> tuple[Optional[str], Optional[str]]:
        """Auto-detect text and label columns by name heuristics."""
        col_lower = {c.lower(): c for c in columns}

        text_col = None
        for hint in [
            "text",
            "content",
            "sentence",
            "message",
            "input",
            "body",
            "review",
            "comment",
            "query",
            "prompt",
            "question",
            "instruction",
            "transcript",
        ]:
            if hint in col_lower:
                text_col = col_lower[hint]
                break

        label_col = None
        for hint in [
            "label",
            "class",
            "category",
            "sentiment",
            "target",
            "output",
            "tag",
            "result",
            "prediction",
            "instruction",
            "response",
            "answer",
            "result",
            "transcript"
        ]:
            if hint in col_lower:
                label_col = col_lower[hint]
                break

        return text_col, label_col
