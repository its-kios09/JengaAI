# Jenga-AI: Multi-Task NLP for National Security & Governance

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python Version](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.x-red.svg)](https://pytorch.org/)

> Your model. Your data. Your task. From simple classifiers to multi-task fusion — no code required.

Jenga-AI is an open-source NLP framework built for Kenya's security and governance challenges. Use our pre-trained African language models (SwahiliDistilBERT, SwahiliBERT, SwahiliSpacy) or any HuggingFace model to train anything from a simple text classifier to a multi-task fusion model that classifies threats, extracts entities, and analyzes sentiment simultaneously.

**Use it your way:**
- **Just need a classifier?** Pick SwahiliBERT, define one task, train. No fusion, no complexity.
- **Need multi-task fusion?** Define 3+ tasks with attention fusion and shared learning across all of them.
- **Need it fast and small?** Quantize to 4-bit/8-bit, compress with LoRA, export for edge deployment.
- **No code?** The web platform lets non-technical users upload data, click Train, and deploy.

---

## What It Solves

| Problem | Jenga-AI Approach |
|---------|------------------|
| Hate speech in Swahili/Sheng | Multi-task classification + sentiment + entity extraction in one model |
| M-Pesa fraud & money laundering | Graph Neural Networks mapping transaction networks |
| Corruption & procurement fraud | GNN analysis of bidding patterns and ownership structures |
| Network intrusion & cyber attacks | LSTM/GRU sequential models on packet/log streams |
| Government phishing campaigns | Email classification with domain/URL analysis |
| Insider threats | Behavioral sequence modeling with anomaly detection |
| AI-enhanced evasion attacks | Adversarial training (FGSM/PGD) hardens models |
| "Why did the AI flag this?" | Explainability engine with human-readable reports |
| Audit compliance | Hash-chained tamper-evident log of every action |
| Low-confidence edge cases | Human-in-the-Loop routing with priority queuing |

---

## Pre-trained Models

Use our open-sourced African language models or bring any model from HuggingFace:

| Model | Parameters | Best For |
|-------|-----------|----------|
| **SwahiliDistilBERT** | ~66M | Fast inference, lightweight tasks, edge deployment |
| **SwahiliBERT** | ~110M | General Swahili NLP, classification, NER, sentiment |
| **SwahiliSpacyModel** | — | Tokenization, POS tagging, dependency parsing |
| **AfroXLMR** | ~270M | Multilingual African language tasks |
| **bert-base-multilingual** | ~177M | Swahili-English code-switching |
| **Whisper** | 39M-1.5B | Swahili speech-to-text transcription |
| *Any HuggingFace model* | — | Specify any model name in your config |

---

## Quick Start (Developers)

### Install

```bash
git clone https://github.com/Rogendo/Jenga-AI.git
cd JengaAI
python -m venv venv && source venv/bin/activate
pip install -e .
```

### Use Case 1: Simple Single-Task Model

Don't need fusion? Just pick a model, pick a task, and train. This is the simplest way to use Jenga-AI — no multi-task complexity, just a straightforward fine-tuned model.

```yaml
# swahili_classifier.yaml
project_name: "hate-speech-detector"

model:
  name: "jenga-ai/SwahiliBERT"       # our pre-trained Swahili model

fusion:
  type: "none"                         # no fusion needed for single task

tasks:
  - name: "hate_speech"
    type: "single_label_classification"
    num_labels: 3                      # hate, offensive, normal
    data_path: "data/hate_speech.csv"
    text_column: "message"
    label_column: "category"

training:
  epochs: 5
  batch_size: 32
  learning_rate: 3e-5
  use_amp: true
```

```python
from jenga_ai.core.config import ExperimentConfig
from jenga_ai.core.model import MultiTaskModel
from jenga_ai.data.processor import DataProcessor
from jenga_ai.training.trainer import Trainer

config = ExperimentConfig.from_yaml("swahili_classifier.yaml")
model = MultiTaskModel.from_config(config)
data = DataProcessor(config).process()
trainer = Trainer(model=model, config=config, datasets=data)
results = trainer.train()
# That's it. Single model, single task, done.
```

Works for any task type:

```yaml
# Single-label classification (spam, hate speech, topic)
type: "single_label_classification"

# Multi-label classification (a message can be BOTH hateful AND threatening)
type: "multi_label_classification"

# Named Entity Recognition (extract people, places, organizations)
type: "ner"

# Sentiment analysis (positive, negative, neutral with probabilities)
type: "sentiment"

# Regression (severity score, risk rating, confidence score)
type: "regression"
```

### Use Case 2: Multi-Task Attention Fusion Model

When you need one model to handle 3+ tasks simultaneously. Shared learning across tasks improves accuracy and cuts compute costs.

```yaml
# fusion_experiment.yaml
project_name: "kenya-security-fusion"

model:
  name: "jenga-ai/SwahiliBERT"
  freeze_layers: 8                     # freeze bottom layers, fine-tune top

fusion:
  type: "attention"                    # attention-based fusion with learned gating
  dropout: 0.1

tasks:
  - name: "threat_classification"
    type: "single_label_classification"
    num_labels: 4                      # normal, hate_speech, phishing, threat
    data_path: "data/threats.jsonl"

  - name: "entity_extraction"
    type: "ner"
    num_labels: 9                      # B-PER, I-PER, B-ORG, I-ORG, B-LOC, ...
    data_path: "data/entities.jsonl"

  - name: "sentiment"
    type: "sentiment"
    num_labels: 3
    data_path: "data/sentiment.csv"

  - name: "urgency_score"
    type: "regression"
    num_labels: 1                      # continuous 0-1 urgency score
    data_path: "data/urgency.jsonl"

training:
  epochs: 10
  batch_size: 16
  learning_rate: 2e-5
  use_amp: true
  max_grad_norm: 1.0
  gradient_accumulation_steps: 2
  task_sampling: "proportional"        # sample tasks proportional to dataset size
```

One model, four tasks, shared encoder, attention fusion with a learnable gate that balances shared knowledge against task-specific signal.

### Use Case 3: Model Compression & Quantization

Train a full model, then compress it for deployment on limited hardware or edge devices.

```yaml
# Start with a large model for best accuracy
model:
  name: "jenga-ai/SwahiliBERT"

# Or start small for speed
model:
  name: "jenga-ai/SwahiliDistilBERT"   # already 40% smaller than SwahiliBERT
```

```python
# After training, compress with LoRA for efficient fine-tuning
from jenga_ai.llm.config import LLMConfig

llm_config = LLMConfig(
    model_name="jenga-ai/SwahiliBERT",
    use_lora=True,
    lora_rank=16,                      # low-rank adaptation (tiny fraction of params)
    lora_alpha=32,
    quantization="4bit",               # 4-bit quantization → ~75% memory reduction
)
# Trainable params drop from 110M to ~2M with LoRA
# Model size drops from 440MB to ~110MB with 4-bit quantization
```

**Compression options:**

| Method | What It Does | Size Reduction |
|--------|-------------|---------------|
| **LoRA** | Only trains small adapter layers, freezes base model | ~95% fewer trainable params |
| **4-bit quantization** | Reduces weight precision from float32 to int4 | ~75% smaller model |
| **8-bit quantization** | Reduces weight precision from float32 to int8 | ~50% smaller model |
| **DistilBERT base** | Use SwahiliDistilBERT instead of SwahiliBERT | ~40% smaller, 60% faster |
| **Pruning** (planned) | Remove unimportant weights | ~30-50% smaller |
| **ONNX export** (planned) | Optimized inference runtime | 2-4x faster inference |

### Use Case 4: Whisper Speech-to-Text

Transcribe Swahili audio, then pipe the text into any NLP task.

```yaml
# whisper_transcription.yaml
project_name: "swahili-transcription"

model:
  name: "openai/whisper-small"         # or whisper-medium, whisper-large-v3

tasks:
  - name: "swahili_asr"
    type: "speech_to_text"
    data_path: "data/swahili_audio/"
    language: "sw"
```

### Use Case 5: Security-Hardened Models

For government and critical infrastructure, add adversarial robustness, explainability, and audit trails to any of the above.

```python
from jenga_ai.security.adversarial import AdversarialTrainer, AdversarialConfig

# Harden any trained model against adversarial attacks
adv_config = AdversarialConfig(epsilon=0.01, attack_type="pgd", num_steps=5)
adv_trainer = AdversarialTrainer(model=model, config=config, datasets=data,
                                  adversarial_config=adv_config)
results = adv_trainer.train()

# Explain any prediction in plain language
from jenga_ai.security.explainability import ExplainabilityEngine
engine = ExplainabilityEngine(model=model, tokenizer=tokenizer)
report = engine.generate_report(
    engine.explain_prediction("Mkutano wa siri na kampuni ya nje",
                               task_name="threat_classification", method="attention")
)

# Tamper-evident audit trail
from jenga_ai.security.audit import AuditLogger, AuditAction
audit = AuditLogger(log_path="audit/model.audit")
audit.log(action=AuditAction.INFERENCE_RUN, user_id="analyst_001",
          details={"prediction": "threat", "confidence": 0.87})

# Auto-route low-confidence predictions to human reviewers
from jenga_ai.security.hitl import HITLRouter, UncertaintyEstimator
router = HITLRouter(confidence_threshold=0.7,
                    critical_labels=["terrorism", "corruption"])
decision = router.route("corruption", [0.05, 0.45, 0.50],
                        UncertaintyEstimator(method="entropy"))
# → HUMAN_REVIEW, priority=CRITICAL
```

---

## Quick Start (Non-Technical Users)

The web platform requires no coding. Whether you want a simple classifier or a multi-task fusion model, the workflow is the same:

1. **Upload** your CSV, JSON, or JSONL file (drag-and-drop)
2. **Pick a model** — choose from our pre-trained Swahili models or other options
3. **Choose a task** — single classification, multi-label, NER, sentiment, or combine multiple tasks with fusion
4. **Or start from a template:**
   - Hate Speech Detection (Swahili/English)
   - Phishing Email Detection
   - Network Threat Classification
   - M-Pesa Fraud Detection
5. **Train** — click the button, watch live charts as your model learns
6. **Compress** (optional) — quantize to 4-bit or 8-bit for faster, smaller models
7. **Deploy** — test predictions instantly, download the model, or get an API endpoint

---

## Architecture

**Single-task mode** (no fusion — just a model + one task head):
```
Input Text → [SwahiliBERT Encoder] → [Task Head] → Prediction
                                        │
                              classification / NER /
                              sentiment / regression
```

**Multi-task fusion mode** (shared encoder + attention fusion + multiple heads):
```
Input Text
    │
    ▼
┌──────────────────────────┐
│  Shared Transformer       │  ← SwahiliBERT, AfroXLMR, any HuggingFace model
│  Encoder                  │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Attention Fusion         │  ← residual + dropout + learnable gate
└────────────┬─────────────┘
             │
   ┌─────────┼─────────┐
   ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐
│Class. │ │ NER   │ │Sent.  │    ← task-specific heads
└───────┘ └───────┘ └───────┘
```

**With compression:**
```
Trained Model → [LoRA adapter] → [4-bit Quantization] → Compact Model (edge-ready)
  440 MB           ~10 MB              ~110 MB              ~10-110 MB
```

### Package Structure

```
jenga_ai/
├── core/           Config (Pydantic ), Model, Fusion
├── tasks/          Classification, NER, Sentiment, Regression, Registry
├── data/           DataProcessor (JSON/JSONL/CSV), Collators
├── training/       Trainer (AMP, checkpoints, callbacks), Metrics
├── security/       Adversarial, Explainability, Audit, HITL
├── models/         GNN, LSTM/GRU, Hybrid architectures
├── llm/            LLM fine-tuning with LoRA (planned)
├── inference/      Prediction pipeline (planned)
├── export/         Model export + notebook generation (planned)
└── utils/          Logging, Device management
```

---

## Key Features

### Training
- **Mixed-precision (AMP)** for faster GPU training
- **Gradient clipping** and **accumulation** for stable training on limited hardware
- **Checkpoint saving** with configurable intervals and best-model tracking
- **Early stopping** with configurable patience and metric
- **Task sampling** strategies: round-robin, proportional, temperature-scaled
- **Callback system** for custom training hooks

### Security & Trust
- **Adversarial training** — FGSM and PGD attacks on embeddings harden models against evasion
- **Explainability** — attention, gradient, and occlusion methods produce human-readable prediction reports
- **Audit trail** — hash-chained, append-only, tamper-evident logging (SHA-256, algorithm-agile)
- **Human-in-the-Loop** — uncertainty estimation (entropy/margin) routes low-confidence predictions to human reviewers with priority queuing

### Advanced Architectures (Planned)
- **Graph Neural Networks** — GCN, GAT, GraphSAGE, GIN for fraud/corruption network analysis
- **LSTM/GRU** — sequential threat detection for network intrusion, transaction anomalies, insider behavior
- **Hybrid models** — transformer + GNN, transformer + LSTM, multi-modal, ensemble voting

### Data
- Auto-detects JSON, JSONL, CSV formats
- Configurable text/label column names
- Configurable train/test split ratio and seed
- Per-task data processing (no hardcoded assumptions)
- Class-based collators (no Python closure bugs)

### Configuration
- **Pydantic** with full validation — bad configs fail immediately with clear messages
- YAML-driven experiments — define everything in one file
- Dynamic hidden_size — auto-detected from any HuggingFace encoder
- `to_dict()`, `to_yaml()`, `from_yaml()` serialization

---


## Project Documents

| Document | Description |
|----------|-------------|
| [PLAN.md](docs/plan.md) | Full 24-step build plan |
| [OVERVIEW.md](docs/overview.md) | Technical overview for developers and non-technical users |
| [ABSTRACT.md](docs/abstract.md) | Project abstract and use cases |
| [TECHNICAL_ROADMAP.md](docs/technical-roadmap.md) | 12-week MVP development roadmap |
| [IMPLEMENTATION_PLAN.md](docs/implementation-plan.md) | Detailed implementation specifications |
| [CONTRIBUTING.md](docs/contributing.md) | Contribution guidelines |

---

## Roadmap

### Current (Core)
- [x] Pydantic configuration system
- [x] Multi-task model with dynamic hidden_size
- [x] Attention fusion with residual + gating
- [x] 5 task types (classification, NER, sentiment, regression, multi-label)
- [x] Trainer with AMP, checkpoints, callbacks
- [x] Adversarial training, explainability, audit, HITL
- [ ] LLM fine-tuning module (LoRA, quantization)
- [ ] Inference pipeline and model export
- [ ] Test suite (target 90%+ coverage)

### Next (Backend + Frontend)
- [ ] FastAPI backend with auth, training API, WebSocket
- [ ] React + TypeScript + TailwindCSS web platform
- [ ] Security templates (hate speech, phishing, network threats)
- [ ] Compute marketplace (platform, RunPod, Colab, Kaggle, download)

### Future
- [ ] GNN implementations for fraud/corruption networks
- [ ] LSTM/GRU for sequential threat detection
- [ ] Hybrid architectures (transformer + GNN/LSTM)
- [ ] Docker + Kubernetes deployment
- [ ] Agentic workflows (chained task execution)

---

## Contributing

Jenga-AI is open-source and welcomes contributions. See [CONTRIBUTING.md](docs/contributing.md) for guidelines.

Ways to contribute:
- Add new task types via the registry
- Implement GNN/LSTM/hybrid models
- Build security templates for Kenyan use cases
- Improve documentation and examples
- Report bugs and suggest features

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

*Built for Kenya. Built for Africa. Built for everyone.*
