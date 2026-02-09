# Jenga-AI — Project Milestones & Deliverables

**Last updated:** February 7, 2026
**Status legend:** DONE | IN PROGRESS | NOT STARTED

> Each milestone is broken into deliverables and sub-activities suitable for
> project management tools (Asana, GitHub Projects, Jira). When every sub-activity
> under a deliverable is complete, the deliverable is done. When every deliverable
> under a milestone is done, the milestone is achieved.

---

## MS-1: Project Scaffolding & Configuration (DONE)

### D-1.1: Python Package Structure
- [x] Create `jenga_ai/` root package with `__init__.py`
- [x] Create sub-packages: `core/`, `tasks/`, `data/`, `training/`, `inference/`, `llm/`, `export/`, `utils/`, `security/`, `models/`
- [x] Add `__init__.py` to every sub-package
- [x] Create `pyproject.toml` with metadata, dependencies, entry points
- [x] Create `requirements.txt` (core runtime dependencies)
- [x] Create `requirements-dev.txt` (dev, testing, API, docs dependencies)

### D-1.2: Pydantic Configuration System
- [x] `core/config.py` — `ExperimentConfig` top-level model
- [x] `ModelConfig` — base_model, hidden_size, dropout, fusion, freeze layers, gradient checkpointing
- [x] `TaskConfig` — name, type enum, data_path, heads list, text/label columns, label_maps
- [x] `HeadConfig` — name, num_labels, weight, dropout
- [x] `FusionConfig` — type enum, dropout, residual, attention heads, gate init
- [x] `TokenizerConfig` — max_length, padding, truncation
- [x] `TrainingConfig` — lr, batch_size, epochs, weight_decay, warmup, grad norm/accum, AMP, sampling
- [x] `DataConfig` — test_size, seed, num_workers, pin_memory
- [x] `PIIRedactionConfig` — enabled (off by default), strategy, detect_types, hash_salt
- [x] `LoggingConfig` — service enum (TensorBoard/MLflow), experiment name, tracking URI
- [x] `CheckpointConfig` — save interval, save best, max checkpoints
- [x] Field validators: unique task names, unique head names, eval_batch_size default
- [x] `to_dict()`, `to_yaml()`, `from_yaml()` serialization methods
- [x] Enum classes: `TaskType`, `FusionType`, `LoggingService`, `TaskSamplingStrategy`

### D-1.3: Utility Modules
- [x] `utils/logging.py` — structured Python logging, configurable levels, file + console handlers
- [x] `utils/device.py` — auto-detect CPU/CUDA/MPS, AMP support check, recursive tensor mover

---

## MS-2: Task System & Registry (DONE)

### D-2.1: Base Task Architecture
- [x] `tasks/base.py` — `BaseTask` ABC with `hidden_size` parameter (not hardcoded 768)
- [x] Type annotations on all methods
- [x] Configurable dropout in task heads
- [x] Abstract `forward()` and `compute_loss()` methods

### D-2.2: Task Implementations
- [x] `tasks/classification.py` — `SingleLabelClassificationHead` with CrossEntropyLoss
- [x] `tasks/classification.py` — `MultiLabelClassificationHead` with BCEWithLogitsLoss
- [x] `tasks/ner.py` — NER head with token-level classification
- [x] `tasks/sentiment.py` — Sentiment head (specialized classification)
- [x] `tasks/regression.py` — Regression head with MSE/Huber loss
- [ ] `tasks/qa.py` — Question Answering with span extraction (start/end logits)

### D-2.3: Task Registry
- [x] `core/registry.py` — decorator-based task registration
- [x] Auto-discovery of built-in task types
- [x] Registry lookup by `TaskType` enum
- [x] Support for user-registered custom tasks

---

## MS-3: Fusion Mechanisms (DONE)

### D-3.1: Attention Fusion
- [x] `core/fusion.py` — `AttentionFusion` with multi-head attention
- [x] Residual connection: `output = shared_repr + fusion_output`
- [x] Dropout layer for regularization
- [x] Cached task embeddings (no tensor creation per forward pass)
- [x] Learnable gate parameter (init 0.5, learned during training)

### D-3.2: Alternative Fusion Modes
- [x] `ConcatenationFusion` — simple concat + linear projection
- [x] `NoFusion` — passthrough for single-task mode (no fusion overhead)

---

## MS-4: MultiTask Model (DONE)

### D-4.1: Model Architecture
- [x] `core/model.py` — `MultiTaskModel` class
- [x] Dynamic `hidden_size` auto-detected from encoder config
- [x] Shared transformer encoder + per-task prediction heads
- [x] Fusion layer integration (attention, concatenation, or none)

### D-4.2: Model Management
- [x] `save_pretrained()` — save weights, config, metadata
- [x] `from_pretrained()` — load from saved checkpoint
- [x] Encoder layer freezing (configurable N layers from bottom)
- [x] Gradient checkpointing toggle for memory efficiency
- [x] Built-in device management (auto-move to correct device)

---

## MS-5: Data Processing Pipeline (DONE)

### D-5.1: Data Loading
- [x] `data/processor.py` — `DataProcessor` class
- [x] JSON format loader
- [x] JSONL format loader
- [x] CSV format loader
- [x] Auto-format detection from file extension
- [x] Configurable text column and label column names

### D-5.2: Data Splitting & Collation
- [x] Configurable train/test split ratio
- [x] Configurable random seed for reproducibility
- [x] Per-task data processing (not hardcoded to first task)
- [x] `data/collators.py` — class-based collators (fix V1 lambda closure bug)
- [x] Single-label collator, multi-label collator, NER collator, regression collator
- [ ] Pre-split dataset support (separate train.json / test.json)

