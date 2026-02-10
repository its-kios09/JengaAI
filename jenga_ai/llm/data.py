"""LLM data processing with completion, instruction, and chat format support.

Extends V1 with:
- Instruction format (prompt masking in labels)
- Chat template support
- Multi-dataset concatenation
- Auto train/eval splitting
"""

from __future__ import annotations

import logging
from typing import Any

from datasets import Dataset, DatasetDict, concatenate_datasets, load_dataset
from transformers import PreTrainedTokenizer

from .config import LLMConfig, LLMTaskType

logger = logging.getLogger(__name__)


class LLMDataProcessor:
    """Loads and tokenizes data for LLM fine-tuning.

    Supports three formats:
    - Completion: text_column → tokenize, labels = input_ids
    - Instruction: instruction + text → prompt, response → labels (prompt masked)
    - Chat: messages column → apply_chat_template
    """

    def __init__(self, config: LLMConfig, tokenizer: PreTrainedTokenizer) -> None:
        self.config = config
        self.data_config = config.data
        self.tokenizer = tokenizer
        self.max_length = self.data_config.max_length

    def load_and_prepare(self) -> tuple[Dataset, Dataset | None]:
        """Load, tokenize, and split data.

        Returns:
            (train_dataset, eval_dataset) — eval may be None.
        """
        raw_datasets = self._load_raw()
        tokenized = self._tokenize(raw_datasets)
        return self._split(tokenized)

    def _load_raw(self) -> Dataset:
        """Load raw data from file path(s)."""
        paths = self.data_config.path
        if isinstance(paths, str):
            paths = [paths]

        datasets = []
        for path in paths:
            fmt = self.data_config.format
            # Map common extensions
            ext_map = {"jsonl": "json", "json": "json", "csv": "csv"}
            load_fmt = ext_map.get(fmt, fmt)
            try:
                ds = load_dataset(load_fmt, data_files=path)
            except Exception as e:
                raise ValueError(
                    f"Cannot load dataset from '{path}' (format={fmt}). "
                    f"Check path and format. Error: {e}"
                ) from e
            # Flatten DatasetDict → Dataset
            if isinstance(ds, DatasetDict):
                if self.data_config.train_split in ds:
                    datasets.append(ds[self.data_config.train_split])
                else:
                    # Use first available split
                    first_key = next(iter(ds))
                    datasets.append(ds[first_key])
            else:
                datasets.append(ds)

        if len(datasets) == 1:
            return datasets[0]
        return concatenate_datasets(datasets)

    def _tokenize(self, dataset: Dataset) -> Dataset:
        """Tokenize based on detected format."""
        columns = dataset.column_names

        # Detect format
        if self.data_config.instruction_column and self.data_config.instruction_column in columns:
            logger.info("Using instruction format (prompt masking enabled)")
            tokenized = dataset.map(
                self._tokenize_instruction,
                batched=True,
                remove_columns=columns,
                desc="Tokenizing (instruction)",
            )
        elif "messages" in columns:
            logger.info("Using chat template format")
            tokenized = dataset.map(
                self._tokenize_chat,
                batched=True,
                remove_columns=columns,
                desc="Tokenizing (chat)",
            )
        else:
            logger.info("Using completion format")
            tokenized = dataset.map(
                self._tokenize_completion,
                batched=True,
                remove_columns=columns,
                desc="Tokenizing (completion)",
            )

        return tokenized

    def _tokenize_completion(self, examples: dict[str, list]) -> dict[str, list]:
        """Tokenize for completion format: labels = input_ids."""
        texts = examples[self.data_config.text_column]
        tokenized = self.tokenizer(
            texts,
            truncation=True,
            padding="max_length",
            max_length=self.max_length,
        )
        tokenized["labels"] = [ids[:] for ids in tokenized["input_ids"]]
        return tokenized

    def _tokenize_instruction(self, examples: dict[str, list]) -> dict[str, list]:
        """Tokenize instruction format: mask prompt tokens in labels with -100."""
        instructions = examples[self.data_config.instruction_column]
        inputs = examples[self.data_config.text_column]
        responses = examples[self.data_config.response_column]

        all_input_ids = []
        all_attention_masks = []
        all_labels = []

        for instruction, inp, response in zip(instructions, inputs, responses):
            # Build prompt and full text
            prompt = f"### Instruction:\n{instruction}\n\n### Input:\n{inp}\n\n### Response:\n"
            full_text = prompt + response

            # Tokenize full text
            tokenized = self.tokenizer(
                full_text,
                truncation=True,
                padding="max_length",
                max_length=self.max_length,
            )

            # Find prompt length to mask in labels
            prompt_tokenized = self.tokenizer(
                prompt,
                truncation=True,
                max_length=self.max_length,
                add_special_tokens=False,
            )
            prompt_len = len(prompt_tokenized["input_ids"])

            # Mask prompt tokens with -100 so loss is only on response
            labels = tokenized["input_ids"][:]
            labels[:prompt_len] = [-100] * prompt_len

            all_input_ids.append(tokenized["input_ids"])
            all_attention_masks.append(tokenized["attention_mask"])
            all_labels.append(labels)

        return {
            "input_ids": all_input_ids,
            "attention_mask": all_attention_masks,
            "labels": all_labels,
        }

    def _tokenize_chat(self, examples: dict[str, list]) -> dict[str, list]:
        """Tokenize chat format using tokenizer.apply_chat_template."""
        all_input_ids = []
        all_attention_masks = []
        all_labels = []

        for messages in examples["messages"]:
            text = self.tokenizer.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=False
            )
            tokenized = self.tokenizer(
                text,
                truncation=True,
                padding="max_length",
                max_length=self.max_length,
            )
            all_input_ids.append(tokenized["input_ids"])
            all_attention_masks.append(tokenized["attention_mask"])
            all_labels.append(tokenized["input_ids"][:])

        return {
            "input_ids": all_input_ids,
            "attention_mask": all_attention_masks,
            "labels": all_labels,
        }

    def _split(self, dataset: Dataset) -> tuple[Dataset, Dataset | None]:
        """Split into train/eval."""
        if self.data_config.eval_split:
            # Caller expects the raw data to have named splits — but we already
            # flattened in _load_raw, so this path is for when the user loaded
            # a dataset with a separate eval file.
            logger.warning(
                "eval_split='%s' specified but data was loaded as flat dataset. "
                "Falling back to auto-split with test_size=%.2f.",
                self.data_config.eval_split,
                self.data_config.test_size,
            )

        split = dataset.train_test_split(test_size=self.data_config.test_size, seed=42)
        logger.info(
            "Split: %d train, %d eval", len(split["train"]), len(split["test"])
        )
        return split["train"], split["test"]

    def get_data_collator(self) -> Any:
        """Return the appropriate data collator."""
        if self.config.task_type == LLMTaskType.SEQ2SEQ:
            from transformers import DataCollatorForSeq2Seq

            return DataCollatorForSeq2Seq(tokenizer=self.tokenizer, padding=True)
        else:
            from transformers import DataCollatorForLanguageModeling

            return DataCollatorForLanguageModeling(tokenizer=self.tokenizer, mlm=False)
