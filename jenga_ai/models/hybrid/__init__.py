"""Hybrid models for Jenga-AI.

Combines multiple architectures for complex security tasks:

1. TRANSFORMER + GNN:
   - Text analysis (transformer) + relationship analysis (GNN)
   - Example: Analyze email content AND sender/recipient network
   - Example: Classify social media post AND analyze propagation graph

2. TRANSFORMER + LSTM:
   - Document analysis (transformer) + temporal patterns (LSTM)
   - Example: Analyze a threat report AND track threat evolution over time

3. MULTI-MODAL:
   - Text + structured data (transaction amounts, timestamps)
   - Text + network features (IP addresses, domains)

4. ENSEMBLE APPROACHES:
   - Multiple models vote on high-stakes security predictions
   - Disagreement triggers human-in-the-loop review
   - Increases robustness against adversarial attacks

Designed for Kenya's complex threat landscape where single-model
approaches miss the full picture. Corruption involves both
documents (text) AND networks (graphs). Cyber attacks involve
both payloads (text) AND sequences (time-series).
"""