### D-5.3: PII Detection & Redaction (Optional Pipeline Step)
- [x] `data/pii.py` — `PIIDetector` with regex patterns
- [x] Kenya-specific patterns: phone (+254), national ID, KRA PIN, M-Pesa transaction ID
- [x] Universal patterns: email, IP address, credit card (Luhn), URL, DOB, PO box
- [x] `PIIRedactor` with strategies: mask (`[REDACTED]`), hash (SHA-256), remove, flag
- [x] Batch processing and dataset column redaction
- [x] Redaction statistics and report generation
- [x] Opt-in via `PIIRedactionConfig.enabled = False` by default

### D-5.4: Data Augmentation (NOT STARTED)
- [ ] Synonym replacement augmentation
- [ ] Back-translation augmentation (Swahili ↔ English)
- [ ] Streaming support for large datasets (>1M rows)

---

## MS-6: Training Engine (DONE)

### D-6.1: Core Trainer
- [x] `training/trainer.py` — `Trainer` class with training loop
- [x] Mixed-precision training (AMP) with `torch.cuda.amp`
- [x] Gradient clipping (`max_grad_norm`)
- [x] Gradient accumulation (`accumulation_steps`)
- [x] Real eval loss computation (not fake `1 - f1`)
- [x] Proper Python logging (replaced all `print()`)

### D-6.2: Task Sampling
- [x] Round-robin sampling across tasks
- [x] Proportional sampling (weighted by dataset size)
- [x] Temperature-scaled sampling
- [x] Configurable via `TaskSamplingStrategy` enum

### D-6.3: Checkpointing & Callbacks
- [x] `training/callbacks.py` — callback base class
- [x] `LoggingCallback` — TensorBoard and MLflow metric writing
- [x] `EarlyStoppingCallback` — patience-based early stopping
- [x] `CheckpointCallback` — save every N epochs, save best model, max checkpoint retention
- [x] Callback hooks: `on_epoch_start`, `on_epoch_end`, `on_train_end`, `on_eval_end`

### D-6.4: Metrics
- [x] `training/metrics.py` — per-task metric computation
- [x] Classification: accuracy, precision, recall, F1 (macro/micro/weighted)
- [x] NER: entity-level precision, recall, F1
- [x] Regression: MSE, MAE, R-squared
- [x] Metrics history for later analysis / plotting

### D-6.5: Outstanding Training Items
- [ ] Resume training from checkpoint (load optimizer state + epoch)
- [ ] Distributed training (multi-GPU via DistributedDataParallel)

---

## MS-7: Continual Learning — Catastrophic Forgetting Prevention (DONE)

### D-7.1: Elastic Weight Consolidation (EWC)
- [x] `training/continual.py` — `FisherInformation` class
- [x] Diagonal Fisher Information approximation over dataset sample
- [x] Store optimal parameters per task
- [x] `EWCLoss` — quadratic penalty: `lambda/2 * sum(F * (theta - theta*)^2)`

### D-7.2: Experience Replay
- [x] `ExperienceReplayBuffer` — fixed-size buffer per task
- [x] Reservoir sampling for uniform representation
- [x] Cross-task batch sampling

### D-7.3: Learning without Forgetting (LwF)
- [x] `LearningWithoutForgetting` class
- [x] Model snapshot before new training
- [x] KL divergence distillation loss with temperature scaling
- [x] Combined loss: `(1 - alpha) * task_loss + alpha * distill_loss`

### D-7.4: Progressive Freezing
- [x] `ProgressiveFreezing` — freeze N more encoder layers per new task
- [x] Auto-detect encoder layer count
- [x] Configurable minimum trainable layers

### D-7.5: Manager & Remaining Strategies
- [x] `ContinualLearningManager` — orchestrates `before_task()` / `after_task()` / `compute_loss()`
- [ ] PackNet (weight partitioning) implementation
- [ ] Online EWC (streaming Fisher Information updates)

---

## MS-8: Curriculum & Nested Learning (DONE)

### D-8.1: Difficulty Scoring
- [x] `training/curriculum.py` — `DifficultyScorer` class
- [x] Loss-based scoring (high loss = hard example)
- [x] Confidence-based scoring (low confidence = hard)
- [x] Length-based heuristic scoring

### D-8.2: Curriculum Strategies
- [x] Difficulty-based curriculum (easy examples first, expand gradually)
- [x] Competence-based progression (advance only when mastery demonstrated)
- [x] Anti-curriculum / hard example mining (focus on what model gets wrong)
- [x] `CurriculumSampler(Sampler)` for DataLoader integration

### D-8.3: Nested & Phased Learning
- [x] `NestedTaskScheduler` — parent→child task dependency management
- [x] Competence-gated progression (child task unlocks when parent reaches threshold)
- [x] `TaskPhasedScheduler` — introduce tasks at specified epochs with weight warmup
- [x] `CurriculumManager` — high-level orchestrator

### D-8.4: Remaining
- [ ] Automatic difficulty estimation from model predictions (no manual labels)

---

## MS-9: Advanced Regularization (DONE)

### D-9.1: Loss Functions
- [x] `training/regularization.py` — `LabelSmoothingLoss` (epsilon-based soft targets)
- [x] `FocalLoss` — `FL(p_t) = -alpha * (1 - p_t)^gamma * log(p_t)` for class imbalance

### D-9.2: Training Regularization
- [x] `RDropLoss` — symmetric KL divergence between two dropout forward passes
- [x] `Mixup` — Beta distribution interpolation of embeddings and targets

### D-9.3: Weight Optimization
- [x] `StochasticWeightAveraging` — running average of weights from epoch N onward
- [x] `KnowledgeDistiller` — teacher-student with temperature-scaled soft targets

### D-9.4: Integration
- [x] `RegularizationManager` — combine multiple techniques in one training run
- [ ] CutMix augmentation
- [ ] Contrastive learning regularization

---

## MS-10: Security & Trust Modules (DONE)

