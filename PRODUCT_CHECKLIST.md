# Jenga-AI V2 — Product Checklist

**Last updated:** February 7, 2026

---

## ML Framework (jenga_ai/)

### Core Foundation
- [x] Pydantic v2 configuration system with validation (`core/config.py`)
- [x] MultiTaskModel with dynamic hidden_size detection (`core/model.py`)
- [x] AttentionFusion with residual + dropout + learnable gate (`core/fusion.py`)
- [x] ConcatenationFusion alternative (`core/fusion.py`)
- [x] NoFusion passthrough for single-task mode (`core/fusion.py`)
- [x] Model save/load with metadata (`core/model.py`)
- [x] Encoder layer freezing for transfer learning (`core/model.py`)

### Task Heads
- [x] Single-label classification (`tasks/classification.py`)
- [x] Multi-label classification (`tasks/classification.py`)
- [x] Named Entity Recognition (`tasks/ner.py`)
- [x] Sentiment analysis (`tasks/sentiment.py`)
- [x] Regression with MSE/Huber loss (`tasks/regression.py`)
- [x] Task registry for custom task types (`tasks/registry.py`)
- [ ] Question Answering span extraction (`tasks/qa.py`)
- [ ] Speech-to-text / Whisper integration
- [ ] Summarization task
- [ ] Translation task (Swahili ↔ English)

### Data Pipeline
- [x] JSON format support (`data/processor.py`)
- [x] JSONL format support (`data/processor.py`)
- [x] CSV format support (`data/processor.py`)
- [x] Auto-format detection (`data/processor.py`)
- [x] Configurable text/label column names (`data/processor.py`)
- [x] Configurable train/test split ratio and seed (`data/processor.py`)
- [x] Per-task data processing (`data/processor.py`)
- [x] Class-based collators — no lambda bug (`data/collators.py`)
- [x] PII detection — Kenyan phone, national ID, KRA PIN, M-Pesa ID (`data/pii.py`)
- [x] PII detection — universal: email, IP, credit card, URL, DOB (`data/pii.py`)
- [x] PII redaction strategies: mask, hash, remove, flag (`data/pii.py`)
- [x] PII as optional pipeline step (off by default for synthetic data) (`core/config.py`)
- [x] PII redaction report generation (`data/pii.py`)
- [ ] Pre-split dataset support (separate train/test files)
- [ ] Streaming large datasets
- [ ] Data augmentation (synonym replacement, back-translation)

### Training
- [x] Mixed-precision training (AMP) (`training/trainer.py`)
- [x] Gradient clipping (`training/trainer.py`)
- [x] Gradient accumulation (`training/trainer.py`)
- [x] Checkpoint saving/loading (`training/trainer.py`)
- [x] Real eval loss computation (`training/trainer.py`)
- [x] Task sampling strategies (round-robin, proportional, temperature) (`training/trainer.py`)
- [x] Callback system (`training/callbacks.py`)
- [x] LoggingCallback — TensorBoard/MLflow (`training/callbacks.py`)
- [x] EarlyStoppingCallback (`training/callbacks.py`)
- [x] CheckpointCallback with best model tracking (`training/callbacks.py`)
- [x] Per-task metric computation (`training/metrics.py`)
- [ ] Distributed training (multi-GPU)
- [ ] Resume training from checkpoint

### Continual Learning (Catastrophic Forgetting Prevention)
- [x] Elastic Weight Consolidation (EWC) (`training/continual.py`)
- [x] Experience Replay buffer (`training/continual.py`)
- [x] Learning without Forgetting (LwF) (`training/continual.py`)
- [x] Progressive Freezing (`training/continual.py`)
- [x] ContinualLearningManager (`training/continual.py`)
- [ ] PackNet (weight partitioning) implementation
- [ ] Online EWC (streaming Fisher updates)

### Curriculum & Nested Learning
- [x] Difficulty-based curriculum (easy → hard) (`training/curriculum.py`)
- [x] Competence-based progression (`training/curriculum.py`)
- [x] Anti-curriculum / hard example mining (`training/curriculum.py`)
- [x] Nested/hierarchical task learning (`training/curriculum.py`)
- [x] Task-phased scheduling (`training/curriculum.py`)
- [x] DifficultyScorer (loss/confidence/length) (`training/curriculum.py`)
- [x] CurriculumSampler for DataLoader (`training/curriculum.py`)
- [ ] Automatic difficulty estimation from model predictions

