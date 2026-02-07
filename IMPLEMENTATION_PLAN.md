# JengaAI Low-Code Platform: Complete Implementation Plan

**Project:** JengaAI Low-Code NLP Platform
**Version:** 2.0 (V2 Rebuild)
**Last Updated:** 2026-02-07
**Team:** ML Engineer + Frontend Developer
**Status:** V2 core ML framework BUILT. Backend/Frontend in progress.

> **V2 NOTE:** This document has been updated to reflect the V2 rebuild.
> The original V1 plan (below) remains for reference. See the **V2 ADDENDUM**
> section at the bottom for all changes, new security modules, and the
> rebuilt core framework architecture.

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Project Vision & Goals](#project-vision--goals)
3. [12-Week MVP Sprint Plan](#12-week-mvp-sprint-plan)
4. [Compute Marketplace Innovation](#compute-marketplace-innovation)
5. [Complete Feature List](#complete-feature-list)
6. [Milestones & Deliverables](#milestones--deliverables)
7. [Technical Architecture](#technical-architecture)
8. [Technology Stack](#technology-stack)
9. [Team Responsibilities](#team-responsibilities)
10. [Risk Management](#risk-management)
11. [Success Metrics](#success-metrics)

---

## Executive Summary

**Problem:** Building custom NLP models is too complex, expensive, and inaccessible for most organizations in Africa. Existing AI platforms don't understand African languages, context, or code-switching.

**Solution:** JengaAI Low-Code Platform - A "Teachable Machine for African NLP" that enables non-technical users to:
- Upload their own data
- Configure models through a visual interface (no coding)
- Train NLP models with real-time monitoring
- Deploy instantly (API, download, or cloud platforms)

**Key Innovation:** **Compute Marketplace** - Users choose where to train:
- Download model for local deployment
- Platform-hosted inference (pay-per-use)
- RunPod API integration (bring your own GPU)
- Google Colab notebook generator (free GPU)
- Kaggle integration (free GPU quota)

**Target Market:** Kenyan government agencies, NGOs, small businesses, researchers, students

**MVP Timeline:** 12 weeks (aggressive)

**Must-Have Features for Incubation:**
1. Security templates (hate speech, phishing, threat detection)
2. Real-time training monitoring
3. LLM fine-tuning with LoRA
4. Compute marketplace

---

## Project Vision & Goals

### Vision Statement
"To build the leading ecosystem for developing, deploying, and sharing AI solutions tailored for African languages and contexts - making advanced NLP accessible to everyone, everywhere in Africa."

### Strategic Goals

#### 1. **Democratize NLP for Africa**
- **Target:** Non-technical users (NGOs, government, businesses)
- **Approach:** Zero-code visual interface
- **Impact:** 10x reduction in barrier to entry for AI adoption

**Measurable Outcomes:**
- 500+ registered users in first 6 months
- 1000+ models trained
- 50% of users are non-technical (based on surveys)

#### 2. **African Context First**
- **Languages:** Swahili, English, and code-switching support
- **Cultural Understanding:** Local idioms, expressions, context
- **Examples:** Kenyan use cases in templates and docs

**Measurable Outcomes:**
- 80%+ of templates use African data
- Swahili language accuracy >85%
- Code-switching detection accuracy >80%

#### 3. **Address Kenyan Security Priorities**
- **National Security:** Threat detection, hate speech monitoring
- **Cybersecurity:** Phishing detection, network intrusion, insider threats
- **Governance:** Document classification, sentiment analysis

**Measurable Outcomes:**
- 10+ security models deployed in government agencies
- 5+ partnerships with Kenyan security organizations
- Measurable reduction in threat detection time

#### 4. **Flexible Infrastructure (Compute Marketplace)**
- **User Choice:** Download, platform, or bring your own compute
- **Cost-Effective:** Free options (Colab, Kaggle) to paid (RunPod)
- **No Lock-In:** Users control their data and models

**Measurable Outcomes:**
- 40% of users use platform inference (revenue)
- 30% use external compute (RunPod/Colab)
- 30% download models

#### 5. **Maintain Developer SDK**
- **Python Framework:** Keep existing multitask_bert as foundation
- **Advanced Users:** Direct code access for customization
- **Extensibility:** Plugin system for custom tasks

**Measurable Outcomes:**
- 20% of users use Python SDK directly
- 50+ community-contributed plugins/tasks
- Active GitHub community (100+ stars, 20+ contributors)

---

## 12-Week MVP Sprint Plan

### MVP Scope Overview

**Core Principle:** Build the minimum viable product that demonstrates value to beta users and passes incubation program requirements.

**In Scope:**
- ✅ User authentication & project management
- ✅ Dataset upload, validation, preview
- ✅ 4 task types (classification, NER, sentiment, LLM fine-tuning)
- ✅ 3 security templates
- ✅ Real-time training monitoring
- ✅ Compute marketplace (5 options)
- ✅ Model inference & testing
- ✅ Basic deployment

**Out of Scope (Post-MVP):**
- ❌ Advanced visualizations (attention maps, SHAP)
- ❌ Multi-task combination builder
- ❌ All 8 task types (prioritize 4)
- ❌ Mobile SDKs
- ❌ Production Kubernetes infrastructure
- ❌ Advanced monitoring/alerting

### Week-by-Week Breakdown

#### **Week 1: Foundation Setup**

**Days 1-3: Project Initialization**
- [ ] Create monorepo structure (`/frontend`, `/backend`)
- [ ] Initialize Git with proper `.gitignore`
- [ ] Set up GitHub/GitLab repository
- [ ] Create project README with setup instructions
- [ ] Install development tools (VSCode, Docker, etc.)

**Days 4-7: Backend Foundation**
- [ ] FastAPI project scaffold
- [ ] Database schema design (users, projects, datasets, experiments)
- [ ] PostgreSQL setup with SQLAlchemy
- [ ] Alembic for migrations
- [ ] Redis setup for caching

**Days 8-10: Frontend Foundation**
- [ ] React + TypeScript + Vite setup
- [ ] TailwindCSS installation & config
- [ ] shadcn/ui component library setup
- [ ] React Query configuration
- [ ] Zustand store setup
- [ ] Basic routing (React Router)

**Days 11-14: Development Environment**
- [ ] Docker Compose for local dev (all services)
- [ ] Environment variables setup (.env templates)
- [ ] Hot reload configuration
- [ ] Dev documentation (README, setup guide)

**Deliverable:** Development environment running locally in <5 minutes

---

#### **Week 2: Authentication & Core APIs**

**Days 1-4: Authentication System**
- [ ] User model (SQLAlchemy)
- [ ] JWT token generation & validation
- [ ] `/api/v1/auth/register` endpoint
- [ ] `/api/v1/auth/login` endpoint
- [ ] `/api/v1/auth/refresh-token` endpoint
- [ ] Password hashing (bcrypt)
- [ ] Auth middleware for protected routes

**Days 5-7: Project & Dataset APIs**
- [ ] Project CRUD endpoints
  - [ ] `POST /api/v1/projects` - Create project
  - [ ] `GET /api/v1/projects` - List user's projects
  - [ ] `GET /api/v1/projects/{id}` - Get project details
  - [ ] `PUT /api/v1/projects/{id}` - Update project
  - [ ] `DELETE /api/v1/projects/{id}` - Delete project
- [ ] Dataset CRUD endpoints
  - [ ] `POST /api/v1/datasets/upload` - Upload dataset
  - [ ] `GET /api/v1/datasets` - List datasets
  - [ ] `GET /api/v1/datasets/{id}/preview` - Preview data

**Days 8-10: Auth UI**
- [ ] Login page with form validation
- [ ] Register page
- [ ] Password reset flow
- [ ] Protected route wrapper
- [ ] Auth state management (Zustand)

**Days 11-14: Dashboard UI**
- [ ] Main dashboard layout
- [ ] Project grid view
- [ ] "New Project" button → wizard entry
- [ ] Recent activity feed
- [ ] Basic stats (project count)

**Deliverable:** Users can register, login, and see empty dashboard

---

#### **Week 3: Dataset Management & Config Generator**

**Days 1-5: Dataset Upload & Validation**
- [ ] File upload endpoint with multipart/form-data
- [ ] Format auto-detection (JSON, JSONL, CSV)
- [ ] Data validation service:
  - [ ] Check required fields
  - [ ] Validate label formats
  - [ ] Detect encoding issues
- [ ] Storage service (local filesystem or MinIO)
- [ ] Dataset preview endpoint (first 100 rows)
- [ ] Label distribution analysis

**Days 6-10: Configuration Generator**
- [ ] Build service to convert UI inputs → YAML
- [ ] Task type definitions:
  - [ ] Classification config
  - [ ] NER config
  - [ ] Sentiment config
  - [ ] LLM fine-tuning config
- [ ] Model recommendation engine:
  - [ ] If dataset <1000 samples → DistilBERT
  - [ ] If Swahili text → bert-base-multilingual
  - [ ] If LLM → GPT-Neo or Llama
- [ ] Hyperparameter auto-suggestion:
  - [ ] Learning rate based on model size
  - [ ] Batch size based on dataset size
  - [ ] Epochs based on task complexity

**Days 11-14: Dataset Upload UI**
- [ ] Drag-and-drop upload component
- [ ] File validation on frontend
- [ ] Upload progress bar
- [ ] Dataset preview table (paginated)
- [ ] Label distribution chart (bar chart)
- [ ] Edit/delete dataset

**Deliverable:** Users can upload datasets and see previews

---

#### **Week 4: Training Pipeline Integration**

**Days 1-4: Celery Setup**
- [ ] Celery worker configuration
- [ ] Redis as message broker
- [ ] Task definitions:
  - [ ] `train_model.delay(config_path, project_id)`
- [ ] Stdout/stderr capture for logs
- [ ] Task status tracking (queued, running, completed, failed)

**Days 5-8: Training Job API**
- [ ] `POST /api/v1/training/start` - Start training
- [ ] `GET /api/v1/training/{job_id}/status` - Get status
- [ ] `GET /api/v1/training/{job_id}/logs` - Stream logs
- [ ] `POST /api/v1/training/{job_id}/stop` - Stop training
- [ ] WebSocket endpoint for real-time updates

**Days 9-12: Wrap Existing JengaAI Code**
- [ ] Create Celery task wrapper for `run_experiment.py`
- [ ] Generate YAML from API request
- [ ] Save model artifacts to storage
- [ ] Parse MLflow metrics for progress
- [ ] Handle training failures gracefully

**Days 13-14: Model Storage**
- [ ] Model registry database schema
- [ ] Save trained models to MinIO/S3
- [ ] Model metadata (accuracy, size, date)
- [ ] Model versioning

**Deliverable:** Backend can queue and execute training jobs

---

#### **Week 5: Core Frontend - Project Wizard**

**Days 1-4: Wizard Step 1 - Task Selection**
- [ ] Task type cards (visual, clickable)
- [ ] Task descriptions and examples
- [ ] Icons for each task type
- [ ] "Next" button navigation

**Days 5-8: Wizard Step 2 - Dataset Upload**
- [ ] Reuse dataset upload component
- [ ] Option to select existing dataset
- [ ] Data preview right in wizard
- [ ] Validation before proceeding

**Days 9-11: Wizard Step 3 - Configuration**
- [ ] Simple mode (auto-suggested settings)
- [ ] Advanced mode toggle (manual hyperparameters)
- [ ] Model selection dropdown
- [ ] Training settings form (epochs, batch size, learning rate)
- [ ] Real-time validation

**Days 12-14: Wizard Step 4 - Review & Launch**
- [ ] Summary of all selections
- [ ] Edit buttons to go back to previous steps
- [ ] "Start Training" button
- [ ] Loading state while submitting
- [ ] Redirect to training monitor on success

**Deliverable:** Users can complete full project setup wizard

---

#### **Week 6: Real-Time Training Monitor**

**Days 1-5: Training Monitor Backend**
- [ ] WebSocket connection handler
- [ ] Publish training progress events:
  - [ ] Epoch started
  - [ ] Batch completed
  - [ ] Metrics updated (loss, accuracy)
  - [ ] Validation completed
  - [ ] Training finished/failed
- [ ] Parse MLflow logs for metrics
- [ ] Send heartbeat to keep connection alive

**Days 6-10: Training Monitor UI**
- [ ] Real-time progress bar (epoch X/Y)
- [ ] Live metrics charts using Recharts:
  - [ ] Loss curve (line chart)
  - [ ] Accuracy curve (line chart)
- [ ] Console logs viewer:
  - [ ] Scrollable text area
  - [ ] Auto-scroll to bottom
  - [ ] Search/filter logs
- [ ] Resource usage (if available):
  - [ ] CPU/GPU usage
  - [ ] Memory usage
- [ ] Pause/Stop buttons
- [ ] Refresh button if WebSocket disconnects

**Days 11-14: Notifications**
- [ ] Email notification on training completion
- [ ] In-app notification system
- [ ] Success/failure alerts

**Deliverable:** Users see live training progress without manual refresh

---

#### **Week 7: Security Templates**

**Days 1-3: Template Backend**
- [ ] Template model (database)
- [ ] Template CRUD endpoints
- [ ] Pre-configured YAML templates
- [ ] Template listing endpoint

**Days 4-7: Template 1 - Hate Speech Detection**
- [ ] Pre-labeled Swahili/English dataset (synthetic or curated)
- [ ] Binary classification config (hate speech vs normal)
- [ ] Training script specific to this template
- [ ] Example use cases in description

**Days 8-10: Template 2 - Phishing Email Detection**
- [ ] Email dataset (headers, body, labels)
- [ ] Classification config (phishing vs legitimate)
- [ ] Feature engineering (URL analysis, sender domain)
- [ ] Example use cases

**Days 11-14: Template 3 - Network Threat Detection**
- [ ] Network traffic dataset (synthetic)
- [ ] Multi-class classification (DDoS, malware, normal)
- [ ] NER for extracting IP addresses, domains
- [ ] Example use cases for government MDAs

**Deliverable:** 3 security templates ready to launch with one click

---

#### **Week 8: Template UI & Customization**

**Days 1-5: Template Gallery**
- [ ] Template cards with icons and descriptions
- [ ] Filter by category (Security, Agriculture, Finance, etc.)
- [ ] "Use Template" button
- [ ] Template preview modal (shows config and sample data)

**Days 6-10: Template Customization Wizard**
- [ ] "Use Template" → Opens wizard with pre-filled config
- [ ] Allow user to upload their own data (override template data)
- [ ] Allow user to adjust hyperparameters
- [ ] "Launch" button starts training with customized config

**Days 11-14: Security Features**
- [ ] Data anonymization tool:
  - [ ] Auto-detect PII (names, emails, phone numbers)
  - [ ] Redact or mask PII before training
- [ ] Audit logging:
  - [ ] Log all user actions (create project, upload data, train model)
  - [ ] Admin view to see audit logs

**Deliverable:** Users can launch security templates and customize them

---

#### **Week 9: LLM Fine-Tuning Integration**

**Days 1-3: Merge llm_finetuning Branch**
- [ ] Resolve merge conflicts with main branch
- [ ] Update imports and dependencies
- [ ] Run tests to ensure compatibility
- [ ] Update documentation

**Days 4-7: LLM Fine-Tuning API**
- [ ] `POST /api/v1/llm-finetuning/models` - List available models
- [ ] Model browser (search HuggingFace Hub)
- [ ] LoRA configuration endpoint
- [ ] Quantization options (4-bit, 8-bit)
- [ ] Teacher-student distillation setup
- [ ] Training job execution (reuse Celery infrastructure)

**Days 8-12: LLM Fine-Tuning UI**
- [ ] Model browser with search
- [ ] Model details (size, parameters, license)
- [ ] PEFT configuration form:
  - [ ] LoRA rank slider
  - [ ] LoRA alpha slider
  - [ ] Dropout slider
  - [ ] Target modules multi-select
- [ ] Quantization toggle (4-bit, 8-bit, none)
- [ ] GPU requirement warning
- [ ] Estimated training time calculator

**Days 13-14: Integration Testing**
- [ ] End-to-end test: Select model → Configure LoRA → Train → Test
- [ ] Verify model outputs are correct
- [ ] Check model size reduction with quantization

**Deliverable:** Users can fine-tune LLMs with LoRA

---

#### **Week 10: Compute Marketplace**

**Days 1-4: Compute Option Selection**
- [ ] Add `compute_option` field to training config
- [ ] Backend routing based on compute option:
  - [ ] `platform` → Train on our servers
  - [ ] `download` → Package model for download
  - [ ] `runpod` → Dispatch to RunPod API
  - [ ] `colab` → Generate Colab notebook
  - [ ] `kaggle` → Generate Kaggle notebook

**Days 5-7: RunPod Integration**
- [ ] RunPod API client setup
- [ ] Create job on RunPod with user's API key
- [ ] Monitor RunPod job status
- [ ] Fetch trained model from RunPod
- [ ] Handle failures and timeouts

**Days 8-10: Colab Notebook Generator**
- [ ] Generate .ipynb file with:
  - [ ] Install dependencies
  - [ ] Load dataset from URL (upload to our server first)
  - [ ] Load config
  - [ ] Run training code (copy of run_experiment.py)
  - [ ] Save model artifacts
- [ ] "Open in Colab" button (opens Google Colab with notebook)

**Days 11-13: Kaggle Integration**
- [ ] Similar to Colab, generate notebook
- [ ] "Open in Kaggle" button
- [ ] Instructions for uploading to Kaggle

**Day 14: Compute Marketplace UI**
- [ ] Compute option selector (radio buttons or cards)
- [ ] Descriptions and pricing for each option
- [ ] API key input for RunPod (encrypted storage)
- [ ] Download option (immediate download after training)

**Deliverable:** Users can choose where to train their models

---

#### **Week 11: Model Inference & Testing**

**Days 1-5: Inference API**
- [ ] Load trained model from storage
- [ ] `POST /api/v1/inference/predict` - Make prediction
- [ ] Support batch predictions (upload CSV)
- [ ] Return predictions with confidence scores
- [ ] Cache models in memory for faster inference

**Days 6-10: Inference UI**
- [ ] Text input box for single predictions
- [ ] "Test" button
- [ ] Real-time prediction display
- [ ] Confidence score visualization (progress bars)
- [ ] Explanation (for NER, highlight entities)
- [ ] Audio upload for speech-to-text tasks
- [ ] Batch prediction:
  - [ ] Upload CSV with text column
  - [ ] Download CSV with predictions

**Days 11-14: Deployment Options**
- [ ] Generate API endpoint for deployed model
- [ ] API key management for deployed models
- [ ] API documentation (Swagger-style)
- [ ] Download model as .zip:
  - [ ] Model weights
  - [ ] Config file
  - [ ] Inference script (Python)
  - [ ] README with usage instructions
- [ ] Embed widget generator (iframe code)

**Deliverable:** Users can test models and deploy them

---

#### **Week 12: Testing, Documentation & Launch Prep**

**Days 1-4: End-to-End Testing**
- [ ] Test full user journey:
  - [ ] Register → Create project → Upload data → Configure → Train → Test → Deploy
- [ ] Test all task types
- [ ] Test all security templates
- [ ] Test compute marketplace options
- [ ] Fix critical bugs

**Days 5-7: Documentation**
- [ ] User guide:
  - [ ] Getting started
  - [ ] How to create a project
  - [ ] How to upload datasets
  - [ ] How to train models
  - [ ] How to deploy models
- [ ] FAQ section
- [ ] Troubleshooting guide
- [ ] API documentation (auto-generated from OpenAPI)

**Days 8-10: Demo Video**
- [ ] Script for 3-5 minute demo
- [ ] Screen recording:
  - [ ] Show full workflow from data upload to deployment
  - [ ] Highlight security templates
  - [ ] Show real-time monitoring
  - [ ] Show compute marketplace
- [ ] Add voiceover and captions
- [ ] Edit and export

**Days 11-12: Deployment to Staging**
- [ ] Set up staging server
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Deploy backend (DigitalOcean/AWS)
- [ ] Configure domain and SSL
- [ ] Test on staging

**Days 13-14: Incubation Submission**
- [ ] Finalize Technical Roadmap PDF
- [ ] Prepare pitch deck
- [ ] Prepare case studies (if any beta users)
- [ ] Submit to incubation program
- [ ] Celebrate! 🎉

**Deliverable:** MVP deployed to staging and ready for beta users

---

## Compute Marketplace Innovation

### Concept
Traditional ML platforms lock users into their infrastructure. **JengaAI Compute Marketplace** gives users full control over where and how they train models.

### The 5 Compute Options

#### 1. **Platform Inference (Monetization)**
**How it works:**
- User trains model on our platform
- Model stays hosted on our servers
- User gets API endpoint: `https://api.JengaAI.ke/v1/models/{model_id}/predict`
- Pay per 1000 requests

**Pricing:**
- Free tier: 1000 requests/month
- Pro: $0.01 per 1000 requests
- Enterprise: Custom pricing

**Benefits:**
- No infrastructure management for user
- Automatic scaling
- Always available
- Revenue stream for platform

**Use Cases:**
- Small businesses with low-volume apps
- Prototyping and testing
- Mobile apps (call API from app)

#### 2. **Download Model**
**How it works:**
- User trains model on platform
- Downloads .zip file containing:
  - Model weights (`model.pth`)
  - Config file (`config.yaml`)
  - Tokenizer files
  - Inference script (`inference.py`)
  - README with instructions
- User deploys on their own infrastructure

**Pricing:** Free (one-time training fee if applicable)

**Benefits:**
- Full control and ownership
- No ongoing costs
- Data stays on-premise
- Can customize inference code

**Use Cases:**
- Government agencies (on-premise requirement)
- Large enterprises with existing infrastructure
- Developers who want full control

#### 3. **RunPod Integration (Bring Your Own GPU)**
**How it works:**
- User provides their RunPod API key
- Platform creates training job on RunPod
- Training happens on RunPod GPUs
- User pays RunPod directly
- Platform fetches trained model when done

**Pricing:**
- Platform fee: $0 (or small fee like $1 per training job)
- User pays RunPod GPU costs directly (~$0.20/hour for RTX 3090)

**Benefits:**
- Access to powerful GPUs without platform managing them
- Cost-effective for LLM fine-tuning
- User controls GPU type and duration

**Use Cases:**
- LLM fine-tuning (requires GPUs)
- Large datasets that need powerful compute
- Users who want flexibility

#### 4. **Google Colab Notebook Generator**
**How it works:**
- Platform generates a Colab notebook (`.ipynb`)
- Notebook includes:
  - Dataset download from platform
  - Training code
  - Model upload back to platform (optional)
- User clicks "Open in Colab"
- Runs in user's Google account (free or paid GPU)

**Pricing:** Free

**Benefits:**
- Completely free (Colab free tier)
- No API keys needed
- Good for learning and experimentation

**Use Cases:**
- Students and researchers
- Prototyping
- Users without budget

#### 5. **Kaggle Integration**
**How it works:**
- Similar to Colab
- Generate Kaggle notebook
- User runs on Kaggle's free GPU quota (30 hours/week)

**Pricing:** Free

**Benefits:**
- Free GPU access
- Kaggle community support
- Good for competitions and learning

**Use Cases:**
- Data scientists familiar with Kaggle
- Competitions
- Learning and experimentation

### Technical Implementation

#### API Endpoint
```python
POST /api/v1/training/start
{
  "project_id": "proj_123",
  "config": {
    "task_type": "classification",
    "model": "distilbert-base-uncased",
    ...
  },
  "compute_option": "runpod",  // or "platform", "colab", "kaggle", "download"
  "compute_config": {
    "runpod_api_key": "abc123",  // Only if RunPod
    "gpu_type": "RTX3090"
  }
}
```

#### Backend Routing
```python
def start_training(request):
    compute_option = request.compute_option

    if compute_option == "platform":
        # Queue Celery task on our servers
        task = train_on_platform.delay(request.config)

    elif compute_option == "runpod":
        # Create RunPod job
        task = train_on_runpod.delay(request.config, request.compute_config)

    elif compute_option == "colab":
        # Generate notebook and return download link
        notebook = generate_colab_notebook(request.config)
        return {"notebook_url": notebook.url}

    elif compute_option == "kaggle":
        # Generate Kaggle notebook
        notebook = generate_kaggle_notebook(request.config)
        return {"notebook_url": notebook.url}

    elif compute_option == "download":
        # Train on platform, then package for download
        task = train_and_package.delay(request.config)

    return {"job_id": task.id}
```

### Business Model
- **Free Tier:** Colab/Kaggle options, limited platform training
- **Pro Tier ($20/month):** Unlimited platform training, 10k inference requests
- **Pay-as-you-go:** $0.01 per 1000 inference requests
- **Enterprise:** Custom pricing, on-premise deployment, SLA

---

## Complete Feature List

### Core Features (MVP)

#### Authentication & User Management
- [x] User registration with email verification
- [x] Login with JWT tokens
- [x] Password reset flow
- [x] User profile management
- [x] Role-based access control (admin, user)

#### Project Management
- [x] Create/Read/Update/Delete projects
- [x] Project dashboard with stats
- [x] Project search and filtering
- [x] Project sharing (future: collaboration)

#### Dataset Management
- [x] Upload datasets (JSON, JSONL, CSV)
- [x] Auto-detect data format
- [x] Data validation (check labels, format)
- [x] Dataset preview (first 100 rows)
- [x] Label distribution visualization
- [x] Dataset versioning
- [x] Delete/rename datasets

#### Task Configuration
- [x] 4 task types:
  - [x] Single-label classification
  - [x] Named Entity Recognition (NER)
  - [x] Sentiment analysis
  - [x] LLM fine-tuning
- [x] Visual task selection
- [x] Auto-suggested hyperparameters
- [x] Advanced configuration mode (manual settings)
- [x] Config validation before training

#### Training
- [x] Start training jobs
- [x] Queue jobs (Celery)
- [x] **Real-time training monitoring:**
  - [x] Live progress bar
  - [x] Epoch counter
  - [x] Metrics charts (loss, accuracy)
  - [x] Console log streaming
  - [x] Resource usage (CPU/GPU, memory)
- [x] Pause/stop training
- [x] Resume training from checkpoint
- [x] Email notification on completion

#### Compute Marketplace
- [x] 5 compute options:
  - [x] Platform inference (hosted)
  - [x] Download model (.zip)
  - [x] RunPod integration (API)
  - [x] Google Colab notebook generator
  - [x] Kaggle integration
- [x] User chooses compute option
- [x] API key management (for RunPod)
- [x] Cost estimation for each option

#### Security Templates
- [x] 3 pre-built templates:
  - [x] Hate speech detection (Swahili/English)
  - [x] Phishing email detection
  - [x] Network threat classification
- [x] Template gallery
- [x] One-click template launch
- [x] Template customization (upload custom data)
- [x] Data anonymization tool (PII redaction)

#### Model Inference & Testing
- [x] Single prediction (text input)
- [x] Batch prediction (CSV upload)
- [x] Confidence scores visualization
- [x] Entity highlighting (for NER)
- [x] Audio upload (for speech-to-text)
- [x] Export predictions to CSV

#### Deployment
- [x] Deploy model as REST API
- [x] API key management
- [x] Rate limiting configuration
- [x] Download model as .zip:
  - [x] Model weights
  - [x] Config file
  - [x] Inference script
  - [x] README
- [x] API documentation (Swagger)
- [x] Embed widget generator (iframe)

#### Documentation & Support
- [x] User guide (getting started, tutorials)
- [x] FAQ section
- [x] Troubleshooting guide
- [x] API documentation (auto-generated)
- [x] Demo video

### Post-MVP Features

#### Additional Task Types
- [ ] Multi-label classification
- [ ] Question Answering
- [ ] Summarization
- [ ] Translation (Swahili ↔ English)
- [ ] Speech-to-text (Whisper integration)

#### Advanced Features
- [ ] Multi-task combination builder
- [ ] Visual pipeline builder (drag-and-drop)
- [ ] Task dependency configuration
- [ ] Model interpretability (SHAP values)
- [ ] Attention visualization
- [ ] Confusion matrix visualization

#### More Templates
- [ ] Agricultural disease detection
- [ ] M-Pesa fraud detection
- [ ] Customer sentiment analysis
- [ ] Government document classification
- [ ] Policy document analysis

#### MLflow Integration
- [ ] Embed MLflow UI in platform
- [ ] Compare experiment runs
- [ ] Custom metrics visualization
- [ ] Model registry

#### Production Infrastructure
- [ ] Kubernetes deployment
- [ ] Auto-scaling
- [ ] Load balancing
- [ ] Monitoring & alerting (Prometheus, Grafana)
- [ ] Error tracking (Sentry)

#### Mobile
- [ ] Mobile-friendly responsive design
- [ ] iOS SDK (model export)
- [ ] Android SDK (model export)

---

## Milestones & Deliverables

### Milestone 1: Foundation (Weeks 1-2)
**Objective:** Set up development environment and core infrastructure

**Deliverables:**
- [ ] Monorepo with `/frontend` and `/backend`
- [ ] Docker Compose dev environment
- [ ] FastAPI backend with auth
- [ ] React frontend with routing
- [ ] PostgreSQL + Redis setup
- [ ] Project & dataset CRUD APIs
- [ ] Login/register UI
- [ ] Dashboard UI

**Success Criteria:**
- Dev environment starts in <5 minutes
- Users can register, login, and see empty dashboard

---

### Milestone 2: Dataset & Training Pipeline (Weeks 3-4)
**Objective:** Build dataset management and training job execution

**Deliverables:**
- [ ] Dataset upload API with validation
- [ ] Config generator service
- [ ] Celery task queue setup
- [ ] Training job API (start, status, logs)
- [ ] Wrap existing JengaAI code in Celery tasks
- [ ] Model storage (MinIO/filesystem)
- [ ] Dataset upload UI
- [ ] Dataset preview UI

**Success Criteria:**
- Users can upload datasets and see previews
- Backend can execute training jobs in background

---

### Milestone 3: Core Frontend (Weeks 5-6)
**Objective:** Build user-facing workflows for training

**Deliverables:**
- [ ] 4-step project wizard:
  - [ ] Task selection
  - [ ] Dataset upload
  - [ ] Configuration
  - [ ] Review & launch
- [ ] **Real-time training monitor:**
  - [ ] WebSocket connection
  - [ ] Live progress bar
  - [ ] Metrics charts
  - [ ] Console logs
  - [ ] Pause/stop buttons
- [ ] Email notifications

**Success Criteria:**
- Users can create a project and train a model
- Users see live training progress without refresh

---

### Milestone 4: Security Templates (Weeks 7-8)
**Objective:** Build 3 security templates for Kenyan use cases

**Deliverables:**
- [ ] Template database model & API
- [ ] Template 1: Hate speech detection
- [ ] Template 2: Phishing email detection
- [ ] Template 3: Network threat detection
- [ ] Template gallery UI
- [ ] Template customization wizard
- [ ] Data anonymization tool
- [ ] Audit logging

**Success Criteria:**
- Users can launch security templates with one click
- Templates produce accurate results (>80% accuracy)

---

### Milestone 5: LLM Fine-Tuning (Week 9)
**Objective:** Integrate LLM fine-tuning capabilities

**Deliverables:**
- [ ] Merge llm_finetuning branch
- [ ] LLM fine-tuning API
- [ ] Model browser (HuggingFace search)
- [ ] LoRA configuration UI
- [ ] Quantization options
- [ ] Training integration

**Success Criteria:**
- Users can fine-tune LLMs with LoRA
- Quantization reduces model size by >50%

---

### Milestone 6: Compute Marketplace (Week 10)
**Objective:** Build flexible compute infrastructure

**Deliverables:**
- [ ] Compute option selection in UI
- [ ] RunPod API integration
- [ ] Google Colab notebook generator
- [ ] Kaggle notebook generator
- [ ] Download model packaging
- [ ] Platform inference hosting

**Success Criteria:**
- All 5 compute options work end-to-end
- Users can successfully train on RunPod
- Generated Colab notebook runs without errors

---

### Milestone 7: Inference & Deployment (Week 11)
**Objective:** Enable model testing and deployment

**Deliverables:**
- [ ] Inference API (single & batch)
- [ ] Inference UI (text input, results)
- [ ] Deploy model as API
- [ ] Download model as .zip
- [ ] API documentation
- [ ] Embed widget generator

**Success Criteria:**
- Users can test models with sample inputs
- Deployed APIs respond in <1 second
- Downloaded models work locally

---

### Milestone 8: MVP Launch (Week 12)
**Objective:** Test, document, and launch MVP

**Deliverables:**
- [ ] End-to-end testing
- [ ] Bug fixes
- [ ] User documentation
- [ ] Demo video (3-5 min)
- [ ] Deploy to staging
- [ ] Technical Roadmap PDF
- [ ] Incubation submission

**Success Criteria:**
- 10 beta users successfully train a model
- Demo video showcases all key features
- Staging environment is stable
- Incubation submission accepted

---

## Technical Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│              React + TailwindCSS + TypeScript            │
│         - Project wizard, Training monitor, Testing      │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS (REST + WebSocket)
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   LOAD BALANCER                          │
│                    (Nginx/Traefik)                       │
│                  - SSL termination                       │
│                  - Rate limiting                         │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ FastAPI  │  │ FastAPI  │  │ FastAPI  │
│ Instance │  │ Instance │  │ Instance │
│   #1     │  │   #2     │  │   #3     │
└─────┬────┘  └─────┬────┘  └─────┬────┘
      │             │              │
      └─────────────┼──────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│PostgreSQL│  │  Redis   │  │  MinIO   │
│    DB    │  │  Cache   │  │ Storage  │
│          │  │  +Queue  │  │ (Models) │
└──────────┘  └─────┬────┘  └──────────┘
                    │ Message Broker
                    ▼
             ┌──────────────┐
             │    Celery    │
             │   Workers    │
             │  (Training)  │
             └──────┬───────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  JengaAI   │ │   RunPod    │ │MLflow/      │
│  Framework  │ │   API       │ │TensorBoard  │
│(multitask_  │ │(External GPU│ │(Experiment  │
│bert + llm)  │ │  compute)   │ │ tracking)   │
└─────────────┘ └─────────────┘ └─────────────┘
```

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',  -- 'user' or 'admin'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(50),  -- 'classification', 'ner', 'sentiment', 'llm'
  status VARCHAR(50) DEFAULT 'draft',  -- 'draft', 'training', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Datasets table
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),  -- Path in MinIO/filesystem
  format VARCHAR(50),  -- 'json', 'jsonl', 'csv'
  num_rows INT,
  num_labels INT,
  label_distribution JSONB,  -- {"positive": 100, "negative": 50}
  created_at TIMESTAMP DEFAULT NOW()
);

-- Experiments (training jobs) table
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  config JSONB,  -- Full training config
  compute_option VARCHAR(50),  -- 'platform', 'runpod', 'colab', etc.
  status VARCHAR(50) DEFAULT 'queued',  -- 'queued', 'running', 'completed', 'failed'
  celery_task_id VARCHAR(255),  -- For tracking Celery task
  metrics JSONB,  -- {"accuracy": 0.92, "loss": 0.15}
  logs TEXT,  -- Training logs
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Models table
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  version INT DEFAULT 1,
  model_path VARCHAR(500),  -- Path in MinIO
  model_size_mb FLOAT,
  accuracy FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),  -- 'security', 'agriculture', 'finance'
  task_type VARCHAR(50),
  config JSONB,  -- Pre-configured settings
  sample_data_path VARCHAR(500),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API Keys table (for deployed models)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  requests_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100),  -- 'create_project', 'upload_dataset', 'start_training'
  resource_type VARCHAR(50),  -- 'project', 'dataset', 'experiment'
  resource_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Data Flow

#### Training Flow
1. **User configures experiment** → Frontend form → API
2. **API generates YAML config** → Config generator service
3. **API creates experiment record** → PostgreSQL (status: 'queued')
4. **API dispatches Celery task** → Redis queue
5. **Celery worker picks up task** → Executes training
6. **Worker runs JengaAI code** → `run_experiment.py` with YAML
7. **Training produces logs** → Published to WebSocket
8. **Frontend receives updates** → Updates UI in real-time
9. **Training completes** → Model saved to MinIO
10. **Worker updates experiment** → PostgreSQL (status: 'completed')
11. **User notified** → Email + in-app notification

#### Inference Flow
1. **User enters text** → Frontend form → API
2. **API loads model** → From MinIO (cached in memory)
3. **API runs inference** → JengaAI inference code
4. **API returns predictions** → JSON response
5. **Frontend displays results** → Formatted with charts

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2+ | UI framework |
| TypeScript | 5.0+ | Type safety |
| Vite | 5.0+ | Build tool (fast dev server) |
| TailwindCSS | 3.4+ | Styling |
| shadcn/ui | Latest | Component library |
| React Query | 5.0+ | Data fetching, caching |
| Zustand | 4.5+ | State management |
| React Hook Form | 7.50+ | Form handling |
| Zod | 3.22+ | Schema validation |
| Recharts | 2.10+ | Charts for metrics |
| React Router | 6.20+ | Routing |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.9+ | Programming language |
| FastAPI | 0.104+ | Web framework |
| Uvicorn | 0.24+ | ASGI server |
| SQLAlchemy | 2.0+ | ORM |
| Alembic | 1.13+ | Database migrations |
| PostgreSQL | 15+ | Relational database |
| Redis | 7+ | Cache + message broker |
| Celery | 5.3+ | Task queue |
| Pydantic | 2.5+ | Data validation |
| PyJWT | 2.8+ | JWT tokens |
| Passlib | 1.7+ | Password hashing |

### ML Infrastructure

| Technology | Version | Purpose |
|------------|---------|---------|
| PyTorch | 2.2.2 | Deep learning framework |
| Transformers | 4.57+ | Pretrained models |
| Datasets | 4.2+ | Data loading |
| PEFT | Latest | LoRA fine-tuning |
| BitsAndBytes | Latest | Quantization |
| Accelerate | Latest | Distributed training |
| MLflow | 2.10+ | Experiment tracking |
| TensorBoard | 2.15+ | Visualization |

### DevOps

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Local development |
| Nginx | Load balancer, reverse proxy |
| GitHub Actions | CI/CD |
| MinIO | Object storage (S3-compatible) |
| Prometheus | Metrics collection |
| Grafana | Metrics visualization |

---

## Team Responsibilities

### ML Engineer (Backend + ML)

**Weeks 1-2:**
- Set up backend FastAPI project
- Design database schema
- Implement auth endpoints
- Set up Celery + Redis

**Weeks 3-4:**
- Build dataset upload & validation
- Create config generator
- Wrap existing JengaAI code in Celery
- Implement training job API

**Weeks 5-6:**
- WebSocket for real-time updates
- Parse MLflow logs for metrics
- Training pause/stop functionality

**Weeks 7-8:**
- Create 3 security templates
- Build data anonymization tool
- Audit logging

**Week 9:**
- Merge llm_finetuning branch
- LLM fine-tuning API
- LoRA + quantization integration

**Week 10:**
- RunPod API integration
- Colab/Kaggle notebook generator
- Compute marketplace backend

**Week 11:**
- Inference API
- Model deployment (API generation)
- Download model packaging

**Week 12:**
- Backend testing
- Bug fixes
- API documentation

### Frontend Developer

**Weeks 1-2:**
- Set up React + TypeScript project
- Configure TailwindCSS + shadcn/ui
- Build login/register pages
- Create dashboard layout

**Weeks 3-4:**
- Dataset upload UI
- Dataset preview table
- Project list view

**Weeks 5-6:**
- 4-step project wizard
- Real-time training monitor (WebSocket)
- Charts for metrics (Recharts)

**Weeks 7-8:**
- Template gallery UI
- Template customization wizard
- Security features UI

**Week 9:**
- LLM fine-tuning UI
- Model browser
- PEFT config forms

**Week 10:**
- Compute marketplace UI
- Compute option selector
- RunPod API key input

**Week 11:**
- Inference UI (testing)
- Batch prediction UI
- Deployment UI

**Week 12:**
- Frontend testing
- UI polish
- Demo video recording

### Shared Responsibilities

- **Daily standups:** 15-minute sync
- **Code reviews:** Review each other's PRs
- **Integration:** Ensure frontend + backend work together
- **Testing:** End-to-end testing together
- **Documentation:** Both contribute to user guide
- **Demo video:** Collaborate on script and recording

---

## Risk Management

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Long training times frustrate users | High | High | - Show accurate time estimates<br>- Email notifications<br>- Background training with Celery |
| WebSocket connection drops | Medium | Medium | - Auto-reconnect logic<br>- Fallback to polling<br>- Heartbeat pings |
| GPU unavailability for LLM | High | Medium | - Offer CPU models (DistilBERT)<br>- RunPod integration<br>- Colab/Kaggle options |
| Model storage costs | Medium | Medium | - Compress models<br>- Delete old models automatically<br>- User storage limits |
| Data privacy concerns | Medium | High | - On-premise option<br>- Data encryption<br>- Clear privacy policy |
| Platform downtime during training | Low | High | - Checkpoint saving<br>- Auto-resume training<br>- Backup servers |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low user adoption | Medium | High | - Beta program with target users<br>- User interviews for feedback<br>- Marketing campaign |
| Insufficient beta users | Medium | Medium | - Reach out to NGOs, universities<br>- Government partnerships<br>- Social media campaign |
| Competition from Hugging Face AutoTrain | High | Medium | - Focus on African languages<br>- Security templates<br>- Compute marketplace differentiation |
| Funding constraints | Medium | High | - Bootstrap initially<br>- Freemium monetization<br>- Grant applications |

### Schedule Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| 12-week timeline too aggressive | High | High | - Prioritize must-haves ruthlessly<br>- Cut non-essential features<br>- Work weekends if needed (with breaks) |
| Team member unavailable | Low | High | - Cross-train on each other's work<br>- Document everything<br>- Have backup plan |
| Bugs discovered late | Medium | Medium | - Test continuously (not just Week 12)<br>- Daily integration testing<br>- Alpha testing with friends |

---

## Success Metrics

### MVP Success (Week 12)

**Technical Metrics:**
- [ ] Platform uptime >95% during beta
- [ ] Training start time <1 minute (from click to Celery task)
- [ ] API response time <200ms (p95)
- [ ] WebSocket latency <100ms

**User Metrics:**
- [ ] 10 beta users successfully train a model
- [ ] Average task completion rate >80%
- [ ] Average time to first model trained <20 minutes
- [ ] User satisfaction score >4/5 (survey)

**Feature Metrics:**
- [ ] All 4 task types work end-to-end
- [ ] 3 security templates deployed
- [ ] 5 compute options functional
- [ ] Real-time monitoring works without refresh

### 6-Month Success (Post-Launch)

**User Growth:**
- 500+ registered users
- 200+ monthly active users (MAU)
- 30% user retention after 30 days

**Platform Usage:**
- 1000+ models trained
- 10,000+ inference requests
- 50+ models deployed in production

**Business Impact:**
- 10+ security models in Kenyan government
- 20+ agricultural models in use
- 5+ paying customers (Pro tier)
- $1000+ MRR (monthly recurring revenue)

**Community:**
- 100+ GitHub stars
- 20+ community contributions
- 10+ case studies published

---

## Next Steps

### Immediate (Week 1, Day 1)
1. **Team Kickoff Meeting**
   - Review this plan together
   - Assign initial tasks
   - Set up communication channels (Slack, Discord, etc.)
   - Agree on meeting schedule

2. **Set Up Development Environment**
   - Install Docker, Node.js, Python
   - Clone repository
   - Create feature branches
   - Test that dev environment works

3. **Sprint Planning**
   - Break down Week 1 tasks into daily todos
   - Estimate time for each task
   - Identify blockers

### Weekly Rituals
- **Monday:** Sprint planning, assign tasks
- **Daily:** 15-minute standup (async or sync)
- **Friday:** Demo progress, retrospective
- **Sunday:** Week review, plan next week

### Communication
- **Slack/Discord:** Daily updates
- **GitHub:** All code, PRs, issues
- **Google Docs:** Documentation, notes
- **Loom:** Demo videos, async communication

### Incubation Submission Checklist
- [ ] Technical Roadmap PDF (from TECHNICAL_ROADMAP.md)
- [ ] Live staging deployment
- [ ] Demo video (3-5 min)
- [ ] Pitch deck (10 slides)
- [ ] User documentation
- [ ] GitHub repository
- [ ] Beta user list
- [ ] Financial projections

---

**Good luck! Let's build something amazing for Africa!**

---
---

# V2 ADDENDUM: Complete Rebuild (February 2026)

## What Changed and Why

The V1 framework (in `/home/naynek/Desktop/JengaAI/`) was a research-grade Python-only NLP framework. After thorough analysis, we identified critical gaps that required a **complete rebuild** of the core ML framework before building the web platform.

### V1 Issues Discovered

| Category | Issue | Impact |
|----------|-------|--------|
| **Hardcoded sizes** | `nn.Linear(768, num_labels)` in all tasks | Breaks with any non-BERT-base model |
| **Config system** | Dataclasses with no validation | Invalid configs cause cryptic runtime errors |
| **Fusion** | No dropout/residual, tensor created each forward | Overfitting + memory inefficiency |
| **Training** | No AMP, no checkpoints, no gradient clipping | Slow, fragile, can't resume from crash |
| **Data** | Hardcoded `tasks[0]`, no CSV, no single-label | Multi-task data processing broken |
| **Collators** | Lambda closures capture loop variable | Silent bugs in dataloading |
| **Eval loss** | Computed as `1 - f1` instead of real loss | Early stopping/best model selection wrong |
| **Logging** | `print()` statements | Not production-ready |
| **No web layer** | CLI-only, no API, no frontend | Users must write Python |
| **No security** | No adversarial training, no audit, no HITL | Not suitable for government deployment |

### V2 Core Framework (BUILT)

The following modules have been built fresh in `jenga_ai/`:

```
jenga_ai/                           # 25 Python modules, ~2500 lines
  core/config.py                    # Pydantic configs with full validation
  core/model.py                     # MultiTaskModel with dynamic hidden_size
  core/fusion.py                    # AttentionFusion with residual + dropout + gating
  tasks/base.py                     # BaseTask with dynamic hidden_size
  tasks/classification.py           # Single + Multi-label with dropout heads
  tasks/ner.py                      # NER with proper ignore_index handling
  tasks/sentiment.py                # Sentiment analysis (extends classification)
  tasks/regression.py               # NEW: Regression task (MSE/Huber loss)
  tasks/registry.py                 # Task auto-discovery and registration
  data/processor.py                 # JSON/JSONL/CSV, per-task processing
  data/collators.py                 # Class-based collators (no lambda bug)
  training/trainer.py               # AMP, grad clipping, accumulation, checkpoints
  training/callbacks.py             # Logging, EarlyStopping, Checkpoint callbacks
  training/metrics.py               # All task type metrics
  utils/logging.py                  # Proper Python logging
  utils/device.py                   # Device management + AMP checks
  security/adversarial.py           # FGSM/PGD adversarial training
  security/explainability.py        # Attention viz, gradient importance, occlusion
  security/audit.py                 # Hash-chained audit trail
  security/hitl.py                  # Human-in-the-loop routing
  training/continual.py             # EWC, replay, LwF, progressive freezing
  training/curriculum.py            # Nested learning, difficulty curriculum, task phasing
  training/regularization.py        # Label smoothing, R-Drop, focal loss, mixup, SWA, distillation
  models/graph/                     # GNN architecture (planned)
  models/sequential/                # LSTM/GRU architecture (planned)
  models/hybrid/                    # Multi-modal models (planned)
```

### V2 New Security Modules

#### Adversarial Training (`security/adversarial.py`)
- FGSM and PGD attacks on embeddings
- Adversarial loss weighting (clean + adversarial)
- Robustness evaluation
- Defends against: evasion attacks, prompt injection, data poisoning

#### Explainability (`security/explainability.py`)
- Attention-based token importance
- Gradient-based feature attribution
- Occlusion-based (leave-one-out) analysis
- Human-readable explanation reports
- Required for: Kenya Data Protection Act, government audit

#### Audit Trail (`security/audit.py`)
- Hash-chained event log (tamper-evident)
- Data provenance tracking (input/output hashes)
- Complete model lifecycle logging
- Integrity verification
- Required for: Government compliance, security audits

#### Human-in-the-Loop (`security/hitl.py`)
- Entropy-based uncertainty estimation
- Margin-based uncertainty estimation
- Configurable routing (auto-accept vs human review)
- Priority-based review queue (critical/high/medium/low)
- Policy-based routing (certain tasks always require human)
- Required for: National security decisions, building analyst trust

### V2 Advanced Training Techniques (BUILT)

#### Continual Learning (`training/continual.py`)
Prevents catastrophic forgetting when models learn new tasks/data:
- **Elastic Weight Consolidation (EWC)** — Fisher Information identifies critical weights; penalizes changes
- **Experience Replay** — Stores old examples in buffer, mixes into new training batches
- **Learning without Forgetting (LwF)** — Distills old model's knowledge without storing old data
- **Progressive Freezing** — Freezes bottom encoder layers as new tasks are added
- **ContinualLearningManager** — High-level orchestration (before_task / after_task API)

#### Curriculum & Nested Learning (`training/curriculum.py`)
Models learn in a meaningful order — easy to hard, general to specific:
- **Difficulty-based curriculum** — Start with clear examples, gradually introduce ambiguous ones
- **Competence-based progression** — Advance only when model demonstrates mastery
- **Anti-curriculum (hard mining)** — Focus on examples the model gets wrong
- **Nested/hierarchical learning** — Parent tasks (threat detection) scaffold child tasks (threat type)
- **Task-phased scheduling** — Introduce tasks progressively (classification first, then NER, then sentiment)
- **DifficultyScorer** — Scores examples by loss, confidence, or heuristics

#### Advanced Regularization (`training/regularization.py`)
Techniques that improve generalization and handle class imbalance:
- **Label smoothing** — Prevents overconfident predictions (critical for security models)
- **R-Drop** — Regularized dropout; forces consistency across stochastic passes
- **Focal Loss** — Down-weights easy examples, focuses on rare threats (class imbalance)
- **Mixup** — Interpolate examples for smoother decision boundaries
- **Stochastic Weight Averaging (SWA)** — Average weights for wider optima
- **Knowledge Distillation** — Compress SwahiliBERT → SwahiliDistilBERT with teacher-student training
- **RegularizationManager** — Combine multiple techniques in one training run

### V2 Model Compression & Quantization

| Method | What It Does | Size Reduction | Use Case |
|--------|-------------|---------------|----------|
| **LoRA** | Low-rank adapter layers, freeze base model | ~95% fewer trainable params | Fine-tuning on limited GPU |
| **4-bit quantization** | int4 weight precision | ~75% smaller model | Edge/mobile deployment |
| **8-bit quantization** | int8 weight precision | ~50% smaller model | Server with memory constraints |
| **Knowledge distillation** | Teacher-student training | Smaller architecture | SwahiliBERT → SwahiliDistilBERT |
| **SwahiliDistilBERT** | Pre-trained distilled model | 40% smaller, 60% faster | Default for speed-sensitive tasks |
| **ONNX export** (planned) | Optimized inference runtime | 2-4x faster inference | Production serving |

### V2 Pre-trained Models

| Model | Parameters | Pre-trained For | Source |
|-------|-----------|----------------|--------|
| **SwahiliBERT** | ~110M | General Swahili NLP | Open-sourced by Jenga-AI |
| **SwahiliDistilBERT** | ~66M | Fast Swahili inference | Distilled from SwahiliBERT |
| **SwahiliSpacyModel** | — | Tokenization, POS, deps | spaCy-compatible |
| **AfroXLMR** | ~270M | Multilingual African | Community model |
| **Whisper** | 39M-1.5B | Swahili speech-to-text | OpenAI |

### V2 Advanced Model Architectures (Planned)

#### Graph Neural Networks (`models/graph/`)
Target use cases for Kenya:
- **M-Pesa fraud rings** - Transaction graph analysis
- **Corruption networks** - Procurement collusion detection
- **Bot network detection** - Social media graph analysis
- **Cyber threat mapping** - Attack infrastructure correlation

#### Sequential Models (`models/sequential/`)
Target use cases:
- **Network intrusion detection** - Packet sequence analysis
- **Insider threat detection** - User behavior sequences
- **Financial fraud** - Transaction pattern anomalies
- **Log analysis** - Multi-step attack detection

#### Hybrid Models (`models/hybrid/`)
- Transformer + GNN (text content + relationship graph)
- Transformer + LSTM (document analysis + temporal patterns)
- Ensemble approaches for high-stakes security decisions

### V2 Threat Considerations

#### AI-Enhanced Cyber Threats
- Adversarial training hardens models against AI-crafted evasion
- Explainability helps analysts understand AI-generated attack patterns
- HITL ensures human oversight for AI-vs-AI scenarios

#### Quantum-Level Threats
- Audit trail uses SHA-256 (upgradeable to post-quantum hash)
- Framework architecture supports algorithm-agility
- Data encryption at rest can be upgraded to post-quantum schemes

### Updated Roadmap

| Phase | Week | Focus | Status |
|-------|------|-------|--------|
| **Core ML V2** | 1-2 | Config, tasks, fusion, model, data, trainer | COMPLETE |
| **Security** | 2 | Adversarial, explainability, audit, HITL | COMPLETE |
| **Advanced Training** | 2-3 | Continual learning, curriculum, regularization | COMPLETE |
| **LLM Module** | 3 | LoRA fine-tuning, quantization, distillation | Planned |
| **Inference** | 3-4 | Inference handler, export, tests | Planned |
| **Backend** | 5-8 | FastAPI, auth, training API, WebSocket | Planned |
| **Frontend** | 9-11 | React, wizard, monitor, templates | Planned |
| **DevOps** | 12 | Docker, docs, staging deploy | Planned |
