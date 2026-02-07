# Jenga-AI V2: Complete Rebuild Plan

## Overview

This plan covers a **complete fresh rebuild** of the Jenga-AI framework, addressing every weakness found in V1 while preserving its strengths. We build from the ML core outward to the web platform.

---

## Part 1: Analysis of V1 Weaknesses (What We Fix)

### 1.1 Core ML Framework Issues

**model.py - MultiTaskModel:**
- Hidden size `768` is hardcoded in classification tasks (`nn.Linear(768, num_labels)`) instead of reading from `config.hidden_size` - breaks with any non-BERT-base model
- `forward()` uses `**kwargs` to pass labels which is fragile and undocumented
- No gradient clipping support
- No mixed-precision (AMP) training support
- `get_input_embeddings()` hardcodes `self.encoder.embeddings.word_embeddings` - fails for models with different embedding paths
- No model saving/loading built into the class
- No device management - tensors created inside forward (fusion) may land on wrong device

**fusion.py - AttentionFusion:**
- Creates a new tensor every forward pass: `torch.tensor([task_id], device=...)` - should cache or use `torch.LongTensor`
- Unsqueeze/expand pattern is inefficient - could use `repeat` or broadcasting
- No dropout in the attention layer - will overfit
- No residual connection - original signal can be completely suppressed
- Softmax over `seq_len` dimension computes token-level attention but doesn't actually fuse task information meaningfully

**config.py:**
- No validation (e.g., negative num_labels, empty task list, invalid model names)
- No `to_dict()` or serialization method for saving configs
- `device` is set at import time, not runtime - problematic for multi-GPU or dynamic device selection
- Missing configs for: gradient clipping, mixed precision, gradient accumulation, checkpoint saving
- `TaskConfig` hardcoded to only support `multi_label_classification` and `ner` in data processing

### 1.2 Training Issues

**trainer.py:**
- No gradient accumulation support
- No mixed-precision training (AMP)
- No gradient clipping
- No checkpoint saving/loading (no resume from crash)
- No model saving at end of training
- `eval_loss` is hacked: `1 - f1` or `-f1` instead of computing actual eval loss
- Lambda closures in `_create_dataloaders` capture loop variable by reference (Python closure bug)
- No distributed training support
- No configurable task sampling strategy (only round-robin)
- No weight for task-level loss balancing during training
- `print()` statements instead of proper `logging` module

### 1.3 Data Processing Issues

**data_processing.py:**
- Only supports `multi_label_classification` and `ner` - no `single_label_classification` processing
- Hardcoded `self.config.tasks[0]` in processing functions - breaks for multiple tasks
- No CSV support despite being mentioned in docs
- No data validation or error handling for malformed data
- No support for text column name configuration (hardcodes `"text"`)
- Train/test split is hardcoded at 80/20 with seed 42 - not configurable
- No support for pre-split datasets (separate train/test files)

### 1.4 Architecture Gaps

- **No REST API** - framework is CLI-only
- **No web platform** - everything requires Python knowledge
- **No model registry** - trained models are just files on disk
- **No experiment tracking UI** - relies on external MLflow/TensorBoard
- **Empty modules**: `utils/logging.py`, `data/universal.py`, `training/data.py`, `training/callbacks.py` are all empty
- **Seq2Seq skeleton only** - not implemented
- **No deployment infrastructure** - no Docker, no API server

---

## Part 2: V2 Architecture

### 2.1 Project Structure

