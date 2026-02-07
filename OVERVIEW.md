# Jenga-AI V2: Technical Overview

This document describes the Jenga-AI framework architecture, how developers use it programmatically, and how non-technical users interact with it through the zero-code web platform.

---

## 1. What Jenga-AI Does

Jenga-AI is an NLP framework purpose-built for Kenya's security and governance landscape. It supports everything from training a simple text classifier using a pre-trained Swahili model to building complex multi-task fusion models that share knowledge across tasks.

**You decide what you need:**

| What You Want | What You Do |
|---------------|-------------|
| A simple Swahili hate speech classifier | Pick SwahiliBERT, define 1 task, train |
| A multi-label spam + phishing detector | Pick SwahiliDistilBERT, define 1 multi-label task, train |
| An NER model to extract names from reports | Pick any encoder, define 1 NER task, train |
| A fusion model doing 3+ tasks at once | Pick an encoder, define 3+ tasks, enable attention fusion |
| A compressed model for edge deployment | Train any model above, then quantize to 4-bit and add LoRA |
| Swahili speech-to-text | Use Whisper, define speech_to_text task |
| All of the above with no code | Use the web platform |

The framework operates at two levels:
- **Core Python framework** for developers who want programmatic control
- **Web platform** (coming) for non-technical users who need zero-code model building

### Pre-trained Models

Jenga-AI ships with open-sourced African language models:

| Model | Best For | Size |
|-------|----------|------|
| **SwahiliDistilBERT** | Fast inference, edge deployment, lightweight tasks | ~66M params |
| **SwahiliBERT** | General Swahili NLP — classification, NER, sentiment | ~110M params |
| **SwahiliSpacyModel** | Tokenization, POS tagging, dependency parsing | — |
| **AfroXLMR** | Multilingual African language tasks | ~270M params |
| **Whisper** | Swahili speech-to-text transcription | 39M-1.5B params |

You can also use **any HuggingFace model** — just specify the model name in your config. The framework auto-detects the encoder's hidden size and adapts.

---

## 2. Architecture

### 2.1 Package Structure

```
jenga_ai/
├── core/                  # Foundation
│   ├── config.py          # Pydantic v2 configuration with validation
│   ├── model.py           # MultiTaskModel (shared encoder + task heads)
│   └── fusion.py          # Attention fusion with residual + gating
├── tasks/                 # Task definitions
│   ├── base.py            # BaseTask abstract class
│   ├── classification.py  # Single-label and multi-label classification
│   ├── ner.py             # Named Entity Recognition
│   ├── sentiment.py       # Sentiment analysis
│   ├── regression.py      # Regression (MSE/Huber loss)
│   └── registry.py        # Task type registry
├── data/                  # Data pipeline
│   ├── processor.py       # DataProcessor (JSON/JSONL/CSV)
│   └── collators.py       # Task-specific batch collators
├── training/              # Training loop
│   ├── trainer.py         # Trainer (AMP, grad clip, checkpoints)
│   ├── callbacks.py       # Logging, early stopping, checkpointing
│   └── metrics.py         # Per-task metric computation
├── security/              # Trust and safety
│   ├── adversarial.py     # FGSM/PGD adversarial training
│   ├── explainability.py  # Prediction explanations for analysts
│   ├── audit.py           # Hash-chained tamper-evident audit log
│   └── hitl.py            # Human-in-the-Loop routing
├── models/                # Advanced architectures (planned)
│   ├── graph/             # GNN (fraud/corruption networks)
│   ├── sequential/        # LSTM/GRU (intrusion/transaction sequences)
│   └── hybrid/            # Multi-modal combinations
├── llm/                   # LLM fine-tuning (planned)
├── inference/             # Prediction pipeline (planned)
├── export/                # Model export + notebook gen (planned)
└── utils/
    ├── logging.py         # Structured logging
    └── device.py          # Device management (CPU/CUDA/MPS)
```

### 2.2 How the Model Works

```
Input Text
    │
    ▼
┌─────────────────────────────┐
│   Shared Transformer Encoder │  ← e.g., bert-base-multilingual, AfroXLMR
│   (frozen or fine-tuned)     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│      Attention Fusion        │  ← Residual + dropout + learnable gate
│  (task-specific reweighting) │
└──────────────┬──────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Task 1 │ │ Task 2 │ │ Task 3 │
│ Head   │ │ Head   │ │ Head   │
│(class.)│ │ (NER)  │ │(sent.) │
└────────┘ └────────┘ └────────┘
    │          │          │
    ▼          ▼          ▼
 Threat     Entities   Sentiment
 Label      Spans      Score
```

The shared encoder learns general language understanding. The fusion layer adapts the shared representation for each specific task using attention with a learnable gate that balances shared knowledge against task-specific signal. Each task head then produces its own output.