### D-10.1: Adversarial Robustness
- [x] `security/adversarial.py` — FGSM (Fast Gradient Sign Method) attack
- [x] PGD (Projected Gradient Descent) attack with configurable steps
- [x] `AdversarialTrainer` wrapper for adversarial training

### D-10.2: Explainability
- [x] `security/explainability.py` — attention-based explanations
- [x] Gradient-based explanations (saliency maps)
- [x] Occlusion-based explanations
- [x] Human-readable report generation

### D-10.3: Audit Trail
- [x] `security/audit.py` — hash-chained audit entries (SHA-256)
- [x] Tamper-evident integrity verification
- [x] Algorithm-agile design (ready for post-quantum)

### D-10.4: Human-in-the-Loop
- [x] `security/hitl.py` — uncertainty estimation (entropy + margin)
- [x] Automatic routing of low-confidence predictions to human reviewers
- [x] Priority-based review queue

### D-10.5: Remaining Security
- [ ] SHAP value explanations integration
- [ ] Differential privacy training

---

## MS-11: LLM Fine-tuning Module (NOT STARTED)

### D-11.1: LLM Configuration
- [ ] `llm/config.py` — Pydantic config for LLM fine-tuning
- [ ] Model name/path validation
- [ ] Fix `eval_strategy` vs `evaluation_strategy` HuggingFace compatibility
- [ ] Fix `fp16` auto-disable on CPU
- [ ] Fix `learning_rate` string→float casting at config level

### D-11.2: Model Factory
- [ ] `llm/model_factory.py` — load models from HuggingFace Hub
- [ ] LoRA adapter configuration (rank, alpha, target modules, dropout)
- [ ] 4-bit quantization with bitsandbytes (QLoRA)
- [ ] 8-bit quantization with bitsandbytes
- [ ] CUDA availability check before quantization
- [ ] Graceful fallback when GPU not available

### D-11.3: LLM Trainer
- [ ] `llm/trainer.py` — wrapper around HuggingFace Trainer
- [ ] Integration with Jenga-AI callback system
- [ ] Proper eval strategy configuration
- [ ] Checkpoint saving compatible with Jenga-AI format

### D-11.4: LLM Data Processing
- [ ] `llm/data.py` — tokenization for causal / seq2seq LLMs
- [ ] Instruction formatting (prompt templates)
- [ ] Chat format support
- [ ] Dataset size validation and streaming for large datasets

### D-11.5: Knowledge Transfer
- [ ] Teacher-student distillation pipeline (SwahiliBERT → SwahiliDistilBERT)
- [ ] LoRA merging and export
- [ ] Fine-tuned model packaging

---

## MS-12: Inference Engine (NOT STARTED)

### D-12.1: Inference Handler
- [ ] `inference/handler.py` — `InferenceHandler` class
- [ ] Load model from checkpoint (weights + config)
- [ ] Model caching (avoid reloading on repeated calls)
- [ ] Device auto-detection for inference

### D-12.2: Prediction Pipeline
- [ ] `inference/pipeline.py` — high-level `predict()` API
- [ ] Single text prediction
- [ ] Batch prediction with configurable batch size
- [ ] Confidence scores and class probabilities
- [ ] NER entity extraction with sub-word span merging
- [ ] Async inference support (for API integration)

### D-12.3: Post-processing
- [ ] Label ID → human-readable label mapping
- [ ] Threshold-based multi-label prediction
- [ ] Sentiment score normalization
- [ ] Regression value denormalization

---

## MS-13: Export & Notebook Generation (NOT STARTED)

### D-13.1: Model Export
- [ ] `export/model_export.py` — export model as zip package
- [ ] Package contents: weights, config.yaml, inference script, README
- [ ] ONNX export for optimized deployment
- [ ] TorchScript export option
- [ ] Model size reporting (MB)

### D-13.2: Notebook Generation
- [ ] `export/notebook_gen.py` — generate Jupyter notebooks programmatically
- [ ] Google Colab notebook template (installs, GPU detection, training, inference)
- [ ] Kaggle notebook template (competition-ready format)
- [ ] Auto-populate with user's config and dataset info

---

## MS-14: Test Suite (NOT STARTED)

### D-14.1: Unit Tests — Core
- [ ] `tests/unit/test_config.py` — all config models, validators, YAML round-trip
- [ ] `tests/unit/test_model.py` — MultiTaskModel init, forward, save/load, freeze
- [ ] `tests/unit/test_fusion.py` — AttentionFusion, ConcatenationFusion, NoFusion
- [ ] `tests/unit/test_registry.py` — task registration, lookup, custom tasks

### D-14.2: Unit Tests — Tasks
- [ ] `tests/unit/test_tasks.py` — each task head forward pass, loss computation
- [ ] Test classification (single + multi-label), NER, sentiment, regression
- [ ] Verify hidden_size parameterization (no hardcoded 768)

### D-14.3: Unit Tests — Data
- [ ] `tests/unit/test_data.py` — DataProcessor with JSON, JSONL, CSV
- [ ] Test auto-format detection
- [ ] Test configurable column names
- [ ] Test collators (each task type)
- [ ] Test PII detection patterns (Kenyan phone, national ID, email, etc.)
- [ ] Test PII redaction strategies (mask, hash, remove, flag)

### D-14.4: Unit Tests — Training
- [ ] `tests/unit/test_trainer.py` — trainer with AMP, grad clip, accumulation
- [ ] Test callbacks (logging, early stopping, checkpoint)
- [ ] Test metrics computation for each task type
- [ ] Test continual learning (EWC penalty, replay sampling, LwF distillation)
- [ ] Test curriculum learning (difficulty scoring, sampler, nested scheduler)
- [ ] Test regularization (label smoothing, focal loss, R-Drop, mixup, SWA)