```
/home/naynek/Desktop/JengaAI/
├── jenga_ai/                    # Core ML framework (Python package)
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py            # Pydantic-based config with validation
│   │   ├── model.py             # MultiTaskModel with dynamic hidden size
│   │   ├── fusion.py            # Improved AttentionFusion with residual + dropout
│   │   └── registry.py          # Task registry
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── base.py              # BaseTask ABC
│   │   ├── classification.py    # Single + Multi-label classification
│   │   ├── ner.py               # Named Entity Recognition
│   │   ├── sentiment.py         # Sentiment Analysis
│   │   ├── regression.py        # Regression task
│   │   └── qa.py                # Question Answering
│   ├── data/
│   │   ├── __init__.py
│   │   ├── processor.py         # Unified DataProcessor (JSON/JSONL/CSV)
│   │   ├── loaders.py           # Format-specific loaders
│   │   └── collators.py         # Task-specific collate functions
│   ├── training/
│   │   ├── __init__.py
│   │   ├── trainer.py           # Trainer with AMP, gradient clipping, checkpoints
│   │   ├── callbacks.py         # Training callbacks (logging, early stopping, checkpoint)
│   │   ├── schedulers.py        # Task sampling strategies
│   │   └── metrics.py           # Metric computation
│   ├── inference/
│   │   ├── __init__.py
│   │   ├── handler.py           # InferenceHandler
│   │   └── pipeline.py          # High-level prediction pipeline
│   ├── llm/
│   │   ├── __init__.py
│   │   ├── config.py            # LLM fine-tuning config
│   │   ├── model_factory.py     # Model loading + LoRA + quantization
│   │   ├── trainer.py           # LLM trainer wrapper
│   │   └── data.py              # LLM data processing
│   ├── export/
│   │   ├── __init__.py
│   │   ├── model_export.py      # Export to various formats
│   │   └── notebook_gen.py      # Colab/Kaggle notebook generator
│   └── utils/
│       ├── __init__.py
│       ├── logging.py           # Proper logging setup
│       └── device.py            # Device management utilities
├── backend/                     # FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # App settings
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py      # Auth endpoints
│   │   │   │   ├── projects.py  # Project CRUD
│   │   │   │   ├── datasets.py  # Dataset management
│   │   │   │   ├── training.py  # Training job management
│   │   │   │   ├── inference.py # Inference endpoints
│   │   │   │   ├── templates.py # Security templates
│   │   │   │   └── compute.py   # Compute marketplace
│   │   ├── models/              # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   ├── dataset.py
│   │   │   ├── experiment.py
│   │   │   └── model.py
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic
│   │   │   ├── auth.py
│   │   │   ├── config_generator.py
│   │   │   └── training.py
│   │   ├── workers/             # Celery tasks
│   │   │   ├── __init__.py
│   │   │   └── training_worker.py
│   │   └── core/
│   │       ├── database.py      # DB connection
│   │       ├── security.py      # JWT, hashing
│   │       └── deps.py          # Dependency injection
│   ├── alembic/                 # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── layout/          # Header, Sidebar, Footer
│   │   │   └── common/          # Shared components
│   │   ├── pages/
│   │   │   ├── auth/            # Login, Register
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   ├── projects/        # Project CRUD + wizard
│   │   │   ├── datasets/        # Dataset upload/preview
│   │   │   ├── training/        # Training monitor
│   │   │   ├── inference/       # Model testing
│   │   │   ├── templates/       # Security templates
│   │   │   └── compute/         # Compute marketplace
│   │   ├── hooks/               # Custom React hooks
│   │   ├── store/               # Zustand state management
│   │   ├── api/                 # API client + React Query
│   │   ├── lib/                 # Utilities
│   │   └── types/               # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
├── tests/                       # All tests
│   ├── unit/
│   │   ├── test_config.py
│   │   ├── test_model.py
│   │   ├── test_fusion.py
│   │   ├── test_tasks.py
│   │   ├── test_trainer.py
│   │   └── test_data.py
│   ├── integration/
│   └── e2e/
├── docker-compose.yml           # Full dev environment
├── pyproject.toml               # Modern Python packaging
├── IMPLEMENTATION_PLAN.md       # Updated plan (this will be updated)
├── TECHNICAL_ROADMAP.md         # Updated roadmap (this will be updated)
└── README.md
```

### 2.2 Key V2 Improvements Over V1

| Area | V1 Problem | V2 Solution |
|------|-----------|-------------|
| Hidden size | Hardcoded `768` | Dynamic from `config.hidden_size` |
| Config | Dataclasses, no validation | Pydantic models with validators |
| Fusion | No dropout/residual, inefficient | Dropout + residual connection + cached embeddings |
| Training | No AMP, no checkpoints, no grad clipping | Full AMP, checkpoint save/resume, configurable clipping |
| Data | Only JSON/JSONL, hardcoded task[0] | JSON/JSONL/CSV, per-task processing |
| Logging | `print()` statements | Python `logging` module |
| Collate | Lambda closure bug | Named functions with `functools.partial` |
| Eval | Fake eval_loss from F1 | Real eval loss computation |
| Tasks | Only multi-label + NER processing | All task types supported |
| Packaging | `setup.py` | `pyproject.toml` with modern tooling |
| Forgetting | No continual learning | EWC, replay, LwF, progressive freezing |
| Curriculum | No curriculum learning | Difficulty-based, nested/hierarchical, task-phased |
| Regularization | Basic dropout only | Label smoothing, R-Drop, mixup, focal loss, SWA |
| Compression | None | LoRA, 4-bit/8-bit quantization, knowledge distillation |
| Pre-trained | Only external models | SwahiliBERT, SwahiliDistilBERT, SwahiliSpacy |
| API | None | FastAPI with full REST API |
| Frontend | None | React + TypeScript + TailwindCSS |
| Tests | 79% coverage, fragile mocks | Target 90%+ with proper fixtures |