---

## 3. For Developers: Using the Python Framework

### 3.1 Simple Single-Task Model (No Fusion)

The simplest use case — pick a pre-trained model, define one task, train. No fusion complexity.

```yaml
# hate_speech_classifier.yaml
project_name: "hate-speech-detector"

model:
  name: "jenga-ai/SwahiliBERT"        # our pre-trained Swahili model

fusion:
  type: "none"                          # no fusion for single task

tasks:
  - name: "hate_speech"
    type: "single_label_classification"
    num_labels: 3                       # hate, offensive, normal
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

config = ExperimentConfig.from_yaml("hate_speech_classifier.yaml")
model = MultiTaskModel.from_config(config)
data = DataProcessor(config).process()
trainer = Trainer(model=model, config=config, datasets=data)
results = trainer.train()
```

This works for any single task:

| Task Type | YAML `type` value | Example Use Case |
|-----------|-------------------|------------------|
| Single-label | `single_label_classification` | Spam detection, topic classification, hate speech |
| Multi-label | `multi_label_classification` | A message tagged as both "hate" and "threatening" |
| NER | `ner` | Extract person names, locations, organizations from reports |
| Sentiment | `sentiment` | Public opinion on policies (positive/negative/neutral) |
| Regression | `regression` | Risk scoring, severity rating, urgency estimation |

### 3.2 Multi-Task Attention Fusion Model

When you need one model handling 3+ tasks with shared learning:

```yaml
# fusion_experiment.yaml
project_name: "kenya-security-fusion"

model:
  name: "jenga-ai/SwahiliBERT"
  freeze_layers: 8

fusion:
  type: "attention"                     # attention fusion with learnable gate
  dropout: 0.1

tasks:
  - name: "threat_classification"
    type: "single_label_classification"
    num_labels: 4
    data_path: "data/threats.jsonl"
    text_column: "text"
    label_column: "label"

  - name: "entity_extraction"
    type: "ner"
    num_labels: 9
    data_path: "data/entities.jsonl"

  - name: "sentiment"
    type: "sentiment"
    num_labels: 3
    data_path: "data/sentiment.csv"

  - name: "urgency_score"
    type: "regression"
    num_labels: 1
    data_path: "data/urgency.jsonl"

training:
  epochs: 10
  batch_size: 16
  learning_rate: 2e-5
  use_amp: true
  max_grad_norm: 1.0
  gradient_accumulation_steps: 2
  task_sampling: "proportional"

data:
  split_ratio: 0.85
  seed: 42

checkpoint:
  save_every_n_epochs: 2
  save_best: true
  max_checkpoints: 3
```

Same Python code — the framework detects multiple tasks and activates fusion automatically:

```python
config = ExperimentConfig.from_yaml("fusion_experiment.yaml")
model = MultiTaskModel.from_config(config)
data = DataProcessor(config).process()
trainer = Trainer(model=model, config=config, datasets=data)
results = trainer.train()
# One model now handles all 4 tasks with shared encoder + attention fusion
```

### 3.3 Model Compression & Quantization

Shrink any trained model for deployment on limited hardware:

```python
from jenga_ai.llm.config import LLMConfig

# LoRA: train only ~2M params instead of 110M
llm_config = LLMConfig(
    model_name="jenga-ai/SwahiliBERT",
    use_lora=True,
    lora_rank=16,
    lora_alpha=32,
    quantization="4bit",                # 4-bit quantization → ~75% size reduction
)
```

| Method | Effect | When to Use |
|--------|--------|-------------|
| **SwahiliDistilBERT** | 40% smaller, 60% faster than SwahiliBERT | Default choice when speed matters |
| **LoRA** | ~95% fewer trainable params | Fine-tuning large models on limited GPU |
| **4-bit quantization** | ~75% smaller model files | Edge deployment, mobile, Raspberry Pi |
| **8-bit quantization** | ~50% smaller model files | Server deployment with memory constraints |
| **ONNX export** (planned) | 2-4x faster inference | Production serving at scale |

### 3.4 Whisper Speech-to-Text

Transcribe Swahili audio, then feed the text into any NLP task:

```yaml
model:
  name: "openai/whisper-small"          # or whisper-medium, whisper-large-v3

tasks:
  - name: "swahili_transcription"
    type: "speech_to_text"
    data_path: "data/swahili_audio/"
    language: "sw"
```

### 3.5 Add Adversarial Robustness

```python
from jenga_ai.security.adversarial import AdversarialTrainer, AdversarialConfig

adv_config = AdversarialConfig(
    epsilon=0.01,        # perturbation strength
    attack_type="pgd",   # PGD is stronger than FGSM
    num_steps=5,         # multi-step attack
    adversarial_weight=0.3
)

adv_trainer = AdversarialTrainer(
    model=model,
    config=config,
    datasets=datasets,
    adversarial_config=adv_config
)
results = adv_trainer.train()  # trains on both clean and adversarial examples
```

