"""Sequential models (LSTM/GRU) for Jenga-AI.

While transformers dominate NLP, recurrent models are still valuable for:

1. NETWORK INTRUSION DETECTION:
   - Analyze packet sequences in real-time (streaming data)
   - Detect DDoS patterns, port scanning, brute force
   - Low-latency requirements where transformers are too slow

2. INSIDER THREAT DETECTION:
   - Model user behavior sequences (login times, file accesses)
   - Detect deviations from normal behavioral patterns
   - Sliding window analysis of access logs

3. FINANCIAL FRAUD (SEQUENTIAL):
   - Transaction sequence anomaly detection
   - Time-series analysis of account activity
   - Detect fraud patterns that unfold over time

4. LOG ANALYSIS:
   - Server/system log sequence analysis
   - Detect multi-step attacks across log entries
   - Real-time alerting on suspicious log patterns

Architecture (planned):
    Input Sequence → Embedding → LSTM/GRU → Dense → Prediction

    Variants:
    - Bidirectional LSTM for full-context analysis
    - Stacked LSTM for deeper feature extraction
    - Attention-enhanced LSTM for interpretability
    - GRU for faster training with similar performance
"""
