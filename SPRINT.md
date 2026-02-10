# Jenga-AI — Sprint Backlog & Stories

**Last updated:** February 7, 2026
**Product:** Jenga-AI V2 — Low-Code NLP Platform for Kenyan National Security
**Product Manager:** @naynek

---

## How to Use This Document

This is your **delegation-ready sprint backlog**. Each sprint maps to a milestone,
each epic maps to a deliverable, and each story is a task you can assign to a
team member. Copy stories into GitHub Issues, Jira tickets, or Asana tasks.

**Story format:**
- **Title** — short, actionable
- **Narrative** — the "why" and context
- **What to do** — step-by-step instructions
- **Acceptance criteria** — how to know it is done
- **Notes** — gotchas, dependencies, things to watch out for
- **Assignee hint** — suggested role (ML Engineer, Backend Dev, Frontend Dev, DevOps, QA)

**Priority labels:**
- P0 = Blocker (nothing else can proceed without this)
- P1 = Critical (core functionality)
- P2 = Important (significant feature)
- P3 = Nice-to-have (polish, optimization)

---

# PHASE 0: COMPLETED WORK (DONE)

> These sprints represent the foundation that has already been built. They are
> documented here so the team understands what exists, what decisions were made,
> and what they can build on. **Do not re-do this work.**

---

## SPRINT 0A: Core ML Framework (DONE)

**Goal:** Build the entire ML engine from scratch — config system, task heads,
fusion mechanisms, multi-task model, data pipeline, and trainer. This is the
Python library that powers everything.

**What was built (25 Python files):**

| Module | Files | What It Does |
|--------|-------|-------------|
| `core/config.py` | Pydantic v2 config | 14 config models with full validation, YAML I/O |
| `core/model.py` | MultiTaskModel | Shared encoder + per-task heads, dynamic hidden_size |
| `core/fusion.py` | Fusion layers | AttentionFusion (residual + gate), ConcatenationFusion, NoFusion |
| `core/registry.py` | Task registry | Decorator-based task registration and lookup |
| `tasks/*.py` | 5 task heads | Classification (single/multi), NER, Sentiment, Regression |
| `data/processor.py` | DataProcessor | JSON/JSONL/CSV loading, split, per-task processing |
| `data/collators.py` | Collators | Class-based (fixed V1 lambda bug), per-task collation |
| `data/pii.py` | PII redaction | Kenya-specific patterns, mask/hash/remove/flag, opt-in |
| `training/trainer.py` | Trainer | AMP, grad clip, accumulation, real eval loss, callbacks |
| `training/callbacks.py` | Callbacks | Logging (TB/MLflow), early stopping, checkpointing |
| `training/metrics.py` | Metrics | Per-task: accuracy, F1, precision, recall, MSE, MAE |
| `utils/logging.py` | Logging | Structured Python logging, configurable |
| `utils/device.py` | Device mgmt | CPU/CUDA/MPS auto-detect, AMP check, tensor mover |

