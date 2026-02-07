"""Graph Neural Networks for Jenga-AI.

GNNs model relationships between entities - critical for:

1. CORRUPTION DETECTION:
   - Model procurement networks (who buys from whom, at what price)
   - Detect collusion rings (clusters of suspicious bidding patterns)
   - Identify shell companies (graph analysis of ownership structures)

2. M-PESA FRAUD DETECTION:
   - Transaction graphs (sender → receiver → amount → time)
   - Detect money laundering circuits (circular transaction patterns)
   - Identify mule accounts (nodes with unusual in/out degree)

3. SOCIAL NETWORK ANALYSIS:
   - Detect coordinated inauthentic behavior (bot networks)
   - Map hate speech propagation networks
   - Identify influence operations targeting Kenyan discourse

4. CYBER THREAT NETWORKS:
   - Map attack infrastructure (C2 servers, domains, IPs)
   - Detect lateral movement in network intrusions
   - Correlate threat actors across campaigns

Architecture (planned):
    Node Features → GNN Encoder → Graph-level or Node-level prediction

    Supported GNN types:
    - GCN (Graph Convolutional Network) - simple, effective
    - GAT (Graph Attention Network) - attention-based, interpretable
    - GraphSAGE - scalable to large graphs
    - GIN (Graph Isomorphism Network) - most expressive

Requires: torch-geometric (PyG)
"""