### D-14.5: Unit Tests — Security
- [ ] Test adversarial attacks (FGSM, PGD) produce valid perturbations
- [ ] Test explainability (attention, gradient, occlusion) produce explanations
- [ ] Test audit trail (hash chain integrity, tamper detection)
- [ ] Test HITL (uncertainty routing, priority queue)

### D-14.6: Integration Tests
- [ ] `tests/integration/` — full pipeline: config → data → train → eval → infer
- [ ] Test all task types end-to-end with tiny model (distilbert)
- [ ] Test continual learning: train task A, add task B, verify A not forgotten
- [ ] Test curriculum learning: nested task progression
- [ ] Test model save → load → inference round-trip

### D-14.7: CI/CD
- [ ] GitHub Actions workflow for automated testing on push
- [ ] Automated linting with ruff
- [ ] Type checking with mypy
- [ ] Code coverage reporting (target: 90%+)
- [ ] Coverage badge in README

---

## MS-15: Backend — Infrastructure & Auth (NOT STARTED)

### D-15.1: FastAPI App Setup
- [ ] `backend/app/main.py` — FastAPI app with CORS, middleware, lifespan
- [ ] `backend/app/config.py` — app settings from environment variables
- [ ] Project directory structure: `api/`, `models/`, `schemas/`, `services/`, `workers/`, `core/`
- [ ] `backend/requirements.txt` — FastAPI, SQLAlchemy, Celery, Redis, etc.

### D-15.2: Database Setup
- [ ] `backend/app/core/database.py` — SQLAlchemy 2.0 async engine + session
- [ ] PostgreSQL connection with connection pooling
- [ ] `backend/alembic/` — Alembic migration setup
- [ ] Initial migration: create users table

### D-15.3: Authentication
- [ ] `backend/app/core/security.py` — JWT token creation/verification, password hashing (bcrypt)
- [ ] `backend/app/models/user.py` — User ORM model (id, email, hashed_password, role, created_at)
- [ ] `backend/app/schemas/auth.py` — request/response schemas (register, login, token)
- [ ] `backend/app/api/v1/auth.py` — endpoints:
  - [ ] `POST /api/v1/auth/register` — user registration
  - [ ] `POST /api/v1/auth/login` — login, return JWT access + refresh tokens
  - [ ] `POST /api/v1/auth/refresh` — refresh expired access token
  - [ ] `POST /api/v1/auth/reset-password` — password reset flow
- [ ] `backend/app/core/deps.py` — dependency injection (get_current_user, get_db)
- [ ] Role-based access control (admin, user roles)

### D-15.4: Redis & Celery Setup
- [ ] Redis connection for caching and Celery broker
- [ ] Celery app configuration
- [ ] Basic health check task to verify Celery connectivity

---

## MS-16: Backend — Project & Dataset APIs (NOT STARTED)

### D-16.1: Project Management
- [ ] `backend/app/models/project.py` — Project ORM (id, name, description, user_id, config, status, timestamps)
- [ ] `backend/app/schemas/project.py` — create/update/response schemas
- [ ] `backend/app/api/v1/projects.py` — endpoints:
  - [ ] `POST /api/v1/projects` — create project
  - [ ] `GET /api/v1/projects` — list user's projects
  - [ ] `GET /api/v1/projects/{id}` — get project details
  - [ ] `PUT /api/v1/projects/{id}` — update project
  - [ ] `DELETE /api/v1/projects/{id}` — delete project
- [ ] Alembic migration for projects table

### D-16.2: Dataset Management
- [ ] `backend/app/models/dataset.py` — Dataset ORM (id, project_id, filename, format, size, row_count, columns, label_distribution)
- [ ] `backend/app/schemas/dataset.py` — upload/preview/response schemas
- [ ] `backend/app/api/v1/datasets.py` — endpoints:
  - [ ] `POST /api/v1/datasets/upload` — upload dataset file (JSON/JSONL/CSV)
  - [ ] `GET /api/v1/datasets/{id}/preview` — preview first 100 rows
  - [ ] `GET /api/v1/datasets/{id}/labels` — label distribution analysis
  - [ ] `DELETE /api/v1/datasets/{id}` — delete dataset
- [ ] File validation on upload (format check, size limit, column existence)
- [ ] File storage — local filesystem initially
- [ ] Alembic migration for datasets table

### D-16.3: File Storage
- [ ] Local filesystem storage with organized directory structure
- [ ] File path sanitization and security
- [ ] Future: MinIO/S3 object storage adapter

---

## MS-17: Backend — Training API & Workers (NOT STARTED)

### D-17.1: Training Job Management
- [ ] `backend/app/models/experiment.py` — Experiment ORM (id, project_id, config_yaml, status, metrics, started_at, finished_at)
- [ ] `backend/app/schemas/training.py` — start/stop/status/metrics schemas
- [ ] `backend/app/api/v1/training.py` — endpoints:
  - [ ] `POST /api/v1/training/start` — submit training job
  - [ ] `GET /api/v1/training/{id}/status` — job status (queued, running, completed, failed)
  - [ ] `POST /api/v1/training/{id}/stop` — stop running job
  - [ ] `GET /api/v1/training/{id}/metrics` — retrieve training metrics
  - [ ] `GET /api/v1/training/{id}/logs` — retrieve training logs
- [ ] Alembic migration for experiments table

### D-17.2: Config Generator Service
- [ ] `backend/app/services/config_generator.py` — convert UI wizard inputs → YAML config
- [ ] Map model selection to base_model string
- [ ] Map task type selection to TaskType enum
- [ ] Map single/multi-task choice to fusion config
- [ ] Map compression options to LoRA/quantization config
- [ ] Validate generated config before saving

