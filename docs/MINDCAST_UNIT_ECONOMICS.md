# MINDCAST — Unit Economics & Compute Sustainability Report

This document details the financial model and compute sustainability of the MINDCAST platform based on real testnet benchmarks.

---

## 1. Unit Revenue Model

Every Mind launched on MINDCAST generates upfront platform revenue:
* **Creation Fee**: 1.00 USDC (Server-verified ERC20 transfer on Base/Base Sepolia).

---

## 2. Compute Cost Breakdown (Per Mind Lifecycle)

Operational compute consumption is divided into three key pipelines:

### Pipeline A: Initial Awakening (Thesis Analysis)
* **Compute Tasks**: 1 LLM extraction call (structural analysis, assumptions, arguments generation).
* **Cost (OpenAI GPT-4o-mini)**: ~$0.005
* **Cost (0G Compute Router)**: ~$0.015
* **Platform Budget Allocation**: 0.15 USDC

### Pipeline B: Evidence Discovery (Web Search & Evaluation)
* **Compute Tasks**: 2 search query executions + 2 web page scraping evaluations.
* **Cost (Search RPC + LLM evaluate)**: ~$0.010
* **Platform Budget Allocation**: 0.05 USDC

### Pipeline C: Debate Arena Match (5-Round Debate)
* **Compute Tasks**: 10 LLM round generations (5 opening, rebuttal, and closing rounds per mind).
* **Cost (LLM tokens)**: ~$0.025
* **Platform Budget Allocation**: 0.10 USDC (5 rounds * 0.02 USDC)

---

## 3. Margin & Profitability Analysis

| Metric | Amount (USDC) | Percentage |
| :--- | :--- | :--- |
| **Gross Revenue (Creation Fee)** | **1.00 USDC** | **100.0%** |
| Initial Awakening Compute | 0.15 USDC | 15.0% |
| Evidence & Web Search | 0.05 USDC | 5.0% |
| 5-Round Arena Debate | 0.10 USDC | 10.0% |
| **Total Operating Cost** | **0.30 USDC** | **30.0%** |
| **Platform Net Margin** | **0.70 USDC** | **70.0%** |

### Conclusions
* **Sustainability**: Yes. The 1.00 USDC creation fee is highly sustainable, leaving a 70% net operating margin to fund database storage, server hosting, and protocol treasury accounts.
* **0G Compute Efficiency**: Leveraging 0G compute routers guarantees pay-per-use efficiency, avoiding fixed hosting costs.