### 3.6 Explain Predictions

```python
from jenga_ai.security.explainability import ExplainabilityEngine

engine = ExplainabilityEngine(model=model, tokenizer=tokenizer)

explanation = engine.explain_prediction(
    text="Ruto amepanga mkutano wa siri na kampuni ya nje",
    task_name="threat_classification",
    method="attention"       # or "gradient" or "occlusion"
)

# Human-readable report for government analysts
report = engine.generate_report(explanation)
print(report)
# Output:
# Prediction: threat (confidence: 0.87)
# Key factors: "mkutano wa siri" (secret meeting), "kampuni ya nje" (foreign company)
# Method: attention-based importance scoring
```

### 3.7 Audit Trail

```python
from jenga_ai.security.audit import AuditLogger, AuditAction

audit = AuditLogger(log_path="audit/security_model.audit")

# Log a prediction event
audit.log(
    action=AuditAction.INFERENCE_RUN,
    user_id="analyst_001",
    details={"input_hash": "sha256:...", "prediction": "threat", "confidence": 0.87}
)

# Verify the entire chain has not been tampered with
is_valid = audit.verify_integrity()
```

### 3.8 Human-in-the-Loop

```python
from jenga_ai.security.hitl import HITLRouter, UncertaintyEstimator

estimator = UncertaintyEstimator(method="entropy")
router = HITLRouter(
    confidence_threshold=0.7,
    critical_labels=["terrorism", "corruption", "money_laundering"]
)

# Route a prediction
decision = router.route(
    prediction="corruption",
    probabilities=[0.05, 0.45, 0.50],
    estimator=estimator
)
# decision.action = "HUMAN_REVIEW"
# decision.priority = "CRITICAL"  (because label is in critical_labels)
# decision.reason = "Critical label detected"
```

### 3.9 Register Custom Tasks

```python
from jenga_ai.tasks.registry import TaskRegistry
from jenga_ai.tasks.base import BaseTask

class CodeSwitchingTask(BaseTask):
    """Detect Swahili/English code-switching patterns."""
    def __init__(self, hidden_size, num_labels, **kwargs):
        super().__init__(hidden_size, num_labels)
        # custom head architecture
        ...

TaskRegistry.register("code_switching", CodeSwitchingTask)
# Now usable in YAML configs with type: "code_switching"
```

---

## 4. For Non-Technical Users: The Zero-Code Web Platform

The web platform wraps the entire Python framework in a visual interface. No terminal, no code, no configuration files.

### 4.1 Getting Started

1. **Create an account** at the Jenga-AI platform
2. **Create a new project** — give it a name like "Social Media Monitor"

### 4.2 Pick a Model

Choose from our pre-trained models (or let the platform recommend one):

| Model | Speed | Accuracy | Best For |
|-------|-------|----------|----------|
| **SwahiliDistilBERT** | Fast | Good | Quick experiments, limited hardware, edge deployment |
| **SwahiliBERT** | Medium | Better | Most Swahili NLP tasks |
| **AfroXLMR** | Slower | Best | Multilingual tasks, highest accuracy |
| **Whisper** | Varies | — | Converting Swahili audio to text |

Not sure? The platform recommends a model based on your data size and task type.

### 4.3 Upload Your Data

Click "Upload Dataset" and drag-and-drop your file. The platform accepts:
- **CSV files** — spreadsheets with columns like "text" and "label"
- **JSON files** — structured data from APIs or exports
- **JSONL files** — one JSON object per line (common in NLP)

The platform automatically:
- Detects the file format
- Validates the structure (checks for required columns)
- Shows a preview of the first 100 rows
- Displays label distribution charts (so you can see if your data is balanced)

**No data wrangling needed.** If your CSV has a "message" column and a "category" column, you just tell the platform which column is the text and which is the label.

### 4.4 Choose a Task Type

Pick what you want the model to do:

| Task | What It Does | Example |
|------|-------------|---------|
| **Classification** | Categorize text into labels | "Is this message hate speech, spam, or normal?" |
| **Named Entity Recognition** | Find and tag names, places, organizations in text | "Extract all person names and locations from this report" |
| **Sentiment Analysis** | Determine if text is positive, negative, or neutral | "What is public sentiment about this policy?" |
| **Fraud Detection** | Flag suspicious patterns | "Is this M-Pesa transaction suspicious?" |
| **Multi-task** | Do several of the above at once | "Classify the threat AND extract entities AND score sentiment" |

### 4.5 Use a Security Template (Fastest Start)