### D-17.3: Celery Training Worker
- [ ] `backend/app/workers/training_worker.py` — Celery task wrapping jenga_ai trainer
- [ ] Load config from database
- [ ] Initialize DataProcessor, Model, Trainer from jenga_ai
- [ ] Stream metrics to database during training
- [ ] Handle training errors gracefully (update status to "failed" with error message)
- [ ] Save trained model to storage on completion

### D-17.4: Real-time Progress
- [ ] WebSocket endpoint for live training updates
- [ ] Broadcast epoch progress, loss, metrics to connected clients
- [ ] Email notification on training completion (optional)

---

## MS-18: Backend — Inference & Deployment API (NOT STARTED)

### D-18.1: Inference Endpoints
- [ ] `backend/app/api/v1/inference.py` — endpoints:
  - [ ] `POST /api/v1/inference/predict` — single text prediction
  - [ ] `POST /api/v1/inference/batch` — batch CSV upload, return predictions
  - [ ] `GET /api/v1/inference/models` — list deployed models
- [ ] Model loading and caching (avoid reloading per request)
- [ ] Confidence scores in response

### D-18.2: API Key Management
- [ ] API key generation per deployed model
- [ ] API key authentication middleware
- [ ] Rate limiting per API key (configurable requests/minute)
- [ ] Usage tracking and analytics

---

## MS-19: Backend — Templates & Compute Marketplace (NOT STARTED)

### D-19.1: Security Templates
- [ ] `backend/app/api/v1/templates.py` — template CRUD endpoints
- [ ] Template model: name, category, description, config_yaml, icon
- [ ] Pre-built templates:
  - [ ] Hate speech detection (Swahili + English)
  - [ ] Phishing email detection
  - [ ] Network threat classification
  - [ ] M-Pesa fraud detection
  - [ ] Corruption indicator detection
- [ ] Template gallery listing with category filter

### D-19.2: Compute Marketplace
- [ ] `backend/app/api/v1/compute.py` — compute option endpoints
- [ ] Platform compute (train on server)
- [ ] RunPod API client for cloud GPU
- [ ] Colab notebook generation endpoint
- [ ] Kaggle notebook generation endpoint
- [ ] Model download as zip endpoint
- [ ] Cost estimator service

---

## MS-20: Frontend — Project Setup & Core (NOT STARTED)

### D-20.1: React Project Initialization
- [ ] Vite + React 18 + TypeScript scaffold
- [ ] `frontend/package.json` — dependencies
- [ ] `frontend/tsconfig.json` — strict TypeScript config
- [ ] `frontend/vite.config.ts` — dev server proxy to backend API

### D-20.2: UI Framework
- [ ] TailwindCSS installation and config (`tailwind.config.ts`)
- [ ] shadcn/ui CLI setup and base component generation
- [ ] shadcn/ui components: Button, Input, Card, Dialog, Select, Table, Tabs, Badge, Toast, Dropdown, Avatar, Separator, Sheet, Skeleton, Tooltip
- [ ] Theme configuration (light/dark mode toggle)
- [ ] Global CSS with Jenga-AI brand colors

### D-20.3: Routing & State
- [ ] React Router v6 setup (`frontend/src/App.tsx`)
- [ ] Route definitions: `/login`, `/register`, `/dashboard`, `/projects/*`, `/training/*`, `/inference/*`, `/templates`, `/compute`
- [ ] Protected route wrapper (redirect to login if not authenticated)
- [ ] Zustand stores: `authStore`, `projectStore`, `trainingStore`
- [ ] React Query setup with API client (`frontend/src/api/client.ts`)
- [ ] Axios instance with JWT token interceptor (attach Authorization header)
- [ ] Token refresh interceptor (auto-refresh on 401)

### D-20.4: TypeScript Types
- [ ] `frontend/src/types/` — shared TypeScript interfaces
- [ ] `User`, `Project`, `Dataset`, `Experiment`, `TrainingMetrics` types
- [ ] `TaskType`, `FusionType`, `ModelOption` enums
- [ ] API request/response type definitions

---

## MS-21: Frontend — Layout & Reusable Components (NOT STARTED)

### D-21.1: Layout Components
- [ ] `components/layout/AppLayout.tsx` — main layout with sidebar + header + content area
- [ ] `components/layout/Sidebar.tsx` — navigation sidebar with icons (dashboard, projects, templates, compute, settings)
- [ ] `components/layout/Header.tsx` — top bar with logo, breadcrumbs, user avatar, notification bell
- [ ] `components/layout/Footer.tsx` — minimal footer with version info
- [ ] Responsive sidebar (collapsible on mobile)
- [ ] Active route highlighting in sidebar

### D-21.2: Common Reusable Components
- [ ] `components/common/PageHeader.tsx` — page title + subtitle + action buttons
- [ ] `components/common/EmptyState.tsx` — illustration + message + CTA for empty lists
- [ ] `components/common/LoadingSpinner.tsx` — centered spinner with optional text
- [ ] `components/common/ErrorBoundary.tsx` — error boundary with retry button
- [ ] `components/common/ConfirmDialog.tsx` — reusable confirmation modal
- [ ] `components/common/FileUploader.tsx` — drag-and-drop file upload with progress
- [ ] `components/common/DataTable.tsx` — sortable, paginated table (wraps shadcn Table)
- [ ] `components/common/StatusBadge.tsx` — colored badge for status (running, completed, failed, queued)
- [ ] `components/common/MetricCard.tsx` — small card showing a metric value with label and trend
- [ ] `components/common/SearchInput.tsx` — debounced search input with icon

### D-21.3: Chart Components
- [ ] Install Recharts library
- [ ] `components/common/LineChart.tsx` — reusable line chart (loss curves, accuracy)
- [ ] `components/common/BarChart.tsx` — reusable bar chart (label distribution)
- [ ] `components/common/PieChart.tsx` — reusable pie chart (dataset splits)
- [ ] Chart theming consistent with app design