### Advanced Regularization
- [x] Label smoothing loss (`training/regularization.py`)
- [x] Focal loss for class imbalance (`training/regularization.py`)
- [x] R-Drop (regularized dropout) (`training/regularization.py`)
- [x] Mixup data augmentation (`training/regularization.py`)
- [x] Stochastic Weight Averaging (SWA) (`training/regularization.py`)
- [x] Knowledge Distillation (teacher → student) (`training/regularization.py`)
- [x] RegularizationManager (`training/regularization.py`)
- [ ] CutMix augmentation
- [ ] Contrastive learning

### Security & Trust
- [x] FGSM adversarial attack (`security/adversarial.py`)
- [x] PGD adversarial attack (`security/adversarial.py`)
- [x] AdversarialTrainer wrapper (`security/adversarial.py`)
- [x] Attention-based explanations (`security/explainability.py`)
- [x] Gradient-based explanations (`security/explainability.py`)
- [x] Occlusion-based explanations (`security/explainability.py`)
- [x] Human-readable report generation (`security/explainability.py`)
- [x] Hash-chained audit trail (`security/audit.py`)
- [x] Tamper-evident integrity verification (`security/audit.py`)
- [x] Uncertainty estimation (entropy/margin) (`security/hitl.py`)
- [x] Human-in-the-Loop routing (`security/hitl.py`)
- [x] Priority-based review queue (`security/hitl.py`)
- [ ] SHAP value explanations
- [ ] Differential privacy

### Advanced Architectures
- [x] GNN architecture documentation (`models/graph/`)
- [x] LSTM/GRU architecture documentation (`models/sequential/`)
- [x] Hybrid architecture documentation (`models/hybrid/`)
- [ ] GCN implementation
- [ ] GAT implementation
- [ ] GraphSAGE implementation
- [ ] Bidirectional LSTM implementation
- [ ] Attention-enhanced LSTM
- [ ] Transformer + GNN hybrid
- [ ] Transformer + LSTM hybrid
- [ ] Ensemble voting model

### Model Compression & Export
- [ ] LoRA adapter training (`llm/`)
- [ ] 4-bit quantization (`llm/`)
- [ ] 8-bit quantization (`llm/`)
- [ ] Knowledge distillation pipeline
- [ ] ONNX export
- [ ] Model packaging as zip (weights + config + script)
- [ ] Google Colab notebook generator (`export/`)
- [ ] Kaggle notebook generator (`export/`)

### LLM Fine-tuning
- [ ] LLM Pydantic config (`llm/config.py`)
- [ ] Model factory with LoRA + quantization (`llm/model_factory.py`)
- [ ] HuggingFace Trainer wrapper (`llm/trainer.py`)
- [ ] LLM data processing (`llm/data.py`)
- [ ] Teacher-student distillation pipeline

### Inference
- [ ] InferenceHandler with model caching (`inference/handler.py`)
- [ ] Batch prediction pipeline (`inference/pipeline.py`)
- [ ] Confidence scores and probabilities
- [ ] NER entity span merging
- [ ] Async inference support

### Pre-trained Models
- [ ] SwahiliBERT open-sourced on HuggingFace
- [ ] SwahiliDistilBERT open-sourced on HuggingFace
- [ ] SwahiliSpacyModel published
- [ ] Model cards with documentation
- [ ] Example notebooks for each model

### Utilities
- [x] Structured Python logging (`utils/logging.py`)
- [x] Device management (CPU/CUDA/MPS) (`utils/device.py`)
- [x] AMP support detection (`utils/device.py`)
- [x] Recursive tensor mover (`utils/device.py`)

### Packaging
- [x] pyproject.toml with modern tooling
- [x] requirements.txt (core dependencies)
- [x] requirements-dev.txt (dev + API + docs)
- [ ] PyPI package publishing
- [ ] conda-forge package

---

## Backend API (backend/)