Instead of configuring from scratch, start from a pre-built template:

- **Hate Speech Detection** — Pre-configured for Swahili/English social media. Upload your data (or use the sample dataset) and click Train. Detects hate speech, offensive language, and normal speech.
- **Phishing Email Detection** — Analyzes email headers and body text. Classifies emails as phishing or legitimate. Pre-trained on email structure patterns.
- **Network Threat Classification** — Classifies network traffic descriptions as DDoS, malware, intrusion, or normal. Includes NER for IP addresses and domain names.

Each template comes with sensible defaults. You can customize anything through sliders and toggles, or just click "Train" to start immediately.

### 4.6 Single Task or Multi-Task Fusion?

You decide the complexity:

- **Single task** — Just want a hate speech classifier? Pick SwahiliBERT, choose "Classification", upload your data, and train. One model, one job, done.
- **Multi-task fusion** — Want one model that classifies threats AND extracts entity names AND scores sentiment? Add multiple tasks in the wizard. The platform automatically enables attention fusion to share knowledge across tasks.

Most users start with a single task. You can always come back and add more tasks later.

### 4.7 Configure Training (Optional)

For users who want more control, an "Advanced Settings" panel offers:

- **Model selection** — Choose from a list of pre-trained models (with descriptions of what each is good at)
- **Training duration** — Slider for number of training rounds (more = potentially better, but slower)
- **Batch size** — How many examples the model sees at once
- **Learning rate** — How aggressively the model learns (smart defaults provided)

For most users, the defaults work well. The platform provides recommendations based on your dataset size and task type.

### 4.8 Train and Monitor

Click "Train" and watch your model learn in real-time:

- **Progress bar** showing which training round you are on
- **Loss chart** — a line going down means the model is learning
- **Accuracy chart** — a line going up means the model is getting better
- **Console log** — detailed training output for those who want to see it

You can close the browser and come back later. The platform sends an email when training finishes. Training runs in the background on the server.

### 4.9 Compress Your Model (Optional)

After training, make your model smaller and faster:

- **Quantize** — Toggle "4-bit" or "8-bit" quantization. Your 440MB model becomes ~110MB. Runs on cheaper hardware.
- **LoRA export** — Export just the small adapter layer (~10MB) instead of the full model. Anyone with the base SwahiliBERT model can load your adapter.
- **Use DistilBERT** — If you started with SwahiliBERT but need speed, retrain on SwahiliDistilBERT (40% smaller, 60% faster, minimal accuracy loss).

The platform shows you the trade-off: how much smaller the model gets vs. how much accuracy you might lose.

### 4.10 Test Your Model

Once training completes, test it immediately:

- **Single prediction** — Type or paste text into a box, get an instant prediction with a confidence score
- **Batch prediction** — Upload a CSV of texts, download a CSV with predictions added
- **For NER models** — Entities are highlighted directly in the text with color-coded tags

### 4.11 Deploy Your Model

Choose how to use your trained model in the real world:

| Option | Who It's For | What Happens |
|--------|-------------|-------------|
| **Platform API** | Teams building apps | Get an API endpoint you can call from any programming language |
| **Download** | IT teams with their own servers | Download a zip with the model, config, and a ready-to-run script |
| **Google Colab** | Students and researchers | Get a pre-built notebook that runs free on Google's GPUs |
| **Kaggle** | Data science community | Export to Kaggle's free GPU environment |
| **RunPod** | Teams needing serious GPU power | Connect your RunPod account for cloud GPU training |

### 4.12 Understand Your Model's Decisions

For government and security use cases, trust is critical. The platform provides:

- **Explanation reports** — For any prediction, see which words or phrases most influenced the decision, written in plain language
- **Audit log** — Every action (who trained what, when, on what data, what predictions were made) is recorded in a tamper-evident log that can be exported for regulatory review
- **Human review queue** — When the model is not confident enough, predictions are flagged for human review instead of being acted on automatically

---

## 5. Key Design Principles

**Dynamic, not hardcoded.** The model automatically detects the encoder's hidden size, supports any HuggingFace transformer, and adapts to the data format provided.

**Validated, not assumed.** Every configuration is validated through Pydantic v2 before any training begins. Invalid settings produce clear error messages, not cryptic runtime crashes.

**Auditable, not opaque.** Hash-chained logs, explainable predictions, and human-in-the-loop routing ensure that AI decisions in high-stakes security contexts can always be traced, understood, and challenged.

**Extensible, not locked.** The task registry pattern lets developers add new task types without modifying core code. New model architectures (GNN, LSTM, hybrid) plug into the same training and evaluation pipeline.

**Accessible, not exclusive.** The same framework that a machine learning engineer uses through Python is available to a government analyst through a visual web interface with zero coding required.