---

## MS-22: Frontend — Auth Pages (NOT STARTED)

### D-22.1: Login Page
- [ ] `pages/auth/LoginPage.tsx` — form with email + password fields
- [ ] Form validation (required, email format, min password length)
- [ ] Submit → call `POST /api/v1/auth/login`
- [ ] Store JWT tokens in Zustand + localStorage
- [ ] Redirect to dashboard on success
- [ ] Error display for invalid credentials

### D-22.2: Register Page
- [ ] `pages/auth/RegisterPage.tsx` — form with name, email, password, confirm password
- [ ] Client-side validation (password match, email format, strength indicator)
- [ ] Submit → call `POST /api/v1/auth/register`
- [ ] Auto-login after registration

### D-22.3: Password Reset
- [ ] `pages/auth/ForgotPasswordPage.tsx` — email input, submit reset request
- [ ] `pages/auth/ResetPasswordPage.tsx` — new password form (from email link)

---

## MS-23: Frontend — Dashboard (NOT STARTED)

### D-23.1: Dashboard Layout
- [ ] `pages/dashboard/DashboardPage.tsx` — main dashboard view
- [ ] Welcome banner with user name and quick-start buttons
- [ ] Stats row: total projects, active training jobs, deployed models

### D-23.2: Dashboard Cards
- [ ] Recent projects grid (cards with name, status, last modified, task type icons)
- [ ] "New Project" card with + icon (links to project wizard)
- [ ] Activity feed — recent actions (training started, model exported, etc.)
- [ ] Quick-start template cards (top 3 security templates)

---

## MS-24: Frontend — Project Wizard (NOT STARTED)

### D-24.1: Wizard Framework
- [ ] `pages/projects/ProjectWizard.tsx` — multi-step wizard container
- [ ] Step progress indicator (visual breadcrumb: 1→2→3→4→5→6)
- [ ] Back/Next/Cancel navigation buttons
- [ ] Form state persistence across steps (Zustand or React state)
- [ ] Step validation before advancing

### D-24.2: Step 1 — Model Selection
- [ ] `pages/projects/steps/ModelSelectStep.tsx`
- [ ] Model picker cards: SwahiliBERT, SwahiliDistilBERT, DistilBERT, BERT-base, Custom
- [ ] Card shows: model name, size (MB), speed rating, language support
- [ ] "Custom model" input for HuggingFace model IDs

### D-24.3: Step 2 — Task Type Selection
- [ ] `pages/projects/steps/TaskSelectStep.tsx`
- [ ] Visual task type cards with icons:
  - [ ] Text Classification (single-label)
  - [ ] Multi-label Classification
  - [ ] Named Entity Recognition
  - [ ] Sentiment Analysis
  - [ ] Regression
- [ ] Multi-select for fusion mode (pick 2+ tasks)

### D-24.4: Step 3 — Single vs Multi-Task Choice
- [ ] `pages/projects/steps/FusionChoiceStep.tsx`
- [ ] Toggle: "Single Task (fast)" vs "Multi-Task Fusion (powerful)"
- [ ] If multi-task: fusion type selector (Attention, Concatenation)
- [ ] Visual diagram showing architecture for chosen option

### D-24.5: Step 4 — Dataset Upload
- [ ] `pages/projects/steps/DatasetUploadStep.tsx`
- [ ] Drag-and-drop file upload zone (JSON, JSONL, CSV)
- [ ] Upload progress bar
- [ ] After upload: preview table (first 10 rows)
- [ ] Column mapping: select text column, select label column from dropdown
- [ ] Label distribution bar chart
- [ ] PII redaction toggle (optional, off by default)

### D-24.6: Step 5 — Configuration
- [ ] `pages/projects/steps/ConfigStep.tsx`
- [ ] Simple mode: learning rate slider, epochs slider, batch size dropdown
- [ ] Advanced mode: full config editor (all training params)
- [ ] Compression options: None, LoRA (rank slider), Quantization (4-bit/8-bit)
- [ ] Training technique toggles: label smoothing, focal loss, curriculum learning

### D-24.7: Step 6 — Review & Launch
- [ ] `pages/projects/steps/ReviewStep.tsx`
- [ ] Summary of all selections: model, tasks, dataset, config
- [ ] Estimated training time (rough)
- [ ] "Start Training" button → create project + start training job
- [ ] Redirect to training monitor

---

## MS-25: Frontend — Dataset Management (NOT STARTED)

### D-25.1: Dataset List View
- [ ] `pages/datasets/DatasetListPage.tsx` — list all datasets for a project
- [ ] Table: filename, format, size, rows, upload date
- [ ] Delete button with confirmation dialog

### D-25.2: Dataset Detail View
- [ ] `pages/datasets/DatasetDetailPage.tsx`
- [ ] Preview table with pagination (50 rows per page)
- [ ] Label distribution chart (bar chart)
- [ ] Column statistics (unique values, null counts)
- [ ] Download dataset button

---

## MS-26: Frontend — Training Monitor (NOT STARTED)

### D-26.1: Training Dashboard
- [ ] `pages/training/TrainingMonitorPage.tsx` — real-time training view
- [ ] Status banner: "Training in progress — Epoch 3/10"
- [ ] Progress bar (percentage based on current epoch / total epochs)

### D-26.2: Live Charts
- [ ] Training loss line chart (updates via WebSocket)
- [ ] Validation loss line chart (overlaid)
- [ ] Per-task accuracy/F1 line charts
- [ ] Learning rate schedule chart

### D-26.3: Training Controls & Logs
- [ ] Stop training button (with confirmation)
- [ ] Pause/resume training button
- [ ] Console log viewer (auto-scrolling, monospace, color-coded)
- [ ] WebSocket connection with auto-reconnect on disconnect
- [ ] Connection status indicator (green dot = connected)