### Infrastructure
- [ ] FastAPI app with project structure
- [ ] PostgreSQL with SQLAlchemy 2.0 async
- [ ] Alembic database migrations
- [ ] Redis for caching and Celery broker
- [ ] MinIO/S3 object storage

### Authentication
- [ ] User registration endpoint
- [ ] Login endpoint (JWT tokens)
- [ ] Token refresh endpoint
- [ ] Password reset flow
- [ ] Role-based access control (admin, user)
- [ ] API key authentication for deployed models

### Project & Dataset Management
- [ ] Project CRUD API
- [ ] Dataset upload with validation
- [ ] Dataset preview (first 100 rows)
- [ ] Label distribution analysis
- [ ] File storage (local → MinIO)

### Training
- [ ] Training job management (start, stop, status)
- [ ] Celery workers wrapping jenga_ai training
- [ ] WebSocket for real-time training progress
- [ ] Config generator service (UI inputs → YAML)
- [ ] Training metrics streaming
- [ ] Email notifications on completion

### Inference & Deployment
- [ ] Single prediction endpoint
- [ ] Batch prediction (CSV upload)
- [ ] Model caching for speed
- [ ] Confidence scores
- [ ] API key management for deployed models
- [ ] Rate limiting

### Templates & Compute
- [ ] Security template CRUD + gallery
- [ ] Hate speech detection template
- [ ] Phishing email detection template
- [ ] Network threat classification template
- [ ] M-Pesa fraud detection template
- [ ] Compute option routing (platform, RunPod, Colab, Kaggle, download)
- [ ] RunPod API client
- [ ] Colab notebook generation endpoint
- [ ] Kaggle notebook generation endpoint

---

## Frontend (frontend/)

### Setup
- [ ] Vite + React 18 + TypeScript
- [ ] TailwindCSS + shadcn/ui components
- [ ] React Router navigation
- [ ] Zustand state management
- [ ] React Query data fetching
- [ ] API client setup

### Auth Pages
- [ ] Login page with form validation
- [ ] Register page
- [ ] Password reset flow
- [ ] Protected route middleware

### Dashboard
- [ ] Main dashboard layout (sidebar, header, content)
- [ ] Recent projects grid
- [ ] Activity feed
- [ ] Quick-start buttons

### Project Wizard
- [ ] Step 1: Model selection (SwahiliBERT, SwahiliDistilBERT, etc.)
- [ ] Step 2: Task type selection (visual cards)
- [ ] Step 3: Single task vs multi-task fusion choice
- [ ] Step 4: Dataset upload (drag-and-drop)
- [ ] Step 5: Configuration (simple/advanced modes)
- [ ] Step 6: Review and launch
- [ ] Progress indicator for wizard steps
- [ ] Form validation on each step

### Dataset Management
- [ ] Drag-and-drop file upload
- [ ] Upload progress indicator
- [ ] Dataset preview table with pagination
- [ ] Label distribution chart (Recharts)
- [ ] Column mapping (text column, label column)

### Training Monitor
- [ ] WebSocket connection for real-time updates
- [ ] Live progress bar (epoch counter)
- [ ] Loss line chart (Recharts)
- [ ] Accuracy/F1 line chart
- [ ] Console log viewer with auto-scroll
- [ ] Stop/pause training buttons
- [ ] Auto-reconnect on disconnect

### Model Compression UI
- [ ] Quantization toggle (4-bit / 8-bit / none)
- [ ] LoRA configuration sliders (rank, alpha)
- [ ] Model size estimate
- [ ] Accuracy vs size trade-off display

### Inference UI
- [ ] Text input for single predictions
- [ ] Confidence score visualization
- [ ] NER entity highlighting with color tags
- [ ] Batch CSV upload + download results
- [ ] Explanation report display (attention highlights)

### Security Templates
- [ ] Template gallery with cards
- [ ] Filter by category (Security, Agriculture, etc.)
- [ ] "Use Template" button
- [ ] Template preview modal
- [ ] Template customization wizard

### Compute Marketplace
- [ ] Compute option selector cards
- [ ] RunPod API key input
- [ ] Cost estimator
- [ ] "Open in Colab" button
- [ ] "Open in Kaggle" button
- [ ] Download model as zip

---

## Experiment Tracking & Monitoring