---

## Part 3: Implementation Steps

### Phase 1: Core ML Framework (Steps 1-6)

**Step 1: Project scaffolding and configuration system**
- Create the `jenga_ai/` package structure with `__init__.py` files
- Create `pyproject.toml` with proper metadata and dependencies
- Build Pydantic-based config system (`jenga_ai/core/config.py`) with:
  - Full validation (positive num_labels, valid model names, etc.)
  - `to_dict()` and `from_yaml()` methods
  - Configs for: gradient clipping, AMP, gradient accumulation, checkpoint interval
  - Configurable train/test split ratio
  - Configurable text/label column names
- Create `jenga_ai/utils/logging.py` with proper Python logging setup
- Create `jenga_ai/utils/device.py` for device management

**Step 2: Task system**
- Build `jenga_ai/tasks/base.py` with improved BaseTask:
  - Accept `hidden_size` parameter (not hardcoded 768)
  - Proper type annotations
  - Dropout in task heads
- Implement `classification.py` with dynamic `hidden_size` from config
- Implement `ner.py` with CRF layer option
- Implement `sentiment.py` as a specialized classification
- Implement `regression.py` with MSE/MAE loss
- Implement `qa.py` with span extraction
- Build task registry (`registry.py`) for auto-discovery

**Step 3: Improved fusion mechanism**
- Rebuild `AttentionFusion` with:
  - Residual connection: `output = shared + fusion_output`
  - Dropout layer for regularization
  - Cached task embeddings (no tensor creation each forward pass)
  - Multi-head attention option
  - Gating mechanism: learned gate to balance shared vs task-specific
- Add `ConcatenationFusion` as simpler alternative
- Add `NoFusion` passthrough option

**Step 4: MultiTaskModel rebuild**
- Dynamic hidden size from `config.hidden_size`
- Proper `save_pretrained()` / `from_pretrained()` that actually works
- Built-in device management
- Support for freezing encoder layers
- Gradient checkpointing support for memory efficiency
- Clean forward pass without `**kwargs` label hack

**Step 5: Data processing pipeline**
- Support JSON, JSONL, CSV formats with auto-detection
- Configurable text/label column names
- Per-task processing (not hardcoded `tasks[0]`)
- Support for pre-split train/test files
- Configurable split ratio and seed
- Data validation with clear error messages
- Move collate functions to separate `collators.py` using `functools.partial` (fix closure bug)
- Support for single-label classification processing (missing in V1)

**Step 6: Trainer rebuild**
- Mixed-precision training (AMP) with `torch.cuda.amp`
- Gradient clipping (`max_grad_norm` config)
- Gradient accumulation (`accumulation_steps` config)
- Checkpoint saving every N epochs + best model saving
- Resume training from checkpoint
- Compute real eval loss (not fake `1 - f1`)
- Configurable task sampling: round-robin, proportional, temperature-scaled
- Proper Python logging (not `print()`)
- Callback system: `on_epoch_start`, `on_epoch_end`, `on_train_end`, `on_eval_end`
- Model saving at end of training
- Training metrics history for later analysis

### Phase 1.5: Advanced Training Techniques (Steps 6a-6c) — NEW

**Step 6a: Continual learning module (catastrophic forgetting prevention)**
- `jenga_ai/training/continual.py` with:
  - Elastic Weight Consolidation (EWC) — Fisher Information penalty on important weights
  - Experience Replay — buffer of old examples mixed into new training
  - Learning without Forgetting (LwF) — knowledge distillation from old model
  - Progressive Freezing — freeze bottom layers as new tasks are added
  - PackNet (weight partitioning) — assign weight subsets to different tasks
  - ContinualLearningManager for high-level orchestration