### D-26.4: Training History
- [ ] `pages/training/TrainingHistoryPage.tsx` — list of past training runs
- [ ] Table: experiment name, status, epochs, best metric, date
- [ ] Click → view training detail with saved charts

---

## MS-27: Frontend — Inference UI (NOT STARTED)

### D-27.1: Single Prediction
- [ ] `pages/inference/InferencePage.tsx` — text input area
- [ ] Model selector dropdown (trained models)
- [ ] "Predict" button → call inference API
- [ ] Results display:
  - [ ] Classification: label + confidence bar
  - [ ] NER: highlighted entities with color-coded tags
  - [ ] Sentiment: score gauge / meter
  - [ ] Regression: predicted value

### D-27.2: Batch Prediction
- [ ] CSV file upload for batch prediction
- [ ] Progress indicator during batch processing
- [ ] Results table with pagination
- [ ] Download results as CSV

### D-27.3: Explainability Display
- [ ] Attention heatmap visualization over input tokens
- [ ] Token importance highlighting (green = positive, red = negative)
- [ ] Explanation report panel (generated from security/explainability.py)

---

## MS-28: Frontend — Model Compression UI (NOT STARTED)

### D-28.1: Compression Configuration
- [ ] `pages/projects/CompressionPanel.tsx` — compression options panel
- [ ] Quantization toggle: None / 4-bit / 8-bit
- [ ] LoRA configuration: rank slider (4-64), alpha slider, target modules checkboxes
- [ ] Model size estimate (before vs after, in MB)
- [ ] Accuracy vs size trade-off display

---

## MS-29: Frontend — Security Templates (NOT STARTED)

### D-29.1: Template Gallery
- [ ] `pages/templates/TemplateGalleryPage.tsx` — card grid of templates
- [ ] Each card: icon, name, description, category badge, "Use Template" button
- [ ] Category filter tabs: All, Security, Agriculture, Finance, Custom
- [ ] Search/filter input

### D-29.2: Template Detail & Customization
- [ ] `pages/templates/TemplateDetailPage.tsx` — template preview modal
- [ ] Config preview (readonly YAML or visual summary)
- [ ] "Customize" button → opens wizard pre-filled with template config
- [ ] "Use as-is" button → create project directly

---

## MS-30: Frontend — Compute Marketplace (NOT STARTED)

### D-30.1: Compute Options
- [ ] `pages/compute/ComputeMarketplacePage.tsx` — compute option cards
- [ ] Card: "Train on Platform" — use server GPU, show queue status
- [ ] Card: "Train on RunPod" — enter API key, select GPU, cost estimate
- [ ] Card: "Open in Google Colab" — generate and open notebook
- [ ] Card: "Open in Kaggle" — generate and open notebook
- [ ] Card: "Download Model" — download zip with weights + inference script

### D-30.2: RunPod Integration
- [ ] API key input and validation
- [ ] GPU type selector (A100, A40, etc.)
- [ ] Cost estimator (estimated hours x price/hour)
- [ ] Job submission and status tracking

---

## MS-31: Experiment Tracking & Monitoring (NOT STARTED)

### D-31.1: TensorBoard Integration
- [x] LoggingCallback writes to TensorBoard (already in callbacks.py)
- [ ] Training loss curves display
- [ ] Validation metrics per task display
- [ ] Learning rate schedule visualization
- [ ] Embedding projections (t-SNE / UMAP)
- [ ] Attention heatmap logging

### D-31.2: MLflow Integration
- [ ] MLflow experiment creation and tracking
- [ ] Parameter logging (all config values)
- [ ] Metric logging (loss, accuracy, F1 per task per epoch)
- [ ] Artifact logging (model files, config YAML)
- [ ] Model registry integration (stage models: staging → production)
- [ ] Experiment comparison UI link

### D-31.3: Production Monitoring
- [ ] Prometheus metrics exporter (request count, latency, error rate)
- [ ] Grafana dashboard templates (API health, model performance)
- [ ] Sentry error tracking integration
- [ ] Uptime monitoring endpoint (`/health`)
- [ ] Model performance drift detection (accuracy degradation alerts)

---

## MS-32: Advanced Architectures (NOT STARTED)

### D-32.1: Graph Neural Networks
- [ ] `models/graph/gcn.py` — Graph Convolutional Network implementation
- [ ] `models/graph/gat.py` — Graph Attention Network implementation
- [ ] `models/graph/graphsage.py` — GraphSAGE implementation
- [ ] Graph data loader (adjacency matrix + node features)
- [ ] Integration with MultiTaskModel (graph encoder option)

### D-32.2: Sequential Models
- [ ] `models/sequential/lstm.py` — Bidirectional LSTM implementation
- [ ] `models/sequential/lstm.py` — Attention-enhanced LSTM
- [ ] GRU variant option
- [ ] Integration with MultiTaskModel (sequential encoder option)

### D-32.3: Hybrid Architectures
- [ ] `models/hybrid/transformer_gnn.py` — Transformer + GNN hybrid
- [ ] `models/hybrid/transformer_lstm.py` — Transformer + LSTM hybrid
- [ ] `models/hybrid/ensemble.py` — ensemble voting across multiple models
- [ ] Hybrid encoder factory for config-driven selection

---

## MS-33: Pre-trained Models (NOT STARTED)

### D-33.1: Model Training & Publishing
- [ ] Train SwahiliBERT on Swahili corpus
- [ ] Train SwahiliDistilBERT (distilled from SwahiliBERT)
- [ ] Train SwahiliSpacyModel for NER
- [ ] Publish all models to HuggingFace Hub

### D-33.2: Documentation
- [ ] Model cards for each published model (training data, performance, limitations)
- [ ] Example notebooks: single-task with SwahiliBERT, fusion with SwahiliBERT, NER with SwahiliSpacyModel
- [ ] Benchmark results table (F1, accuracy on standard Swahili NLP benchmarks)