### MLflow Integration
- [ ] Experiment creation and tracking
- [ ] Parameter logging (configs, hyperparameters)
- [ ] Metric logging (loss, accuracy, F1 per task)
- [ ] Artifact logging (model files, configs)
- [ ] Model registry integration
- [ ] Experiment comparison UI

### TensorBoard Integration
- [x] LoggingCallback for TensorBoard (`training/callbacks.py`)
- [ ] Training loss curves
- [ ] Validation metrics per task
- [ ] Learning rate schedule visualization
- [ ] Embedding projections
- [ ] Attention heatmaps

### Monitoring (Production)
- [ ] Prometheus metrics collection
- [ ] Grafana dashboards
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] Model performance drift detection

---

## Examples & Documentation

### Example Notebooks
- [ ] Single-task classification with SwahiliBERT
- [ ] Multi-label classification
- [ ] NER with SwahiliBERT
- [ ] Sentiment analysis
- [ ] Multi-task attention fusion (3+ tasks)
- [ ] Adversarial training example
- [ ] Continual learning example (add new task without forgetting)
- [ ] Curriculum learning example
- [ ] Knowledge distillation (SwahiliBERT → SwahiliDistilBERT)
- [ ] Model quantization and deployment
- [ ] Whisper speech-to-text → NLP pipeline

### Documentation
- [ ] Getting started guide
- [ ] Developer API reference
- [ ] Non-technical user guide (web platform)
- [ ] Security templates guide
- [ ] Model compression guide
- [ ] Deployment guide (on-premise, cloud, edge)
- [ ] Architecture overview
- [ ] Contributing guide (exists: CONTRIBUTING.md)

---

## DevOps

### Containerization
- [ ] Dockerfile for backend
- [ ] Dockerfile for frontend
- [ ] Dockerfile for Celery workers
- [ ] docker-compose.yml for full stack
- [ ] Environment variable management
- [ ] Health check endpoints

### CI/CD
- [ ] GitHub Actions workflow
- [ ] Automated testing on push
- [ ] Automated linting (ruff)
- [ ] Type checking (mypy)
- [ ] Code coverage reporting
- [ ] Automated deployment to staging

### Testing
- [ ] Unit tests for core/ modules
- [ ] Unit tests for tasks/ modules
- [ ] Unit tests for training/ modules (including continual, curriculum, regularization)
- [ ] Unit tests for security/ modules
- [ ] Unit tests for data/ modules
- [ ] Integration test: full pipeline (config → data → train → eval)
- [ ] Integration test: all task types end-to-end
- [ ] Integration test: continual learning (train task A, add task B, verify A not forgotten)
- [ ] Integration test: curriculum learning (nested task progression)
- [ ] Backend API tests
- [ ] Frontend E2E tests
- [ ] Cross-browser testing
- [ ] Target: 90%+ code coverage

---

## Summary

| Category | Total Items | Completed | Remaining |
|----------|------------|-----------|-----------|
| **ML Framework — Core** | 12 | 12 | 0 |
| **ML Framework — Tasks** | 10 | 6 | 4 |
| **ML Framework — Data** | 16 | 13 | 3 |
| **ML Framework — Training** | 15 | 13 | 2 |
| **ML Framework — Continual** | 7 | 5 | 2 |
| **ML Framework — Curriculum** | 8 | 7 | 1 |
| **ML Framework — Regularization** | 9 | 7 | 2 |
| **ML Framework — Security** | 14 | 12 | 2 |
| **ML Framework — Architectures** | 14 | 3 | 11 |
| **ML Framework — Compression** | 8 | 0 | 8 |
| **ML Framework — LLM** | 5 | 0 | 5 |
| **ML Framework — Inference** | 5 | 0 | 5 |
| **ML Framework — Models** | 5 | 0 | 5 |
| **ML Framework — Utils** | 6 | 5 | 1 |
| **Backend API** | 30 | 0 | 30 |
| **Frontend** | 33 | 0 | 33 |
| **Tracking & Monitoring** | 13 | 1 | 12 |
| **Examples & Docs** | 19 | 0 | 19 |
| **DevOps** | 18 | 0 | 18 |
| **TOTAL** | ~247 | ~84 | ~163 |