**Step 6b: Curriculum and nested learning**
- `jenga_ai/training/curriculum.py` with:
  - Difficulty-based curriculum — easy examples first, gradually introduce hard ones
  - Competence-based progression — advance only when model demonstrates mastery
  - Anti-curriculum (hard example mining) — focus on what the model gets wrong
  - Nested/hierarchical task learning — parent tasks (threat detection) before children (threat type)
  - Task-phased scheduling — introduce tasks progressively (classification first, then NER, then sentiment)
  - CurriculumSampler for DataLoader integration
  - DifficultyScorer using loss, confidence, or heuristics

**Step 6c: Advanced regularization techniques**
- `jenga_ai/training/regularization.py` with:
  - Label smoothing — prevent overconfident predictions (critical for security)
  - R-Drop — regularized dropout for robust training with small datasets
  - Mixup — interpolate examples for smoother decision boundaries
  - Focal Loss — down-weight easy examples, focus on rare threats (class imbalance)
  - Stochastic Weight Averaging (SWA) — average weights for better generalization
  - Knowledge Distillation — compress SwahiliBERT → SwahiliDistilBERT
  - RegularizationManager for combining multiple techniques

### Phase 2: LLM Fine-tuning Module (Steps 7-8)

**Step 7: LLM config and model factory**
- Pydantic config for LLM fine-tuning
- Fix `eval_strategy` vs `evaluation_strategy` issue permanently
- Fix `fp16` on CPU issue with proper device detection
- Fix `learning_rate` string→float casting at config level
- Proper model factory with error handling for unavailable models

**Step 8: LLM trainer**
- Integrate with HuggingFace Trainer properly
- LoRA configuration with validation
- Quantization support (4-bit, 8-bit) with proper CUDA checks
- Teacher-student distillation
- Export fine-tuned models

### Phase 3: Inference & Export (Steps 9-10)

**Step 9: Inference handler**
- Fix `from_pretrained` loading (V1 bug)
- Model caching for faster repeated inference
- Batch prediction with configurable batch size
- Confidence scores and probabilities
- NER entity extraction with span merging
- Async inference support

**Step 10: Export and notebook generation**
- Export model as zip (weights + config + inference script + README)
- Generate Colab notebook (.ipynb)
- Generate Kaggle notebook
- ONNX export option for deployment

### Phase 4: Tests (Step 11)

**Step 11: Comprehensive test suite**
- Unit tests for every module with proper fixtures (not fragile mocks)
- Integration tests for full pipeline (config → data → train → eval → infer)
- Test all task types end-to-end
- Test with different model sizes (distilbert, bert-base, bert-large)
- Target 90%+ code coverage
- CI/CD with GitHub Actions

### Phase 5: Backend API (Steps 12-16)

**Step 12: FastAPI setup + auth**
- FastAPI app with proper project structure
- PostgreSQL with SQLAlchemy 2.0 async
- Alembic migrations
- JWT auth (register, login, refresh, password reset)
- Redis for caching and Celery broker

**Step 13: Project and dataset APIs**
- Full CRUD for projects
- Dataset upload with validation (JSON/JSONL/CSV)
- Dataset preview and label distribution
- File storage (local filesystem initially, MinIO later)

**Step 14: Training API + Celery workers**
- Training job management (start, stop, status)
- Celery workers wrapping `jenga_ai` training
- WebSocket for real-time training progress
- Config generator service (UI inputs → YAML)

**Step 15: Inference and deployment API**
- Model inference endpoints
- Batch prediction
- API key management for deployed models
- Rate limiting

**Step 16: Templates and compute marketplace**
- Security template CRUD + gallery
- Pre-built configs for hate speech, phishing, threats
- Compute option routing (platform, RunPod, Colab, Kaggle, download)
- RunPod API client
- Notebook generation endpoints

### Phase 6: Frontend (Steps 17-22)

**Step 17: React project setup**
- Vite + React 18 + TypeScript
- TailwindCSS + shadcn/ui
- React Router for navigation
- Zustand for state management
- React Query for data fetching
- API client setup