---

## MS-34: DevOps — Containerization (NOT STARTED)

### D-34.1: Docker Images
- [ ] `backend/Dockerfile` — multi-stage build (slim Python image)
- [ ] `frontend/Dockerfile` — multi-stage build (Node build → nginx serve)
- [ ] Celery worker Dockerfile (shared with backend, different entrypoint)

### D-34.2: Docker Compose
- [ ] `docker-compose.yml` — full stack orchestration:
  - [ ] `frontend` service (port 3000)
  - [ ] `backend` service (port 8000)
  - [ ] `celery-worker` service
  - [ ] `postgres` service (port 5432, volume for data persistence)
  - [ ] `redis` service (port 6379)
- [ ] `.env.example` — environment variable template
- [ ] Health check configuration for each service
- [ ] Volume mounts for development (hot reload)

---

## MS-35: DevOps — CI/CD & Quality (NOT STARTED)

### D-35.1: GitHub Actions
- [ ] `.github/workflows/test.yml` — run tests on push/PR
- [ ] `.github/workflows/lint.yml` — ruff linting
- [ ] `.github/workflows/typecheck.yml` — mypy type checking
- [ ] `.github/workflows/build.yml` — Docker image builds
- [ ] Code coverage upload to Codecov
- [ ] PR status checks (block merge if tests fail)

### D-35.2: Quality Gates
- [ ] Pre-commit hooks (ruff, mypy, trailing whitespace)
- [ ] Minimum code coverage threshold (90%)
- [ ] Dependency vulnerability scanning (dependabot or snyk)
- [ ] Automated deployment to staging on merge to main

---

## MS-36: Documentation (NOT STARTED)

### D-36.1: Developer Documentation
- [ ] Getting started guide (install, config, first training)
- [ ] Developer API reference (auto-generated from docstrings)
- [ ] Architecture overview with diagrams
- [ ] Contributing guide (code style, PR process, testing)

### D-36.2: User Documentation
- [ ] Non-technical user guide (web platform walkthrough)
- [ ] Security templates guide (what each template detects, when to use)
- [ ] Model compression guide (LoRA vs quantization vs distillation)
- [ ] Deployment guide (on-premise, cloud, edge devices)

### D-36.3: Example Notebooks
- [ ] Single-task classification with SwahiliBERT
- [ ] Multi-label classification
- [ ] NER with SwahiliBERT
- [ ] Sentiment analysis
- [ ] Multi-task attention fusion (3+ tasks)
- [ ] Adversarial training example
- [ ] Continual learning (add new task without forgetting)
- [ ] Curriculum learning example
- [ ] Knowledge distillation (SwahiliBERT → SwahiliDistilBERT)
- [ ] Model quantization and deployment
- [ ] Whisper speech-to-text → NLP pipeline

---

## Summary

| Milestone | Deliverables | Status |
|-----------|-------------|--------|
| **MS-1** Project Scaffolding & Config | 3 | DONE |
| **MS-2** Task System & Registry | 3 | DONE |
| **MS-3** Fusion Mechanisms | 2 | DONE |
| **MS-4** MultiTask Model | 2 | DONE |
| **MS-5** Data Processing Pipeline | 4 | DONE |
| **MS-6** Training Engine | 5 | DONE |
| **MS-7** Continual Learning | 5 | DONE |
| **MS-8** Curriculum & Nested Learning | 4 | DONE |
| **MS-9** Advanced Regularization | 4 | DONE |
| **MS-10** Security & Trust Modules | 5 | DONE |
| **MS-11** LLM Fine-tuning Module | 5 | NOT STARTED |
| **MS-12** Inference Engine | 3 | NOT STARTED |
| **MS-13** Export & Notebook Generation | 2 | NOT STARTED |
| **MS-14** Test Suite | 7 | NOT STARTED |
| **MS-15** Backend — Infrastructure & Auth | 4 | NOT STARTED |
| **MS-16** Backend — Projects & Datasets | 3 | NOT STARTED |
| **MS-17** Backend — Training API & Workers | 4 | NOT STARTED |
| **MS-18** Backend — Inference & Deployment | 2 | NOT STARTED |
| **MS-19** Backend — Templates & Compute | 2 | NOT STARTED |
| **MS-20** Frontend — Setup & Core | 4 | NOT STARTED |
| **MS-21** Frontend — Layout & Reusable Components | 3 | NOT STARTED |
| **MS-22** Frontend — Auth Pages | 3 | NOT STARTED |
| **MS-23** Frontend — Dashboard | 2 | NOT STARTED |
| **MS-24** Frontend — Project Wizard | 7 | NOT STARTED |
| **MS-25** Frontend — Dataset Management | 2 | NOT STARTED |
| **MS-26** Frontend — Training Monitor | 4 | NOT STARTED |
| **MS-27** Frontend — Inference UI | 3 | NOT STARTED |
| **MS-28** Frontend — Model Compression UI | 1 | NOT STARTED |
| **MS-29** Frontend — Security Templates | 2 | NOT STARTED |
| **MS-30** Frontend — Compute Marketplace | 2 | NOT STARTED |
| **MS-31** Experiment Tracking & Monitoring | 3 | NOT STARTED |
| **MS-32** Advanced Architectures | 3 | NOT STARTED |
| **MS-33** Pre-trained Models | 2 | NOT STARTED |
| **MS-34** DevOps — Containerization | 2 | NOT STARTED |
| **MS-35** DevOps — CI/CD & Quality | 2 | NOT STARTED |
| **MS-36** Documentation | 3 | NOT STARTED |
| **TOTALS** | **116 deliverables** | **10 DONE / 26 NOT STARTED** |