**Key decisions made:**
- Pydantic v2 (not dataclasses) — we need validation + serialization for the API layer
- Dynamic hidden_size from encoder config (V1 hardcoded 768 — broke on non-BERT models)
- Learnable gate in fusion (init 0.5) — lets the model decide shared vs task-specific balance
- Class-based collators (V1 used lambdas in a loop — closure bug caused all tasks to use last task's collator)
- Real eval loss (V1 faked it as `1 - f1`)

---

## SPRINT 0B: Advanced Training Techniques (DONE)

**Goal:** Add continual learning, curriculum learning, and advanced regularization
so models can adapt to new threats without forgetting old ones, learn efficiently
from easy-to-hard examples, and handle class imbalance in security data.

**What was built (3 Python files):**

| Module | Classes | What It Does |
|--------|---------|-------------|
| `training/continual.py` | EWC, Replay, LwF, ProgressiveFreezing, Manager | Prevent catastrophic forgetting when adding new tasks |
| `training/curriculum.py` | DifficultyScorer, CurriculumSampler, NestedScheduler, PhasedScheduler | Learn easy→hard, unlock child tasks when parent mastered |
| `training/regularization.py` | LabelSmoothing, FocalLoss, RDrop, Mixup, SWA, KnowledgeDistiller | Handle imbalanced data, small datasets, model compression |

---

## SPRINT 0C: Security & Trust Modules (DONE)

**Goal:** Build adversarial robustness, explainability, audit trail, and
human-in-the-loop — because this is a national security platform where
model decisions must be trustworthy, explainable, and auditable.

**What was built (4 Python files):**

| Module | What It Does |
|--------|-------------|
| `security/adversarial.py` | FGSM + PGD attacks, AdversarialTrainer for robust models |
| `security/explainability.py` | Attention, gradient, occlusion explanations + human-readable reports |
| `security/audit.py` | SHA-256 hash-chained audit trail, tamper detection |
| `security/hitl.py` | Entropy/margin uncertainty, auto-route low-confidence to human review |

---

## SPRINT 0D: Backend & Frontend Scaffolding (DONE)

**Goal:** Set up the project structure for backend (FastAPI) and frontend
(React + Vite + TypeScript) so developers can start building features
immediately without spending a day on boilerplate.

**What was set up:**

**Backend (`backend/`):**
- `app/main.py` — FastAPI app with CORS, request ID middleware, health check
- `app/config.py` — pydantic-settings loading from env vars / `.env`
- `app/core/database.py` — SQLAlchemy 2.0 async engine + session
- `app/core/security.py` — JWT create/decode, bcrypt password hashing
- `app/core/deps.py` — `get_current_user` dependency injection
- `app/api/v1/` — router stubs for auth, projects, datasets, training, inference, templates, compute
- `app/models/` — ORM model directory (to be filled)
- `app/schemas/` — Pydantic request/response schemas (to be filled)
- `app/services/` — business logic (to be filled)
- `app/workers/` — Celery task directory (to be filled)
- `alembic/` — migration framework ready
- `requirements.txt` — FastAPI, SQLAlchemy, Celery, Redis, auth libs
- `.env.example` — all env vars documented

**Frontend (`frontend/`):**
- Scaffolded with `npm create vite@latest -- --template react-ts`
- Dependencies: react-router-dom, zustand, @tanstack/react-query, axios, lucide-react, recharts, tailwindcss
- Directory structure: `components/{ui,layout,common}`, `pages/{auth,dashboard,projects,datasets,training,inference,templates,compute}`, `hooks/`, `store/`, `api/`, `lib/`, `types/`

**Tests (`tests/`):**
- `unit/`, `integration/`, `e2e/`, `fixtures/` directories ready

---

# PHASE A: ML FRAMEWORK COMPLETION

> The ML framework (`jenga_ai/`) is the engine underneath everything. The backend
> wraps it, the frontend talks to the backend, but none of that matters if the
> engine is broken. Phase 1 (core) is done. These sprints finish the remaining
> ML modules so the backend has a complete engine to wrap.

---

## SPRINT 1: LLM Fine-tuning Module

**Goal:** Give users the ability to fine-tune large language models (SwahiliBERT,
GPT-style models) with LoRA adapters and quantization, so they can build custom
NLP models without needing massive GPU resources.

**Why this matters:** Our users in Kenyan government agencies often have limited
compute. LoRA lets them fine-tune a 3B-parameter model on a single GPU by only
training ~1% of the weights. Quantization (4-bit, 8-bit) shrinks model memory
by 4-8x. Without this module, users are stuck with only the multi-task
classification heads — they cannot leverage the latest LLMs.

**Depends on:** MS-1 through MS-6 (all DONE)
**Blocks:** Sprint 6 (Inference), Sprint 7 (Export), Backend Training API

---

### Epic 1.1: LLM Configuration System

> **Narrative:** In V1, the LLM config was plagued with bugs — `eval_strategy`
> vs `evaluation_strategy` broke depending on the transformers version, `fp16`
> crashed on CPU machines, and learning rate came in as a string from YAML but
> the trainer expected a float. We need a bulletproof Pydantic config that
> catches all of these at validation time, not at training time.

**Story 1.1.1: Create LLM Pydantic Config** (P0 — ML Engineer)

*What to do:*
- Create `jenga_ai/llm/config.py`
- Define `LLMConfig(BaseModel)` with fields:
  - `model_name_or_path: str` — HuggingFace model ID or local path
  - `task_type: Literal["causal_lm", "seq2seq"]` — generation style
  - `max_length: int` — max sequence length (default 512)
  - `learning_rate: float` — with validator to cast from string if needed
  - `num_train_epochs: int`
  - `per_device_train_batch_size: int`
  - `per_device_eval_batch_size: int`
  - `eval_strategy: str` — with validator that maps `evaluation_strategy` → `eval_strategy` for HF compatibility
  - `fp16: bool` — with validator that auto-disables on CPU and logs a warning
  - `gradient_accumulation_steps: int`
  - `output_dir: str`
- Define `LoRAConfig(BaseModel)` with fields:
  - `enabled: bool = False`
  - `rank: int = 8` (must be > 0)
  - `alpha: int = 16`
  - `target_modules: list[str] = ["q_proj", "v_proj"]`
  - `dropout: float = 0.05` (0.0 to 1.0)
- Define `QuantizationConfig(BaseModel)` with fields:
  - `enabled: bool = False`
  - `bits: Literal[4, 8] = 4`
  - `compute_dtype: str = "float16"`
- Add `from_yaml()` and `to_yaml()` methods
- Add the `_convert_enums` helper for YAML serialization (reuse pattern from `core/config.py`)

*Acceptance criteria:*
- [ ] `LLMConfig.from_yaml("config.yaml")` loads without error
- [ ] Passing `learning_rate: "2e-5"` (string) auto-converts to float `2e-5`
- [ ] Passing `evaluation_strategy: "epoch"` auto-maps to `eval_strategy: "epoch"`
- [ ] Passing `fp16: true` on a CPU-only machine auto-sets to `false` with a logged warning
- [ ] Invalid LoRA rank (0 or negative) raises `ValidationError`
- [ ] Invalid quantization bits (e.g., 6) raises `ValidationError`

*Notes:*
- Look at `jenga_ai/core/config.py` for the pattern. Follow the same style: Pydantic v2 `BaseModel`, `Field(...)` with descriptions, `field_validator` decorators.
- The `eval_strategy` fix is critical — HuggingFace renamed this parameter between versions. Our config should accept both names and normalize to the current one.
- The `fp16` fix must check `torch.cuda.is_available()` at validation time, not at training time.

---

**Story 1.1.2: Add LLM Config Validators and Edge Cases** (P1 — ML Engineer)

*What to do:*
- Add a model_validator that checks: if `quantization.enabled` is True and no CUDA is available, raise a clear error: "Quantization requires a GPU. Set quantization.enabled=false or use a CUDA machine."
- Add a validator that warns if `lora.enabled` is True and `quantization.bits == 4` but `lora.rank > 64` — QLoRA with very high rank negates memory savings.
- Add a `to_hf_training_args()` method that converts our config to a HuggingFace `TrainingArguments` dict — this is what the trainer will consume.

*Acceptance criteria:*
- [ ] Quantization on CPU raises clear `ValidationError`
- [ ] `to_hf_training_args()` returns a dict compatible with `transformers.TrainingArguments`
- [ ] The dict does not contain any of our custom fields (only HF-recognized fields)

---

### Epic 1.2: Model Factory

> **Narrative:** Users should be able to say "I want SwahiliBERT with LoRA rank 8
> and 4-bit quantization" and get back a ready-to-train model. The factory handles
> all the complexity — loading from HuggingFace, applying LoRA adapters via PEFT,
> applying quantization via bitsandbytes, and falling back gracefully when hardware
> is not available.

**Story 1.2.1: Build LLM Model Factory** (P0 — ML Engineer)

*What to do:*
- Create `jenga_ai/llm/model_factory.py`
- Implement `load_model(config: LLMConfig) -> tuple[PreTrainedModel, PreTrainedTokenizer]`:
  - Load tokenizer from `config.model_name_or_path`
  - If `config.quantization.enabled`:
    - Check CUDA availability (raise error if not available)
    - Create `BitsAndBytesConfig` with `load_in_4bit` or `load_in_8bit`
    - Load model with `quantization_config`
  - Else: load model normally with `torch_dtype=torch.float16` if CUDA, else `float32`
  - If `config.lora.enabled`:
    - Create `LoraConfig` from PEFT library
    - Call `get_peft_model(model, lora_config)`
    - Log trainable parameter count vs total parameter count
  - Return `(model, tokenizer)`
- Handle errors: model not found on HuggingFace, CUDA OOM, bitsandbytes not installed

*Acceptance criteria:*
- [ ] `load_model(config)` returns a working model + tokenizer
- [ ] With LoRA enabled, only ~1-5% of parameters are trainable (log this)
- [ ] With 4-bit quantization, model memory is ~4x smaller than fp32
- [ ] Missing bitsandbytes package gives a clear error: "Install bitsandbytes: pip install bitsandbytes"
- [ ] Invalid model name gives clear error: "Model 'xyz' not found on HuggingFace Hub"

*Notes:*
- Import PEFT: `from peft import LoraConfig, get_peft_model, TaskType`
- Import bitsandbytes config: `from transformers import BitsAndBytesConfig`
- Test with a small model first (e.g., `distilbert-base-uncased`) before trying large ones
- The V1 codebase had no graceful error handling for model loading — this is a major improvement

---

**Story 1.2.2: Add Model Factory Utilities** (P2 — ML Engineer)

*What to do:*
- Add `count_parameters(model) -> dict` — returns `{"total": N, "trainable": M, "frozen": N-M, "trainable_pct": M/N*100}`
- Add `estimate_memory(model) -> dict` — returns `{"model_mb": X, "gradient_mb": Y, "optimizer_mb": Z, "total_mb": X+Y+Z}`
- Add `merge_lora_weights(model) -> PreTrainedModel` — merge LoRA adapters back into base model for deployment (no PEFT dependency needed at inference)

*Acceptance criteria:*
- [ ] `count_parameters()` accurately reports trainable vs frozen
- [ ] `merge_lora_weights()` produces a standalone model that works without PEFT installed

---

### Epic 1.3: LLM Trainer Wrapper

> **Narrative:** We do not want to rewrite the HuggingFace Trainer — it already
> handles distributed training, gradient accumulation, logging, and checkpointing.
> Instead, we wrap it so it integrates with our callback system and our config format.
> This way, users get the power of HF Trainer with the simplicity of Jenga-AI config.

**Story 1.3.1: Build LLM Trainer Wrapper** (P0 — ML Engineer)

*What to do:*
- Create `jenga_ai/llm/trainer.py`
- Implement `LLMTrainer` class:
  - `__init__(self, config: LLMConfig)` — stores config, initializes model factory
  - `train(self, train_dataset, eval_dataset=None)`:
    - Call `load_model(config)` to get model + tokenizer
    - Convert config to HF `TrainingArguments` via `config.to_hf_training_args()`
    - Create `transformers.Trainer(model, args, train_dataset, eval_dataset, data_collator, tokenizer)`
    - Call `trainer.train()`
    - Return training results (metrics dict)
  - `save(self, output_dir: str)`:
    - Save model weights (or LoRA adapter weights if LoRA enabled)
    - Save tokenizer
    - Save config as YAML alongside model
  - `evaluate(self, eval_dataset) -> dict`:
    - Run evaluation, return metrics

*Acceptance criteria:*
- [ ] `LLMTrainer(config).train(dataset)` runs without error
- [ ] Training metrics (loss, eval_loss) are logged correctly
- [ ] Checkpoint is saved at the end of training
- [ ] With LoRA, only adapter weights are saved (not full model)
- [ ] Config YAML is saved alongside model for reproducibility

*Notes:*
- The HF Trainer handles AMP, gradient accumulation, etc. internally — do NOT duplicate that logic.
- For the data collator, use `DataCollatorForLanguageModeling` (causal) or `DataCollatorForSeq2Seq` (seq2seq) depending on `config.task_type`.
- Test on CPU first with a tiny model and 2 epochs. GPU testing comes later.

---

### Epic 1.4: LLM Data Processing

> **Narrative:** LLM training data comes in different formats — instruction tuning
> needs `{"instruction": "...", "response": "..."}`, chat models need
> `{"messages": [{"role": "user", "content": "..."}]}`. We need a processor that
> handles these formats and tokenizes them correctly for the model type.

**Story 1.4.1: Build LLM Data Processor** (P1 — ML Engineer)

*What to do:*
- Create `jenga_ai/llm/data.py`
- Implement `LLMDataProcessor` class:
  - `load_dataset(path: str, format: str) -> Dataset` — load from JSON/JSONL/CSV
  - `prepare_for_training(dataset, tokenizer, config) -> Dataset`:
    - If instruction format: combine instruction + input → prompt, response → label
    - If chat format: apply tokenizer's chat template
    - Tokenize all examples with `tokenizer(text, max_length, truncation, padding)`
    - For causal LM: set labels = input_ids (shifted internally by HF)
    - For seq2seq: set labels = tokenized response
  - Support streaming for large datasets (>100k examples)

*Acceptance criteria:*
- [ ] Instruction format `{"instruction": "Classify this", "input": "text", "response": "positive"}` tokenizes correctly
- [ ] Chat format `{"messages": [...]}` tokenizes correctly
- [ ] Streaming mode does not OOM on a 1M-row dataset
- [ ] Token count statistics are logged (avg length, max length, truncation rate)

*Notes:*
- Use HuggingFace `datasets` library for loading (`load_dataset("json", data_files=path)`)
- For chat templates, use `tokenizer.apply_chat_template()` — this handles model-specific formatting
- NB: Always set `truncation=True` — without it, a single long example can OOM the GPU

---

### Epic 1.5: Knowledge Transfer Pipeline

> **Narrative:** We plan to open-source SwahiliBERT (large, accurate) and
> SwahiliDistilBERT (small, fast). The distillation pipeline compresses the
> knowledge from the large teacher into the small student. This is critical
> for deployment on edge devices in field offices.

**Story 1.5.1: Build Distillation Pipeline** (P2 — ML Engineer)

*What to do:*
- Add a `distill(teacher_model, student_model, dataset, config) -> student_model` function to `llm/trainer.py` or create `llm/distillation.py`
- The pipeline:
  1. Run teacher on dataset to get soft labels (logits with temperature)
  2. Train student to match both hard labels (ground truth) and soft labels (teacher's knowledge)
  3. Loss = `alpha * hard_loss + (1 - alpha) * KL_div(student_logits/T, teacher_logits/T) * T^2`
- Use the `KnowledgeDistiller` class from `training/regularization.py` as the loss component

*Acceptance criteria:*
- [ ] Student model trained with distillation scores within 5% of teacher on eval set
- [ ] Student model is at least 2x smaller than teacher
- [ ] Pipeline handles teacher and student having different tokenizers

*Notes:*
- This reuses `KnowledgeDistiller` from `jenga_ai/training/regularization.py` — do NOT reimplement the distillation loss. Import and use it.
- Reference: Hinton et al., "Distilling the Knowledge in a Neural Network"
- Temperature of 2.0-4.0 typically works well for BERT-style models

---

**Story 1.5.2: LoRA Merge and Export** (P2 — ML Engineer)

*What to do:*
- Add `merge_and_export(model_path: str, output_path: str)` to model factory
- Steps:
  1. Load LoRA model from checkpoint
  2. Merge adapter weights into base model (`model.merge_and_unload()`)
  3. Save merged model (full weights, no PEFT dependency needed)
  4. Save tokenizer alongside
  5. Verify merged model produces same outputs as LoRA model (sanity check)

*Acceptance criteria:*
- [ ] Merged model file size equals base model (not base + adapter)
- [ ] Merged model produces identical outputs to LoRA model (within float tolerance)
- [ ] Merged model loads without PEFT installed

---

## SPRINT 2: Inference Engine

**Goal:** Build the prediction pipeline so trained models can actually be used.
Without this, we can train models but cannot get predictions from them — which
means the entire backend inference API has nothing to call.

**Why this matters:** This is what users care about most — "I trained a model,
now classify this text." Every downstream feature (the API endpoint, the
inference UI, batch processing) depends on this module working correctly.

**Depends on:** Sprint 1 (LLM module), MS-4 (MultiTaskModel — DONE)
**Blocks:** Backend Inference API (Sprint 10), Frontend Inference UI (Sprint 18)

---

### Epic 2.1: Inference Handler

> **Narrative:** The V1 `from_pretrained` was broken — it did not properly
> reconstruct the model from saved files. Users would train for hours, save,
> then fail to load. This must work flawlessly.

**Story 2.1.1: Build Inference Handler** (P0 — ML Engineer)

*What to do:*
- Create `jenga_ai/inference/handler.py`
- Implement `InferenceHandler` class:
  - `__init__(self, model_path: str, device: str = "auto")`:
    - Load config from `model_path/config.yaml`
    - Load model weights from `model_path/model.pt` or `model_path/pytorch_model.bin`
    - Load tokenizer from `model_path/`
    - Move model to device, set to eval mode
    - Cache the loaded model in `self._model`
  - `predict(self, text: str, task_name: str) -> dict`:
    - Tokenize text
    - Forward pass (no_grad)
    - Return `{"label": "positive", "confidence": 0.94, "probabilities": {"positive": 0.94, "negative": 0.06}}`
  - `predict_batch(self, texts: list[str], task_name: str, batch_size: int = 32) -> list[dict]`:
    - Process in batches to avoid OOM
    - Return list of prediction dicts

*Acceptance criteria:*
- [ ] Load a model saved by `MultiTaskModel.save_pretrained()` — no errors
- [ ] Load a model saved by `LLMTrainer.save()` — no errors
- [ ] Single prediction returns label + confidence + probabilities
- [ ] Batch prediction handles 1000 texts without OOM (on CPU with batch_size=32)
- [ ] Second call to `predict()` reuses cached model (no reload)

*Notes:*
- NB: The model loading path differs between MultiTaskModel (our custom format) and LLM models (HF format). Handle both with a format detection check (look for `config.yaml` vs `config.json`).
- Always use `torch.no_grad()` during inference — forgetting this wastes memory on gradient tracking.
- NB: Set `model.eval()` to disable dropout — predictions must be deterministic.

---

**Story 2.1.2: Add NER Entity Extraction** (P1 — ML Engineer)

*What to do:*
- In the predict method, add NER-specific post-processing:
  - Convert token-level predictions to entity spans
  - Handle sub-word tokens (merge `##ing` back into the word)
  - Handle BIO tagging (B-PER, I-PER → single "PER" entity)
  - Return: `{"entities": [{"text": "John Kamau", "label": "PERSON", "start": 0, "end": 10, "confidence": 0.97}]}`

*Acceptance criteria:*
- [ ] Sub-word tokens are properly merged (e.g., "Ka" + "##mau" → "Kamau")
- [ ] BIO tags are properly collapsed (B-PER + I-PER → single entity)
- [ ] Entity start/end character offsets are correct (not token offsets)

*Notes:*
- This is tricky because tokenizers split words into sub-tokens. You need to map token indices back to character positions in the original text.
- Use `tokenizer.decode()` carefully — it adds spaces that may not exist in the original.
- NB: The `offset_mapping` from the tokenizer is your friend here. Pass `return_offsets_mapping=True` during tokenization.

---

### Epic 2.2: Prediction Pipeline (High-Level API)

> **Narrative:** The InferenceHandler is the low-level engine. The Pipeline is
> what users actually call — it is the one-liner that just works.
> `pipeline = JengaPipeline("./my_model"); result = pipeline("Detect if this is fraud")`

**Story 2.2.1: Build High-Level Prediction Pipeline** (P1 — ML Engineer)

*What to do:*
- Create `jenga_ai/inference/pipeline.py`
- Implement `JengaPipeline` class:
  - `__init__(self, model_path: str, device: str = "auto")` — wraps InferenceHandler
  - `__call__(self, text_or_texts, task_name=None) -> dict | list[dict]`:
    - If single string → single prediction
    - If list → batch prediction
    - If `task_name` is None and model has only one task, use that
    - If `task_name` is None and model has multiple tasks, raise clear error
  - `available_tasks() -> list[str]` — list task names the model supports
  - `async_predict(texts, task_name) -> list[dict]` — async version for API use

*Acceptance criteria:*
- [ ] `pipeline("some text")` returns prediction dict
- [ ] `pipeline(["text1", "text2"])` returns list of prediction dicts
- [ ] `pipeline.available_tasks()` returns correct task names
- [ ] Calling without task_name on a multi-task model gives helpful error

---

### Epic 2.3: Post-processing

> **Narrative:** Raw model outputs are tensors of logits. Users want labels,
> confidence percentages, and formatted results. This layer converts machine
> outputs to human-readable results.

**Story 2.3.1: Build Result Post-processors** (P1 — ML Engineer)

*What to do:*
- In `inference/pipeline.py` or a new `inference/postprocess.py`:
  - `ClassificationPostprocessor`: logits → softmax → top label + all probabilities
  - `MultiLabelPostprocessor`: logits → sigmoid → threshold (default 0.5) → list of active labels
  - `NERPostprocessor`: token logits → BIO decode → entity list
  - `SentimentPostprocessor`: logits → sentiment label + score (0-1 scale)
  - `RegressionPostprocessor`: raw output → denormalized value
- Each postprocessor uses `label_maps` from config to convert IDs to human names

*Acceptance criteria:*
- [ ] Classification returns `{"label": "spam", "confidence": 0.92}`
- [ ] Multi-label returns `{"labels": ["urgent", "financial"], "confidences": [0.88, 0.76]}`
- [ ] NER returns `{"entities": [{"text": "...", "label": "...", "start": N, "end": M}]}`
- [ ] All labels are human-readable strings, not integer IDs

---

## SPRINT 3: Export & Notebook Generation

**Goal:** Let users package their trained models for deployment or share them
as runnable notebooks. A user should be able to click "Export" and get a zip
file they can deploy on their own server, or "Open in Colab" and get a
notebook that trains their model on free GPU.

**Depends on:** Sprint 2 (Inference)
**Blocks:** Backend Compute API, Frontend Compute UI

---

### Epic 3.1: Model Export

> **Narrative:** Government agencies need to deploy models on internal servers
> that may not have internet access. The export zip must be fully self-contained:
> model weights, config, and an inference script that works offline.

**Story 3.1.1: Build Model Export Package** (P1 — ML Engineer)

*What to do:*
- Create `jenga_ai/export/model_export.py`
- Implement `export_model(model_path: str, output_path: str, format: str = "zip") -> str`:
  - Create a temp directory
  - Copy model weights (`pytorch_model.bin` or adapter weights)
  - Copy config (`config.yaml`)
  - Generate `inference.py` — a standalone script that loads the model and runs predictions (no Jenga-AI dependency needed — just torch + transformers)
  - Generate `README.md` — usage instructions, model info, task descriptions
  - Generate `requirements.txt` — minimal dependencies for inference
  - Zip everything → output_path
  - Report total zip size in MB
- Also implement `export_onnx(model, tokenizer, output_path)`:
  - Export model to ONNX format using `torch.onnx.export`
  - Include sample input for verification
  - Report ONNX model size

*Acceptance criteria:*
- [ ] Exported zip contains: model weights, config, inference.py, README, requirements.txt
- [ ] The `inference.py` script runs standalone: `python inference.py --text "some text"` produces correct predictions
- [ ] ONNX export produces a valid `.onnx` file
- [ ] ONNX model produces same predictions as PyTorch model (within tolerance)

*Notes:*
- NB: The standalone `inference.py` must NOT import from `jenga_ai`. It should only need `torch` and `transformers`. This is critical for deployment in environments where our framework is not installed.
- For ONNX export, you need to provide dummy input with the right shape. Use `tokenizer("dummy", return_tensors="pt")` as the example input.

---

### Epic 3.2: Notebook Generation

**Story 3.2.1: Build Colab/Kaggle Notebook Generator** (P2 — ML Engineer)

*What to do:*
- Create `jenga_ai/export/notebook_gen.py`
- Implement `generate_notebook(config: ExperimentConfig, platform: str = "colab") -> str`:
  - Build a Jupyter notebook (.ipynb) as a JSON structure
  - Cells:
    1. Title + description markdown cell
    2. Install dependencies (`!pip install jenga-ai torch transformers`)
    3. GPU detection cell (`import torch; print(torch.cuda.is_available())`)
    4. Config cell (pre-filled with user's config as Python dict)
    5. Data loading cell (upload or download dataset)
    6. Training cell (instantiate model, trainer, run training)
    7. Evaluation cell (run eval, print metrics)
    8. Inference cell (predict on sample texts)
    9. Export cell (save model, download zip)
  - Platform-specific:
    - Colab: add `from google.colab import files` for upload/download
    - Kaggle: use Kaggle dataset API paths
- Return the .ipynb file path

*Acceptance criteria:*
- [ ] Generated .ipynb file opens in Jupyter/Colab without errors
- [ ] All cells are pre-populated with the user's config
- [ ] Running all cells in sequence produces a trained model
- [ ] Colab version has Google Drive save option
- [ ] Kaggle version has Kaggle output path

*Notes:*
- The notebook JSON format is well-documented: `{"nbformat": 4, "cells": [{"cell_type": "code", "source": [...]}]}`
- NB: Test the generated notebook manually in Colab before considering this done. Untested notebooks are useless.

---

## SPRINT 4: Comprehensive Test Suite

**Goal:** Reach 90%+ code coverage with tests that actually catch bugs, not
tests that just exist to inflate coverage. Every module we have built so far
needs unit tests, and the full pipeline needs integration tests.

**Why this matters:** We are building security software. A regression in the
NER model could cause a threat to be misclassified. A bug in the audit trail
could allow tampering. Tests are not optional — they are a security requirement.

**Depends on:** Sprints 1-3 (all ML modules)
**Blocks:** CI/CD pipeline, confidence to ship

---

### Epic 4.1: Unit Tests — Core Modules

> **Narrative:** The config system, model, and fusion are the foundation. If
> `ExperimentConfig.from_yaml()` silently drops a field, every experiment is
> misconfigured. These tests must be thorough.

**Story 4.1.1: Test Configuration System** (P0 — QA / ML Engineer)

*What to do:*
- Create `tests/unit/test_config.py`
- Test cases:
  - Create `ExperimentConfig` with valid data → no error
  - Create with missing required field (`project_name`) → `ValidationError`
  - Create with invalid `num_labels: 0` → `ValidationError`
  - Create with duplicate task names → `ValidationError`
  - Create with duplicate head names → `ValidationError`
  - YAML round-trip: `config.to_yaml("test.yaml")` then `ExperimentConfig.from_yaml("test.yaml")` → identical config
  - `to_dict()` returns plain dict (no Pydantic models inside)
  - `PIIRedactionConfig.enabled` defaults to `False`
  - `TrainingConfig.resolve_device()` returns valid device string

*Acceptance criteria:*
- [ ] All test cases pass
- [ ] 100% line coverage on `core/config.py`
- [ ] Tests use `pytest` fixtures for shared config objects
- [ ] Tests run in under 5 seconds (no model loading)

*Notes:*
- NB: Use `tmp_path` pytest fixture for YAML file tests — do not write to the project directory.
- NB: Do NOT mock Pydantic validation. Test with real invalid data to catch real bugs.

---

**Story 4.1.2: Test MultiTaskModel** (P0 — QA / ML Engineer)

*What to do:*
- Create `tests/unit/test_model.py`
- Test cases:
  - Initialize model with `distilbert-base-uncased` → hidden_size auto-detected as 768
  - Initialize with single task (NoFusion) → forward pass works
  - Initialize with 3 tasks (AttentionFusion) → forward pass works
  - `save_pretrained()` creates expected files
  - `from_pretrained()` loads and produces same outputs
  - Freeze 4 encoder layers → those layers have `requires_grad=False`
  - Gradient checkpointing → forward pass still works (just uses less memory)

*Acceptance criteria:*
- [ ] All tests pass on CPU
- [ ] Model output shapes match expected dimensions
- [ ] Save/load round-trip produces identical outputs

*Notes:*
- Use `distilbert-base-uncased` for tests — it is small (66M params) and downloads fast.
- NB: The first test run will download the model from HuggingFace. Set `TRANSFORMERS_CACHE` to a known location so CI can cache it.

---

**Story 4.1.3 through 4.1.6: Test Fusion, Tasks, Data, Training** (P1 — QA)

*(Similar detailed stories for each module — follow the pattern above. Each story should test the happy path, edge cases, error cases, and round-trip serialization. See MILESTONES.md D-14.1 through D-14.5 for the full list.)*

---

### Epic 4.2: Integration Tests

> **Narrative:** Unit tests verify each brick. Integration tests verify the
> house stands up. We need an end-to-end test that goes: config → data →
> train → evaluate → save → load → predict. If any link in the chain breaks,
> we catch it here.

**Story 4.2.1: Full Pipeline Integration Test** (P0 — QA / ML Engineer)

*What to do:*
- Create `tests/integration/test_full_pipeline.py`
- Create a tiny synthetic dataset (20 examples, 2 classes) as a JSON fixture
- Test flow:
  1. Create `ExperimentConfig` with `distilbert-base-uncased`, 1 classification task
  2. Process data with `DataProcessor`
  3. Train for 2 epochs with `Trainer`
  4. Evaluate → get metrics dict with accuracy and F1
  5. Save model with `save_pretrained()`
  6. Load model with `InferenceHandler`
  7. Predict on test example → get valid label and confidence
- Repeat for NER, sentiment, regression task types

*Acceptance criteria:*
- [ ] Full pipeline completes without error for all task types
- [ ] Each run completes in under 60 seconds on CPU
- [ ] Metrics are non-zero (model learned something, even on tiny data)
- [ ] Saved model loads and produces predictions

*Notes:*
- NB: Use very small data (20 examples) and very few epochs (2) to keep tests fast. We are testing the pipeline, not model quality.
- Create fixture files in `tests/fixtures/` — small JSON files with sample data for each task type.

---

### Epic 4.3: CI/CD Setup

**Story 4.3.1: Create GitHub Actions Workflow** (P1 — DevOps)

*What to do:*
- Create `.github/workflows/test.yml`:
  - Trigger on push to `main` and on all PRs
  - Python 3.10+ matrix
  - Install dependencies from `requirements.txt` and `requirements-dev.txt`
  - Cache HuggingFace models (`~/.cache/huggingface/`)
  - Run `ruff check .` (linting)
  - Run `mypy jenga_ai/` (type checking)
  - Run `pytest tests/ --cov=jenga_ai --cov-report=xml`
  - Upload coverage to Codecov

*Acceptance criteria:*
- [ ] Workflow runs on every push and PR
- [ ] Tests pass in CI environment
- [ ] Coverage report is generated
- [ ] Failed tests block PR merging

---

## SPRINT 5: Backend — Foundation

**Goal:** Build the FastAPI server, database, authentication, and the project/
dataset management APIs. After this sprint, a user can register, log in,
create a project, and upload a dataset — all via API.

**Why this matters:** This is the bridge between the ML engine and the frontend.
The frontend has nothing to talk to without these APIs. Authentication is
especially critical — this is a national security platform.

**Depends on:** MS-1 config system (for Pydantic schemas)
**Blocks:** All other backend sprints, all frontend sprints

---

### Epic 5.1: FastAPI App Scaffold

> **Narrative:** We need a clean, production-grade FastAPI project structure.
> Not a single `main.py` with everything in it — proper separation into
> routers, models, schemas, services, and core modules. This is the skeleton
> that every backend developer will build on.

**Story 5.1.1: Create FastAPI Project Structure** (P0 — Backend Dev)

*What to do:*
- Create the full directory structure:
  ```
  backend/
  ├── app/
  │   ├── __init__.py
  │   ├── main.py              # FastAPI app, CORS, lifespan
  │   ├── config.py            # Settings from env vars (pydantic-settings)
  │   ├── api/
  │   │   ├── __init__.py
  │   │   └── v1/
  │   │       ├── __init__.py
  │   │       ├── auth.py
  │   │       ├── projects.py
  │   │       ├── datasets.py
  │   │       ├── training.py
  │   │       ├── inference.py
  │   │       ├── templates.py
  │   │       └── compute.py
  │   ├── models/               # SQLAlchemy ORM
  │   │   ├── __init__.py
  │   │   ├── user.py
  │   │   ├── project.py
  │   │   ├── dataset.py
  │   │   └── experiment.py
  │   ├── schemas/              # Pydantic request/response
  │   │   ├── __init__.py
  │   │   ├── auth.py
  │   │   ├── project.py
  │   │   ├── dataset.py
  │   │   └── training.py
  │   ├── services/             # Business logic
  │   │   ├── __init__.py
  │   │   ├── auth.py
  │   │   ├── config_generator.py
  │   │   └── training.py
  │   ├── workers/              # Celery tasks
  │   │   ├── __init__.py
  │   │   └── training_worker.py
  │   └── core/
  │       ├── __init__.py
  │       ├── database.py
  │       ├── security.py
  │       └── deps.py
  ├── alembic/
  │   ├── env.py
  │   └── versions/
  ├── alembic.ini
  ├── requirements.txt
  └── Dockerfile
  ```
- In `main.py`:
  - Create FastAPI app with title "Jenga-AI API", version "2.0"
  - Add CORS middleware (allow configurable origins)
  - Add request ID middleware (generate UUID per request for tracing)
  - Include all v1 routers under `/api/v1/` prefix
  - Add `/health` endpoint that returns `{"status": "ok"}`
  - Add lifespan handler for startup/shutdown (DB connections, etc.)
- In `config.py`:
  - Use `pydantic-settings` to load from environment variables
  - Fields: `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `CORS_ORIGINS`, `UPLOAD_DIR`

*Acceptance criteria:*
- [ ] `uvicorn backend.app.main:app --reload` starts without error
- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] `GET /docs` shows Swagger UI with all router prefixes
- [ ] CORS headers are present in responses
- [ ] Settings load from environment variables (with defaults for development)

*Notes:*
- NB: Use `pydantic-settings` (not plain pydantic) for the `Settings` class — it reads from env vars and `.env` files automatically.
- NB: Do NOT hardcode the database URL or secret key. Always use environment variables.
- Use API versioning (`/api/v1/`) from day one — we will need this later.

---

### Epic 5.2: Database Setup

> **Narrative:** We use PostgreSQL for durability and SQLAlchemy 2.0 for the ORM.
> Alembic handles schema migrations so we can evolve the database without
> data loss. Async SQLAlchemy is used because training jobs are long-running
> and we do not want database queries blocking the event loop.

**Story 5.2.1: Set Up SQLAlchemy + Alembic** (P0 — Backend Dev)

*What to do:*
- In `core/database.py`:
  - Create async engine with `create_async_engine(DATABASE_URL)`
  - Create async session factory with `async_sessionmaker`
  - Create `Base = declarative_base()` for all ORM models
  - Create `get_db()` async generator for dependency injection
- Initialize Alembic:
  - `alembic init backend/alembic`
  - Configure `alembic.ini` to read `DATABASE_URL` from environment
  - Configure `env.py` to use async engine and import all models

*Acceptance criteria:*
- [ ] `alembic revision --autogenerate -m "initial"` generates a migration
- [ ] `alembic upgrade head` applies migration without error
- [ ] `get_db()` returns a working async session
- [ ] Connection pooling is configured (min 5, max 20 connections)

*Notes:*
- For local development, use `postgresql+asyncpg://user:pass@localhost/jenga_ai`
- NB: Always import all ORM models in `alembic/env.py` — if a model is not imported, Alembic will not detect its table and will not generate a migration for it.

---

### Epic 5.3: Authentication System

> **Narrative:** This is a national security platform. Authentication is not
> optional. We use JWT tokens (access + refresh) with bcrypt password hashing.
> Access tokens expire in 30 minutes, refresh tokens in 7 days. Passwords
> are never stored in plaintext.

**Story 5.3.1: Build JWT Auth with Password Hashing** (P0 — Backend Dev)

*What to do:*
- In `core/security.py`:
  - `hash_password(password: str) -> str` using `passlib[bcrypt]`
  - `verify_password(plain: str, hashed: str) -> bool`
  - `create_access_token(data: dict, expires_delta: timedelta) -> str` using `python-jose`
  - `create_refresh_token(data: dict) -> str` (longer expiry)
  - `decode_token(token: str) -> dict` (verify signature, check expiry)
- In `models/user.py`:
  - `User` ORM model: id (UUID), email (unique), hashed_password, full_name, role (enum: admin/user), is_active, created_at, updated_at
- In `schemas/auth.py`:
  - `UserCreate(email, password, full_name)`
  - `UserLogin(email, password)`
  - `Token(access_token, refresh_token, token_type)`
  - `UserResponse(id, email, full_name, role, created_at)`
- In `api/v1/auth.py`:
  - `POST /register`: validate input, check email not taken, hash password, create user, return tokens
  - `POST /login`: verify email exists, verify password, return tokens
  - `POST /refresh`: verify refresh token, return new access token
  - `GET /me`: return current user (requires valid access token)
- In `core/deps.py`:
  - `get_current_user(token)`: decode JWT, fetch user from DB, return user object
  - This is used as a FastAPI dependency on all protected endpoints

*Acceptance criteria:*
- [ ] Register with valid data → 201 with tokens
- [ ] Register with duplicate email → 409 Conflict
- [ ] Register with weak password (< 8 chars) → 422 Validation Error
- [ ] Login with correct credentials → 200 with tokens
- [ ] Login with wrong password → 401 Unauthorized
- [ ] Access protected endpoint with valid token → 200
- [ ] Access protected endpoint with expired token → 401
- [ ] Refresh with valid refresh token → new access token
- [ ] Passwords are stored as bcrypt hashes (never plaintext)

*Notes:*
- NB: NEVER log passwords, even in debug mode. Log the email, but never the password.
- NB: Use `secrets.token_urlsafe(32)` to generate the SECRET_KEY, and put it in the `.env` file, never in code.
- NB: Rate-limit the login endpoint (5 attempts per minute per IP) to prevent brute force. Use a simple in-memory counter for now, Redis-backed later.

---

### Epic 5.4: Project & Dataset APIs

> **Narrative:** A "project" in Jenga-AI is a workspace where a user configures
> a model, uploads data, trains, and deploys. It stores the YAML config, the
> dataset references, and the experiment history. Users need full CRUD.

**Story 5.4.1: Build Project CRUD API** (P1 — Backend Dev)

*What to do:*
- In `models/project.py`:
  - `Project` ORM: id (UUID), name, description, user_id (FK to users), config_yaml (JSON), status (enum: draft/training/trained/deployed), created_at, updated_at
- In `schemas/project.py`:
  - `ProjectCreate(name, description, config: Optional[dict])`
  - `ProjectUpdate(name?, description?, config?)`
  - `ProjectResponse(id, name, description, status, created_at, updated_at)`
  - `ProjectListResponse(projects: list[ProjectResponse], total: int)`
- In `api/v1/projects.py`:
  - `POST /projects` — create, set status="draft", assign to current user
  - `GET /projects` — list current user's projects (paginated: `?page=1&size=20`)
  - `GET /projects/{id}` — get single project (verify ownership)
  - `PUT /projects/{id}` — update project (verify ownership)
  - `DELETE /projects/{id}` — soft-delete project (verify ownership)
- Alembic migration for projects table

*Acceptance criteria:*
- [ ] Create project → 201 with project data
- [ ] List projects returns only current user's projects (not other users')
- [ ] Get project by ID → 200 or 404
- [ ] Update project → 200 with updated data
- [ ] Delete project → 204 (soft delete, data retained in DB)
- [ ] Unauthorized access to another user's project → 403

---

**Story 5.4.2: Build Dataset Upload & Preview API** (P1 — Backend Dev)

*What to do:*
- In `models/dataset.py`:
  - `Dataset` ORM: id (UUID), project_id (FK), original_filename, stored_path, format (json/jsonl/csv), size_bytes, row_count, columns (JSON list), label_distribution (JSON), uploaded_at
- In `api/v1/datasets.py`:
  - `POST /datasets/upload` — accept multipart file upload
    - Validate file extension (json, jsonl, csv only)
    - Validate file size (< 500MB)
    - Save to `UPLOAD_DIR/{project_id}/{uuid}_{filename}`
    - Parse file to detect: row count, column names, label distribution
    - Store metadata in DB
  - `GET /datasets/{id}/preview` — return first 100 rows as JSON
  - `GET /datasets/{id}/labels` — return `{"label_distribution": {"positive": 450, "negative": 550}}`
  - `DELETE /datasets/{id}` — delete file and DB record

*Acceptance criteria:*
- [ ] Upload a 10MB CSV → 201 with metadata (row count, columns)
- [ ] Upload a 600MB file → 413 Payload Too Large
- [ ] Upload a .exe file → 422 Invalid Format
- [ ] Preview returns correct first 100 rows
- [ ] Label distribution is accurate
- [ ] Deleted dataset's file is removed from disk

*Notes:*
- NB: Sanitize filenames. A user could upload `../../etc/passwd.csv` — strip path components, only keep the filename.
- NB: Use `aiofiles` for async file writing to avoid blocking the event loop during large uploads.
- Store files in `UPLOAD_DIR/{project_id}/` to keep them organized by project.

---

## SPRINT 6: Backend — Training & Inference APIs

**Goal:** Connect the ML engine to the backend. Users submit training jobs via
API, Celery workers run them in the background, and WebSockets stream progress.
Users can also get predictions from trained models via the inference API.

**Depends on:** Sprint 5 (Backend Foundation), Sprints 1-3 (ML modules)
**Blocks:** Frontend Training Monitor, Frontend Inference UI

---

### Epic 6.1: Training Job Management

**Story 6.1.1: Build Training API + Celery Worker** (P0 — Backend Dev + ML Engineer)

*What to do:*
- In `api/v1/training.py`:
  - `POST /training/start` — accepts `{project_id, config_overrides?}`:
    1. Load project config from DB
    2. Apply any overrides
    3. Validate config using `ExperimentConfig` from jenga_ai
    4. Create `Experiment` record in DB (status="queued")
    5. Submit Celery task: `train_model.delay(experiment_id)`
    6. Return experiment_id
  - `GET /training/{id}/status` — return `{status, current_epoch, total_epochs, metrics}`
  - `POST /training/{id}/stop` — send cancel signal to Celery task
  - `GET /training/{id}/metrics` — return full metrics history
  - `GET /training/{id}/logs` — return training logs

- In `workers/training_worker.py`:
  - `@celery_app.task def train_model(experiment_id)`:
    1. Load experiment config from DB
    2. Load dataset from storage
    3. Initialize `DataProcessor`, `MultiTaskModel`, `Trainer` from jenga_ai
    4. Register a custom callback that writes metrics to DB after each epoch
    5. Call `trainer.train()`
    6. On success: save model, update status="completed", store final metrics
    7. On failure: update status="failed", store error message and traceback
    8. On cancellation: update status="cancelled"

*Acceptance criteria:*
- [ ] `POST /training/start` returns experiment_id immediately (does not block)
- [ ] Celery worker picks up the job and starts training
- [ ] Status endpoint shows "queued" → "running" → "completed" progression
- [ ] Metrics endpoint shows epoch-by-epoch metrics
- [ ] Stop endpoint cancels a running training job
- [ ] Failed training stores the error message for debugging

*Notes:*
- NB: The Celery worker runs in a separate process. It must be able to import `jenga_ai` — ensure the Python path is set correctly.
- NB: Training can take hours. The worker must update the DB periodically (every epoch) so the status endpoint has fresh data. Use a custom Jenga-AI callback for this.
- NB: Handle GPU memory carefully — if a worker crashes from OOM, it should update the status to "failed" with a clear message, not leave the job stuck as "running" forever.

---

### Epic 6.2: Config Generator Service

**Story 6.2.1: Build UI-to-YAML Config Generator** (P1 — Backend Dev)

*What to do:*
- In `services/config_generator.py`:
  - `generate_config(wizard_data: dict) -> ExperimentConfig`:
    - Map `wizard_data["model"]` → `ModelConfig.base_model` (e.g., "swahili-bert" → "naynek/SwahiliBERT")
    - Map `wizard_data["tasks"]` → list of `TaskConfig` objects
    - Map `wizard_data["fusion"]` → `FusionConfig` (or None for single-task)
    - Map `wizard_data["compression"]` → LoRA/quantization settings
    - Map `wizard_data["training"]` → `TrainingConfig` fields
    - Validate the generated config (Pydantic does this automatically)
    - Return the config object
  - `config_to_yaml(config: ExperimentConfig) -> str`: serialize to YAML string

*Acceptance criteria:*
- [ ] Wizard data with single task, no fusion → valid config with `fusion: null`
- [ ] Wizard data with 3 tasks + attention fusion → valid config
- [ ] Invalid wizard data (missing model) → clear error message
- [ ] Generated YAML can be loaded back with `ExperimentConfig.from_yaml()`

---

### Epic 6.3: Real-time Progress (WebSockets)

**Story 6.3.1: Build WebSocket Training Progress Stream** (P1 — Backend Dev)

*What to do:*
- Add a WebSocket endpoint: `WS /api/v1/training/{id}/ws`
  - Client connects with JWT token (validate on connect)
  - Server subscribes to Redis pub/sub channel `training:{experiment_id}`
  - Training worker publishes updates to this channel every epoch:
    ```json
    {"epoch": 3, "total_epochs": 10, "train_loss": 0.42, "eval_loss": 0.51, "metrics": {"accuracy": 0.83}}
    ```
  - Server forwards messages to connected WebSocket clients
  - On training complete: send `{"status": "completed", "final_metrics": {...}}` and close

*Acceptance criteria:*
- [ ] WebSocket connects with valid JWT
- [ ] WebSocket rejects invalid/expired JWT
- [ ] Client receives epoch updates in real-time
- [ ] Multiple clients can connect to the same training job
- [ ] Connection is cleaned up when training completes

*Notes:*
- Use Redis pub/sub for worker → WebSocket communication. The worker publishes, the WebSocket endpoint subscribes. This decouples them cleanly.
- NB: Handle disconnects gracefully — if the client disconnects and reconnects, it should receive the latest state, not miss updates.

---

### Epic 6.4: Inference API

**Story 6.4.1: Build Inference Endpoints** (P1 — Backend Dev)

*What to do:*
- In `api/v1/inference.py`:
  - `POST /inference/predict` — `{"model_id": "uuid", "text": "some text", "task_name": "classification"}`:
    - Load model using `InferenceHandler` (cached — do not reload per request)
    - Run prediction
    - Return `{"label": "...", "confidence": 0.94, "probabilities": {...}}`
  - `POST /inference/batch` — upload CSV file:
    - Read CSV, extract text column
    - Run batch prediction
    - Return CSV with predictions added as new columns
  - `GET /inference/models` — list deployed models (name, task types, creation date)

*Acceptance criteria:*
- [ ] Single prediction returns in < 500ms for short text
- [ ] Batch prediction handles 1000 rows without timeout
- [ ] Model is cached after first load (second request is faster)
- [ ] Invalid model_id returns 404
- [ ] Invalid task_name returns 400 with available task names

---

## SPRINT 7: Backend — Templates & Compute

**Goal:** Provide pre-built security templates (one-click setup for common
threat detection tasks) and compute marketplace (choose where to train: our
server, RunPod, Colab, Kaggle, or download).

**Depends on:** Sprint 5 (Backend Foundation), Sprint 3 (Export)
**Blocks:** Frontend Templates UI, Frontend Compute UI

---

### Epic 7.1: Security Templates

**Story 7.1.1: Build Template CRUD + Pre-built Templates** (P1 — Backend Dev + ML Engineer)

*What to do:*
- Create template model and CRUD endpoints (see MILESTONES.md MS-19)
- Seed the database with 5 pre-built templates:
  1. **Hate Speech Detection** — Swahili + English, 5 classes (hate, offensive, threat, harassment, neutral), SwahiliBERT base, single-label classification
  2. **Phishing Email Detection** — email text, 3 classes (phishing, spam, legitimate), DistilBERT, multi-label (can be both phishing AND spam)
  3. **Network Threat Classification** — log text, 6 classes (DDoS, malware, phishing, brute_force, exfiltration, normal), BERT-base, with focal loss for class imbalance
  4. **M-Pesa Fraud Detection** — transaction description, binary (fraud/legitimate), SwahiliDistilBERT, with adversarial training
  5. **Corruption Indicator Detection** — document text, multi-task: classification (corrupt/clean) + NER (person, org, amount, date), SwahiliBERT, attention fusion
- Each template includes: name, description, category, icon name, full `ExperimentConfig` as YAML

*Acceptance criteria:*
- [ ] `GET /templates` returns all 5 templates
- [ ] `GET /templates?category=security` filters correctly
- [ ] Each template's config is a valid `ExperimentConfig` (can be deserialized)
- [ ] `POST /templates` (admin only) allows creating custom templates

*Notes:*
- NB: Template configs should reference dataset placeholders, not actual file paths. The user will upload their own data.
- The corruption detection template is a good showcase of multi-task fusion — it demonstrates why our platform exists.

---

### Epic 7.2: Compute Marketplace

**Story 7.2.1: Build Compute Options API** (P2 — Backend Dev)

*What to do:*
- In `api/v1/compute.py`:
  - `GET /compute/options` — return available compute options:
    ```json
    [
      {"id": "platform", "name": "Train on Platform", "description": "Use our GPU server", "available": true},
      {"id": "runpod", "name": "Train on RunPod", "description": "Cloud GPU rental", "requires_api_key": true},
      {"id": "colab", "name": "Google Colab", "description": "Free GPU notebook", "type": "notebook"},
      {"id": "kaggle", "name": "Kaggle", "description": "Free GPU notebook", "type": "notebook"},
      {"id": "download", "name": "Download", "description": "Download model + training script", "type": "download"}
    ]
    ```
  - `POST /compute/notebook/generate` — `{"project_id": "uuid", "platform": "colab"}`:
    - Load project config
    - Call `notebook_gen.generate_notebook(config, platform)`
    - Return notebook file as download
  - `POST /compute/export` — `{"project_id": "uuid"}`:
    - Call `model_export.export_model()`
    - Return zip file as download

*Acceptance criteria:*
- [ ] Compute options endpoint returns all 5 options
- [ ] Notebook generation returns a valid .ipynb file
- [ ] Model export returns a valid .zip file
- [ ] Files are served with correct Content-Type headers

---

## SPRINT 8: Frontend — Foundation

**Goal:** Set up the React application with all the infrastructure: routing,
state management, API client, UI components, and the layout shell. After this
sprint, a developer can add pages by simply creating a component and adding
a route — all the plumbing is in place.

**Depends on:** Sprint 5 (Backend auth API — for testing login flow)
**Blocks:** All frontend feature sprints

---

### Epic 8.1: React Project Setup

**Story 8.1.1: Initialize React + Vite + TypeScript Project** (P0 — Frontend Dev)

*What to do:*
- Run `npm create vite@latest frontend -- --template react-ts`
- Install core dependencies:
  ```
  npm install react-router-dom@6 zustand @tanstack/react-query axios
  npm install tailwindcss @tailwindcss/vite
  npm install -D @types/react @types/react-dom
  ```
- Install shadcn/ui: `npx shadcn@latest init`
- Configure `vite.config.ts`:
  - Dev server proxy: `/api` → `http://localhost:8000`
  - This way the frontend calls `/api/v1/auth/login` and Vite proxies to the backend
- Configure `tsconfig.json`:
  - `strict: true`
  - Path aliases: `@/` → `src/`
- Configure TailwindCSS:
  - Add Jenga-AI brand colors to `tailwind.config.ts` (primary: deep blue, accent: amber, success: green, danger: red)
  - Set up dark mode toggle support (`class` strategy)

*Acceptance criteria:*
- [ ] `npm run dev` starts without errors
- [ ] `http://localhost:5173` shows the default page
- [ ] TypeScript compilation is strict (no `any` without explicit annotation)
- [ ] TailwindCSS classes work in components
- [ ] shadcn/ui Button component renders correctly
- [ ] API proxy forwards `/api/*` to backend

*Notes:*
- NB: Use path aliases (`@/components/...`) from day one. Relative imports like `../../../components` become unmanageable fast.
- NB: Set up `.env` file with `VITE_API_URL=http://localhost:8000` as fallback for when proxy is not available.

---

### Epic 8.2: API Client & Auth State

**Story 8.2.1: Build API Client with JWT Interceptors** (P0 — Frontend Dev)

*What to do:*
- Create `src/api/client.ts`:
  - Axios instance with base URL from env
  - Request interceptor: attach `Authorization: Bearer {token}` header
  - Response interceptor: on 401, attempt token refresh, then retry original request
  - If refresh also fails → redirect to login
- Create `src/store/authStore.ts` (Zustand):
  - State: `user`, `accessToken`, `refreshToken`, `isAuthenticated`
  - Actions: `login(email, password)`, `register(...)`, `logout()`, `refreshToken()`
  - Persist tokens to `localStorage` (so page refresh does not log out)
- Create `src/api/auth.ts`:
  - `loginApi(email, password) -> Token`
  - `registerApi(data) -> Token`
  - `refreshApi(refreshToken) -> Token`
  - `getMeApi() -> User`

*Acceptance criteria:*
- [ ] After login, all API calls include the JWT token
- [ ] On 401 response, token is refreshed automatically
- [ ] After refresh failure, user is redirected to login
- [ ] Page refresh preserves login state (tokens in localStorage)
- [ ] Logout clears all tokens and state

*Notes:*
- NB: Never store tokens in cookies accessible to JavaScript (XSS risk). localStorage is acceptable for JWTs in this context because our CSP prevents XSS.
- NB: The refresh interceptor must handle concurrent requests — if 3 requests get 401 simultaneously, only trigger ONE refresh, then retry all 3 with the new token.

---

### Epic 8.3: Layout Components

> **Narrative:** The layout is the shell that every page lives inside.
> A sidebar for navigation, a header with the user's info, and a content
> area. This should feel professional and be responsive (work on mobile too,
> since field officers may use tablets).

**Story 8.3.1: Build App Layout with Sidebar Navigation** (P0 — Frontend Dev)

*What to do:*
- Create `src/components/layout/AppLayout.tsx`:
  - Flexbox layout: sidebar (fixed width 240px) + main content (flex-1)
  - Renders `<Sidebar />`, `<Header />`, `<Outlet />` (React Router)
- Create `src/components/layout/Sidebar.tsx`:
  - Navigation links with icons (use `lucide-react` icons):
    - Dashboard (LayoutDashboard icon)
    - Projects (FolderOpen icon)
    - Templates (Shield icon)
    - Compute (Cpu icon)
    - Settings (Settings icon)
  - Active route highlighting (bold + background color)
  - Collapsible on mobile (hamburger menu in header)
  - Jenga-AI logo at the top
- Create `src/components/layout/Header.tsx`:
  - Breadcrumbs showing current path
  - User avatar + dropdown (profile, settings, logout)
  - Notification bell icon (placeholder for now)
  - Mobile: hamburger menu button to toggle sidebar

*Acceptance criteria:*
- [ ] Sidebar shows on desktop, collapses on mobile (< 768px)
- [ ] Clicking a nav link navigates to the correct route
- [ ] Active route is visually highlighted
- [ ] User dropdown shows email and logout option
- [ ] Logout redirects to login page

---

### Epic 8.4: Reusable Component Library

> **Narrative:** These are the building blocks that every page will use. Building
> them once (properly) saves dozens of hours later. Every page needs tables,
> loading states, error handling, file uploading, and status indicators.

**Story 8.4.1: Build Core Reusable Components** (P1 — Frontend Dev)

*What to do:*
- Create each component in `src/components/common/`:
  - **PageHeader.tsx** — `<PageHeader title="Projects" subtitle="Manage your NLP projects" actions={<Button>New Project</Button>} />`
  - **EmptyState.tsx** — centered illustration + "No projects yet" + "Create your first project" button. Used when lists are empty.
  - **LoadingSpinner.tsx** — centered spinner with optional `message` prop. Used during API calls.
  - **ErrorBoundary.tsx** — catches React render errors, shows friendly message + "Try again" button. Wraps every page.
  - **ConfirmDialog.tsx** — "Are you sure you want to delete this project?" dialog with Cancel/Confirm buttons. Uses shadcn Dialog.
  - **FileUploader.tsx** — drag-and-drop zone + click-to-browse. Shows file name, size, upload progress bar. Accepts `accept` prop for file type filtering.
  - **DataTable.tsx** — wraps shadcn Table. Props: `columns`, `data`, `pagination`, `sorting`. Handles empty state, loading state.
  - **StatusBadge.tsx** — `<StatusBadge status="running" />` renders a green pulsing dot + "Running" text. Statuses: queued (gray), running (green pulse), completed (blue check), failed (red x).
  - **MetricCard.tsx** — small card: big number, label below, optional trend arrow. Used on dashboard for stats.
  - **SearchInput.tsx** — input with search icon, debounced onChange (300ms). Used on list pages.

*Acceptance criteria:*
- [ ] Each component has TypeScript props interface
- [ ] Each component handles edge cases (empty strings, null data)
- [ ] FileUploader shows drag-over visual feedback
- [ ] DataTable renders 0 rows with EmptyState, not a blank table
- [ ] StatusBadge renders all 4 statuses with correct colors
- [ ] All components use Tailwind + shadcn/ui (no custom CSS files)

*Notes:*
- NB: Every component should accept a `className` prop for additional styling. This is the Tailwind convention.
- NB: Use `React.forwardRef` on input components so they work with form libraries.

---

**Story 8.4.2: Build Chart Components** (P2 — Frontend Dev)

*What to do:*
- Install Recharts: `npm install recharts`
- Create `src/components/common/LineChart.tsx`:
  - Props: `data`, `xKey`, `yKeys` (array for multiple lines), `title`, `colors`
  - Uses Recharts `LineChart`, `XAxis`, `YAxis`, `Tooltip`, `Legend`
  - Responsive container that fills parent width
- Create `src/components/common/BarChart.tsx`:
  - Props: `data`, `xKey`, `yKey`, `title`, `color`
  - Horizontal or vertical orientation
- Create `src/components/common/PieChart.tsx`:
  - Props: `data` (array of `{name, value}`), `title`, `colors`
  - Shows percentage labels

*Acceptance criteria:*
- [ ] LineChart renders multiple lines with legend
- [ ] BarChart renders horizontal and vertical orientations
- [ ] PieChart shows percentage labels
- [ ] All charts are responsive (resize with container)
- [ ] Chart colors match Jenga-AI brand palette

---

## SPRINT 9: Frontend — Auth & Dashboard

**Goal:** Users can register, log in, and see their dashboard. First impression.

**Depends on:** Sprint 8 (Frontend Foundation), Sprint 5 (Backend Auth API)
**Blocks:** All authenticated frontend features

---

### Epic 9.1: Auth Pages

**Story 9.1.1: Build Login Page** (P0 — Frontend Dev)

*What to do:*
- Create `src/pages/auth/LoginPage.tsx`:
  - Centered card layout (not full-width — centered on screen with background)
  - Jenga-AI logo at top
  - Email input with validation (required, email format)
  - Password input with show/hide toggle
  - "Log in" button (disabled while loading, shows spinner)
  - "Don't have an account? Register" link
  - Error message display (red text below form) for invalid credentials
  - On success: redirect to `/dashboard`
- Style: clean, professional, Jenga-AI brand colors

*Acceptance criteria:*
- [ ] Empty form submission shows validation errors
- [ ] Invalid email format shows "Enter a valid email" error
- [ ] Wrong credentials show "Invalid email or password" error
- [ ] Successful login redirects to dashboard
- [ ] Loading state shows spinner on button
- [ ] Tab key navigates between fields correctly

---

**Story 9.1.2: Build Register Page** (P0 — Frontend Dev)

*What to do:*
- Create `src/pages/auth/RegisterPage.tsx`:
  - Same centered card layout as login
  - Fields: Full name, Email, Password, Confirm password
  - Password strength indicator (weak/medium/strong)
  - Validation: passwords match, email format, name not empty, password >= 8 chars
  - On success: auto-login and redirect to dashboard
  - "Already have an account? Log in" link

*Acceptance criteria:*
- [ ] Mismatched passwords show error
- [ ] Weak password shows strength indicator
- [ ] Successful registration auto-logs in and redirects to dashboard

---

### Epic 9.2: Dashboard

**Story 9.2.1: Build Main Dashboard** (P1 — Frontend Dev)

*What to do:*
- Create `src/pages/dashboard/DashboardPage.tsx`:
  - Welcome banner: "Welcome back, {user.full_name}" with a waving hand illustration
  - Stats row (3 MetricCards):
    - Total Projects (fetched from API)
    - Active Training Jobs (fetched from API)
    - Deployed Models (fetched from API)
  - "Quick Start" section: 3 template cards (top security templates) with "Use Template" buttons
  - "Recent Projects" section: grid of project cards (name, status badge, last modified, task type icons)
  - "New Project" card with large + icon (links to `/projects/new`)
  - Empty state if no projects: "Start by creating your first project"

*Acceptance criteria:*
- [ ] Dashboard loads in < 2 seconds
- [ ] Stats show correct counts from API
- [ ] Recent projects show the user's latest 6 projects
- [ ] "New Project" card links to project wizard
- [ ] Template cards link to pre-filled project wizard
- [ ] Empty state shows when user has no projects

---

## SPRINT 10: Frontend — Project Wizard

**Goal:** The project wizard is the heart of the non-technical user experience.
A 6-step guided flow that takes a user from "I want to detect fraud" to
"my model is training" without writing a single line of code.

**Depends on:** Sprint 8 (Components), Sprint 5-6 (Backend APIs)
**Blocks:** Training Monitor (needs a training job to monitor)

---

### Epic 10.1: Wizard Framework

**Story 10.1.1: Build Multi-Step Wizard Container** (P0 — Frontend Dev)

*What to do:*
- Create `src/pages/projects/ProjectWizard.tsx`:
  - Step progress indicator at top (circles connected by lines, filled/outlined for current/completed/future)
  - Steps: 1. Model → 2. Tasks → 3. Mode → 4. Data → 5. Config → 6. Review
  - Back/Next/Cancel buttons at bottom
  - Form state persisted in Zustand store (`wizardStore.ts`)
  - Each step validates before allowing "Next"
  - "Cancel" shows ConfirmDialog: "Are you sure? Your progress will be lost."

*Acceptance criteria:*
- [ ] Progress indicator shows current step highlighted
- [ ] "Next" is disabled until current step is valid
- [ ] "Back" preserves previous selections
- [ ] "Cancel" asks for confirmation before discarding
- [ ] State persists across steps (no data loss when going back)

---

**Story 10.1.2 through 10.1.7: Build Each Wizard Step** (P0 — Frontend Dev)

*(Each step is a separate story — Model Selection, Task Selection, Fusion Choice, Dataset Upload, Configuration, Review. See MILESTONES.md MS-24 for full details. Each story follows the same pattern: build component, wire to wizard state, validate inputs, show preview/summary.)*

**NB for Step 4 (Dataset Upload):** This is the most complex step. It must:
1. Show a drag-and-drop zone (use FileUploader component)
2. After upload, call the backend upload API
3. Show preview table (first 10 rows) from the preview API
4. Let user select which column is "text" and which is "label" via dropdowns
5. Show label distribution bar chart
6. Optionally toggle PII redaction on/off

**NB for Step 5 (Configuration):** Provide two modes:
- **Simple mode** (default): 3 sliders — learning rate, epochs, batch size. Pre-set to sensible defaults.
- **Advanced mode** (toggle): Full config editor with all TrainingConfig fields. Consider using a YAML code editor (Monaco Editor) for power users.

**NB for Step 6 (Review):** Show a summary card of ALL selections. This is the last chance to catch mistakes. Include: model name, task types, dataset name + row count, fusion mode, config summary. Big green "Start Training" button at the bottom.

---

## SPRINT 11: Frontend — Training Monitor

**Goal:** Real-time training visualization. Users watch their model learn
through live-updating loss charts, progress bars, and console logs.

**Depends on:** Sprint 10 (Wizard triggers training), Sprint 6 (WebSocket API)
**Blocks:** Nothing (this is a leaf feature)

---

### Epic 11.1: Live Training View

**Story 11.1.1: Build Real-Time Training Monitor** (P0 — Frontend Dev)

*What to do:*
- Create `src/pages/training/TrainingMonitorPage.tsx`:
  - Connect to WebSocket `ws://localhost:8000/api/v1/training/{id}/ws`
  - Status banner: animated "Training in progress" with epoch counter
  - Progress bar: `{current_epoch} / {total_epochs}` with percentage
  - Training loss line chart (updates after each epoch via WebSocket)
  - Validation loss line chart (overlaid on same chart, different color)
  - Per-task metrics line chart (accuracy/F1 for each task)
  - Console log panel: scrollable, monospace, auto-scrolls to bottom
  - "Stop Training" button (red, with confirmation dialog)
  - Connection indicator: green dot = connected, red dot = disconnected
  - Auto-reconnect: if WebSocket disconnects, retry every 5 seconds

*Acceptance criteria:*
- [ ] Charts update in real-time as training progresses
- [ ] Progress bar shows correct percentage
- [ ] Console shows training logs with timestamps
- [ ] Stop button sends stop request and updates UI
- [ ] Disconnection shows red indicator and auto-reconnects
- [ ] Page works if opened mid-training (loads historical data first)

*Notes:*
- NB: When the page opens mid-training, first call `GET /training/{id}/metrics` to get historical data, then connect WebSocket for live updates. Otherwise the charts start empty.
- NB: Limit chart data points to last 100 epochs. For very long training runs, downsample older data to prevent chart slowdown.

---

## SPRINT 12: Frontend — Inference & Templates & Compute

**Goal:** Complete all remaining frontend pages: inference testing, template
gallery, and compute marketplace.

**Depends on:** Sprint 8 (Components), Sprint 6-7 (Backend APIs)

---

### Epic 12.1: Inference UI

**Story 12.1.1: Build Inference Testing Page** (P1 — Frontend Dev)

*What to do:*
- Create `src/pages/inference/InferencePage.tsx`:
  - Model selector dropdown (list from `GET /inference/models`)
  - Large text input area (textarea, 5+ rows)
  - "Predict" button
  - Results panel that shows:
    - Classification: label name + confidence bar (filled percentage)
    - NER: original text with highlighted entities (colored spans, tooltip with entity type)
    - Sentiment: score gauge (semicircle meter from negative to positive)
  - "Batch Predict" tab: CSV upload → download results

*Acceptance criteria:*
- [ ] Single prediction shows results in < 1 second
- [ ] NER entities are highlighted with distinct colors per entity type
- [ ] Confidence bar fills proportionally
- [ ] Batch upload accepts CSV and returns downloadable CSV

---

### Epic 12.2: Template Gallery

**Story 12.2.1: Build Template Gallery Page** (P1 — Frontend Dev)

*What to do:*
- Create `src/pages/templates/TemplateGalleryPage.tsx`:
  - Fetch templates from `GET /templates`
  - Grid of template cards (3 columns on desktop, 1 on mobile)
  - Each card: icon, template name, category badge, short description, "Use Template" button
  - Category filter tabs at top: All | Security | Agriculture | Finance | Custom
  - Search input to filter by name
  - Clicking "Use Template" → navigate to Project Wizard pre-filled with template config

*Acceptance criteria:*
- [ ] All templates display with correct info
- [ ] Category filter works
- [ ] Search filters by name
- [ ] "Use Template" navigates to pre-filled wizard

---

### Epic 12.3: Compute Marketplace

**Story 12.3.1: Build Compute Options Page** (P2 — Frontend Dev)

*What to do:*
- Create `src/pages/compute/ComputeMarketplacePage.tsx`:
  - Grid of compute option cards (from `GET /compute/options`)
  - Each card: icon, name, description, action button
  - "Train on Platform": shows GPU queue status, "Start" button
  - "Train on RunPod": API key input field, GPU selector, cost estimate, "Launch" button
  - "Open in Colab": "Generate Notebook" button → downloads .ipynb
  - "Open in Kaggle": "Generate Notebook" button → downloads .ipynb
  - "Download Model": "Export" button → downloads .zip

*Acceptance criteria:*
- [ ] All compute options display
- [ ] Colab/Kaggle buttons download valid notebook files
- [ ] Export button downloads valid zip file
- [ ] RunPod API key is masked (password field)

---

## SPRINT 13: Experiment Tracking Integration

**Goal:** Connect MLflow and TensorBoard for experiment tracking. Users can
compare training runs, log parameters and metrics, and visualize embeddings.

**Depends on:** Sprint 6 (Training API)

---

### Epic 13.1: MLflow Integration

**Story 13.1.1: Integrate MLflow Tracking** (P2 — ML Engineer / Backend Dev)

*What to do:*
- In the Celery training worker, add MLflow logging:
  - `mlflow.set_experiment(project_name)`
  - `mlflow.start_run(run_name=experiment_name)`
  - Log all config parameters: `mlflow.log_params(config.to_dict())`
  - After each epoch: `mlflow.log_metrics({"train_loss": ..., "eval_f1": ...}, step=epoch)`
  - After training: `mlflow.log_artifact(model_path)` — log the model
  - Register model in MLflow Model Registry
- Add MLflow UI endpoint to docker-compose (port 5000)
- Link from the frontend Training Monitor to MLflow UI

*Acceptance criteria:*
- [ ] Training runs appear in MLflow UI
- [ ] Parameters, metrics, and artifacts are logged correctly
- [ ] Experiment comparison works (select 2+ runs, compare metrics)
- [ ] Model registry shows trained models with version numbers

---

## SPRINT 14: DevOps — Docker & CI/CD

**Goal:** One command to run the entire platform: `docker-compose up`.
Automated testing on every push. No "works on my machine" problems.

**Depends on:** All previous sprints (this packages everything)

---

### Epic 14.1: Docker Setup

**Story 14.1.1: Create Docker Compose Stack** (P1 — DevOps)

*What to do:*
- Create `backend/Dockerfile`:
  - Multi-stage: build stage (install deps) + runtime stage (slim image)
  - Copy only necessary files (not tests, docs, etc.)
  - Run with `uvicorn` in production mode
- Create `frontend/Dockerfile`:
  - Multi-stage: build stage (npm build) + runtime stage (nginx)
  - Copy built static files to nginx html directory
  - Nginx config: serve static files, proxy `/api/*` to backend
- Create `docker-compose.yml`:
  ```yaml
  services:
    frontend: port 3000
    backend: port 8000
    celery-worker: (same image as backend, different command)
    postgres: port 5432, volume for data
    redis: port 6379
    mlflow: port 5000 (optional)
  ```
- Create `.env.example` with all required environment variables
- Add health checks to all services

*Acceptance criteria:*
- [ ] `docker-compose up` starts all services
- [ ] Frontend is accessible at `http://localhost:3000`
- [ ] Backend API is accessible at `http://localhost:8000`
- [ ] Database data persists across restarts (volume)
- [ ] `.env.example` documents all required variables

*Notes:*
- NB: Use `depends_on` with `condition: service_healthy` to ensure services start in order (postgres → backend → celery).
- NB: The Celery worker needs GPU access for training. Use `deploy.resources.reservations.devices` for NVIDIA GPU passthrough in Docker Compose.

---

### Epic 14.2: CI/CD Pipeline

**Story 14.2.1: Set Up GitHub Actions** (P1 — DevOps)

*What to do:*
- Create `.github/workflows/ci.yml`:
  - On push to main + all PRs
  - Jobs:
    1. **Lint**: `ruff check .` + `mypy jenga_ai/`
    2. **Test**: `pytest tests/ --cov` (Python 3.10, 3.11)
    3. **Frontend**: `npm run lint` + `npm run build` + `npm run test`
    4. **Docker**: build all images (verify they build, do not push)
  - Cache: pip packages, npm packages, HuggingFace models
  - Required status checks for PR merging

*Acceptance criteria:*
- [ ] All jobs run on every PR
- [ ] Failed jobs block PR merging
- [ ] Cache reduces CI time by > 50% on repeat runs
- [ ] Coverage report is posted as PR comment

---

## SPRINT 15: Documentation & Polish

**Goal:** Write the docs so people can actually use what we have built. No
feature is complete until it is documented.

**Depends on:** All feature sprints

---

### Epic 15.1: Documentation

**Story 15.1.1: Write Developer Getting Started Guide** (P1 — Tech Writer / ML Engineer)

*What to do:*
- Create `docs/getting-started.md`:
  - Prerequisites (Python 3.10+, pip, git)
  - Installation (`pip install -e .` from source)
  - First training run (5-minute tutorial):
    1. Create a config YAML (provide example)
    2. Create a small dataset (provide 20-example JSON)
    3. Run training (Python script, 10 lines)
    4. Run inference (Python script, 5 lines)
  - Link to API reference for more details

*Acceptance criteria:*
- [ ] A new developer can follow the guide and train a model in under 10 minutes
- [ ] All code examples actually run without errors (test them!)
- [ ] No assumptions about prior knowledge beyond basic Python

---

**Story 15.1.2: Write Non-Technical User Guide** (P1 — Tech Writer / Frontend Dev)

*What to do:*
- Create `docs/user-guide.md`:
  - Account creation (screenshots of register page)
  - Creating your first project (screenshots of each wizard step)
  - Uploading data (supported formats, column requirements)
  - Monitoring training (what the charts mean)
  - Testing your model (how to use inference page)
  - Using templates (screenshot of gallery)
  - Exporting your model (what the zip contains, how to deploy)

*Acceptance criteria:*
- [ ] A non-technical government analyst can follow the guide and build a model
- [ ] Every step has a screenshot
- [ ] Jargon is explained in plain language (or linked to glossary)

---

**Story 15.1.3: Create Example Notebooks** (P2 — ML Engineer)

*What to do:*
- Create 5 priority example notebooks in `examples/`:
  1. `01_single_task_classification.ipynb` — SwahiliBERT + hate speech detection
  2. `02_multi_task_fusion.ipynb` — 3 tasks with attention fusion
  3. `03_ner_entity_extraction.ipynb` — NER with SwahiliBERT
  4. `04_continual_learning.ipynb` — train task A, add task B, verify no forgetting
  5. `05_model_compression.ipynb` — LoRA + quantization + export

*Acceptance criteria:*
- [ ] Each notebook runs end-to-end in Google Colab
- [ ] Each notebook has markdown explanations between code cells
- [ ] Outputs are included (cell outputs saved in .ipynb)

---

# APPENDIX: Sprint Dependency Map

```
Sprint 1 (LLM Module)
  └─→ Sprint 2 (Inference) ─→ Sprint 3 (Export)
                                   └─→ Sprint 7 (Templates & Compute)
Sprint 4 (Tests) ← depends on Sprints 1-3
Sprint 5 (Backend Foundation)
  ├─→ Sprint 6 (Training & Inference APIs) ← depends on Sprints 1-3
  ├─→ Sprint 7 (Templates & Compute) ← depends on Sprint 3
  └─→ Sprint 8 (Frontend Foundation)
        ├─→ Sprint 9 (Auth & Dashboard)
        ├─→ Sprint 10 (Project Wizard) ← depends on Sprint 6
        ├─→ Sprint 11 (Training Monitor) ← depends on Sprint 6
        └─→ Sprint 12 (Inference & Templates UI) ← depends on Sprint 6-7
Sprint 13 (Tracking) ← depends on Sprint 6
Sprint 14 (DevOps) ← depends on all feature sprints
Sprint 15 (Docs) ← depends on all feature sprints
```

---

# APPENDIX: Team Role Mapping

| Role | Primary Sprints | Skills Needed |
|------|----------------|---------------|
| **ML Engineer** | 1, 2, 3, 4, 13 | PyTorch, Transformers, PEFT, training loops, loss functions |
| **Backend Dev** | 5, 6, 7 | FastAPI, SQLAlchemy, Celery, Redis, WebSockets, PostgreSQL |
| **Frontend Dev** | 8, 9, 10, 11, 12 | React, TypeScript, TailwindCSS, Recharts, WebSockets, Zustand |
| **DevOps** | 4 (CI), 14 | Docker, GitHub Actions, nginx, PostgreSQL admin |
| **QA** | 4, (all sprints) | pytest, Playwright/Cypress, test design, coverage analysis |
| **Tech Writer** | 15 | Technical writing, screenshots, Jupyter notebooks |

---

# APPENDIX: Parallel Work Streams

These sprints can run **in parallel** with the right team:

| Time | Stream A (ML) | Stream B (Backend) | Stream C (Frontend) |
|------|--------------|-------------------|-------------------|
| Week 1-2 | Sprint 1 (LLM) | Sprint 5 (Foundation) | — |
| Week 3 | Sprint 2 (Inference) | Sprint 5 (cont.) | Sprint 8 (FE Setup) |
| Week 4 | Sprint 3 (Export) | Sprint 6 (Training API) | Sprint 9 (Auth + Dashboard) |
| Week 5 | Sprint 4 (Tests) | Sprint 7 (Templates) | Sprint 10 (Wizard) |
| Week 6 | Sprint 4 (cont.) | Sprint 6 (cont.) | Sprint 11 (Monitor) |
| Week 7 | Sprint 13 (Tracking) | — | Sprint 12 (Inference UI) |
| Week 8 | — | Sprint 14 (DevOps) | Sprint 14 (DevOps) |
| Week 9 | Sprint 15 (Docs) | Sprint 15 (Docs) | Sprint 15 (Docs) |
