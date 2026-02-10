# Jenga-AI: A Unified Multi-Task NLP Framework for National Security and Governance in Kenya

**Challenge Tracks:** Threat Detection & Prevention | Cyber Intelligence | Governance & Public Policy

---

## Problem Statement

Kenya's digital ecosystem faces escalating threats that existing AI tools cannot adequately address. Misinformation spreads in Swahili and Sheng. Corruption networks operate through layers of shell companies and procurement fraud. M-Pesa transactions worth billions flow through channels vulnerable to money laundering. Government agencies face phishing campaigns while insider threats go undetected in system logs.

The problem is twofold. First, Western-trained AI models miss the linguistic nuances, cultural context, and code-switching patterns that define Kenyan communication. Second, building AI solutions today requires deep technical expertise, expensive GPU infrastructure, and months of development. A single threat often spans multiple dimensions — a suspicious message may contain hate speech (classification), mention specific actors and locations (entity recognition), and carry a sentiment that signals intent (sentiment analysis). Deploying separate models for each task is prohibitively expensive and operationally impractical for most Kenyan organizations.

---

## Our Solution

Jenga-AI is an open-source NLP platform that makes AI-powered security and governance analysis accessible at two levels.

### For Developers: A Python Framework

Jenga-AI ships with pre-trained African language models — SwahiliDistilBERT, SwahiliBERT, SwahiliSpacyModel — and supports any model from HuggingFace. A developer can train a simple single-task classifier in 5 lines, or build a complex multi-task fusion model handling 3+ tasks with shared learning. Both paths use the same clean API.

**Simple single-task model** (no fusion needed):
```python
config = ExperimentConfig.from_yaml("swahili_classifier.yaml")  # 1 model, 1 task
model = MultiTaskModel.from_config(config)
trainer = Trainer(model=model, config=config, datasets=data)
results = trainer.train()  # done — hate speech classifier using SwahiliBERT
```

**Multi-task fusion model** (3+ tasks, shared encoder):
```python
config = ExperimentConfig.from_yaml("fusion_experiment.yaml")  # 1 model, 4 tasks
model = MultiTaskModel.from_config(config)  # attention fusion auto-enabled
trainer = Trainer(model=model, config=config, datasets=data)
results = trainer.train()  # classifies + extracts entities + scores sentiment + rates urgency
```

What makes the framework different:

- **Multi-task efficiency** — One model concurrently classifies threats, extracts entities, scores sentiment, and detects fraud patterns. Shared learning across tasks improves accuracy while cutting compute costs.
- **Multiple model architectures** — Transformer encoders for text analysis, Graph Neural Networks for mapping corruption and fraud networks (procurement rings, M-Pesa laundering circuits, bot networks), and LSTM/GRU models for sequential threat detection (network intrusion, insider behavior, transaction anomalies). Hybrid architectures combine these for complex multi-signal threats.
- **Adversarial robustness** — Built-in FGSM and PGD adversarial training hardens models against AI-enhanced attacks that attempt to evade detection.
- **Explainability** — Every prediction comes with human-readable explanations (attention-based, gradient-based, or occlusion-based) so government analysts understand why the model flagged something.
- **Tamper-evident audit trail** — Hash-chained logging records every prediction, training run, and data access. The chain is cryptographically verifiable and algorithm-agile for post-quantum readiness.
- **Human-in-the-Loop** — Low-confidence predictions are automatically routed to human reviewers with priority-based queuing. High-stakes labels (terrorism, corruption) always trigger human review regardless of model confidence.
- **Model compression** — LoRA adapters (95% fewer trainable parameters), 4-bit/8-bit quantization (75% smaller models), and DistilBERT variants for edge deployment on limited hardware.

### For Non-Technical Users: A Zero-Code Web Platform

The same framework powers a web platform where anyone can build, train, and deploy custom AI models without writing a single line of code.

1. **Pick a model** — Choose from pre-trained Swahili models (SwahiliBERT, SwahiliDistilBERT) or let the platform recommend one.
2. **Upload your data** — Drag and drop a CSV, JSON, or JSONL file. The platform auto-detects the format, validates the structure, and shows a preview with label distribution charts.
3. **Choose a task** — Pick a single task (classification, NER, sentiment) or combine multiple tasks with fusion. Or start from a pre-built security template (hate speech, phishing, network threats).
4. **Configure and train** — Adjust settings through simple sliders and toggles, or accept smart defaults. Click "Train" and watch real-time progress with live loss curves, accuracy charts, and a streaming console log.
5. **Compress** (optional) — Quantize to 4-bit or 8-bit for smaller, faster models suitable for deployment on limited hardware.
6. **Deploy instantly** — Test predictions by typing text directly into the interface. Deploy as a REST API with auto-generated documentation, download the model for on-premise use, or export to Google Colab or Kaggle for free GPU training.

Pre-built security templates let government analysts start with one click. The hate speech template comes pre-configured for Swahili/English detection. The phishing template analyzes email headers and bodies. The network threat template classifies traffic patterns.

---

## Why This Matters for Kenya

**For national security:** A single Jenga-AI model can monitor social media for hate speech in Swahili, extract the names and locations mentioned, analyze sentiment for escalation risk, and map the propagation network to identify coordinated campaigns. All from one model, running on affordable hardware.

**For financial integrity:** Graph Neural Networks map M-Pesa transaction networks to detect money laundering circuits and mule accounts. Sequential models catch fraud patterns that unfold across transaction sequences. The audit trail ensures every flag can be traced and justified.

**For governance:** Government agencies get AI tools they can trust because every prediction is explainable, every action is audited, and humans stay in the loop for critical decisions. Data sovereignty is preserved through on-premise deployment options.

**For accessibility:** The zero-code platform means NGOs protecting children from online abuse, agricultural extension officers classifying crop disease reports, and university researchers studying public discourse can all build custom AI models without waiting for a data scientist.

Jenga-AI is not just a model. It is an ecosystem for democratizing AI-driven security and governance across Kenya, built by Kenyans, for Kenyan problems, in Kenyan languages.