**Step 18: Auth pages + dashboard**
- Login page with form validation
- Register page
- Password reset flow
- Main dashboard layout (sidebar, header, content)
- Recent projects grid
- Activity feed

**Step 19: Project wizard + dataset management**
- 4-step wizard: Task selection → Dataset → Config → Review
- Drag-and-drop dataset upload
- Dataset preview table with pagination
- Label distribution charts (Recharts)
- Config editor (simple/advanced modes)

**Step 20: Training monitor**
- WebSocket connection for real-time updates
- Live progress bar (epoch counter)
- Loss/accuracy line charts (Recharts)
- Console log viewer with auto-scroll
- Stop/pause training buttons
- Auto-reconnect on disconnect

**Step 21: Inference UI + templates**
- Text input for single predictions
- Batch CSV upload
- Confidence score visualization
- NER entity highlighting
- Security template gallery with cards
- Template customization wizard

**Step 22: Compute marketplace UI**
- Compute option selector cards
- RunPod API key input
- Cost estimator
- "Open in Colab" / "Open in Kaggle" buttons
- Download model as zip

### Phase 7: DevOps & Polish (Steps 23-24)

**Step 23: Docker + deployment**
- Dockerfile for backend
- Dockerfile for frontend
- docker-compose.yml for full stack (frontend, backend, postgres, redis, celery)
- Environment variable management
- Health check endpoints

**Step 24: Documentation + demo**
- Update IMPLEMENTATION_PLAN.md with V2 changes
- Update TECHNICAL_ROADMAP.md with V2 architecture
- API docs (auto-generated from OpenAPI)
- User guide
- Demo video script

---

## Part 4: Execution Strategy

### Starting Point: Core ML Framework First

We begin at Step 1 (project scaffolding + config) and build outward. This ensures the foundation is solid before building the platform on top.

### Parallel Agent Strategy

Once the core is stable, we can parallelize:
- **Agent A**: Backend API (Steps 12-16)
- **Agent B**: Frontend (Steps 17-22)
- **Agent C**: Tests (Step 11)

### Priority Order

1. **Steps 1-6** (Core ML) - Must be sequential, each depends on the previous
2. **Steps 7-8** (LLM) - Can start after Step 6
3. **Steps 9-10** (Inference/Export) - Can start after Step 4
4. **Step 11** (Tests) - Can run in parallel as modules complete
5. **Steps 12-16** (Backend) - Can start after Step 6
6. **Steps 17-22** (Frontend) - Can start after Step 12
7. **Steps 23-24** (DevOps) - Final phase

### What We Preserve From V1

- The core concept of multi-task learning with shared encoder + task heads
- The attention fusion idea (but improved with residual + dropout)
- The YAML config-driven approach (but with Pydantic validation)
- The round-robin training strategy (but add alternatives)
- The LLM fine-tuning with LoRA approach
- The task type system (classification, NER, etc.)
- The project vision and market strategy

### What We Rebuild Completely

- Configuration system (dataclasses → Pydantic)
- Data processing pipeline (fix hardcoded tasks[0], add CSV, add validation)
- Training loop (add AMP, checkpoints, gradient clipping, proper eval loss)
- Model class (dynamic hidden size, proper save/load)
- Fusion mechanism (add residual, dropout, caching)
- Task heads (dynamic hidden size, dropout)
- Entire packaging (setup.py → pyproject.toml)
- All logging (print → logging module)

---

## Part 5: Updated Roadmap Summary

| Week | Focus | Steps | Deliverables |
|------|-------|-------|-------------|
| 1 | Core Foundation | 1-3 | Config, tasks, fusion |
| 2 | Core Model + Data | 4-5 | MultiTaskModel, data pipeline |
| 3 | Training + Advanced | 6, 6a-6c | Trainer, continual learning, curriculum, regularization |
| 4 | LLM + Inference | 7-10 | LLM fine-tuning, inference, export |
| 5 | Tests | 11 | Unit + integration tests (90%+ coverage) |
| 5-6 | Backend API | 12-14 | FastAPI, auth, training API |
| 7-8 | Backend + Frontend Start | 15-18 | Templates, compute, React setup |
| 9-10 | Frontend Core | 19-21 | Wizard, monitor, inference UI |
| 11 | Frontend + DevOps | 22-23 | Compute UI, Docker |
| 12 | Polish + Launch | 24 | Docs, demo, staging deploy |
