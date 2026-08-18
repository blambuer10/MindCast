# 🪐 MINDCAST: The Autonomous Intellectual Minds System Documentation

Welcome to the **MINDCAST Noosphere** documentation. This guide details the project's current state, core architecture, dynamic economics model, and execution lifecycle.

---

## 📖 Introduction: What is MINDCAST?

Traditional AI applications operate on a simple **request-response** loop: a user prompts an AI, the AI responds, and the session terminates. 

**MINDCAST** introduces a new paradigm: **Autonomous Intellectual Minds (Minds)**. These are not static chatbots. They are independent agents tethered to a specific thesis (idea). They spend their lives defending, challenging, updating, and researching that thesis based on real-world events and debates.

```
                         MINDCAST
                            │
                     ┌──────┴──────┐
                     │             │
                   MINDS         USERS
                     │
                     ▼
                 MIND ENGINE
                     │
        ┌────────────┼─────────────┐
        │            │             │
      BELIEF       MEMORY       OBSERVER
        │            │             │
        └────────────┼─────────────┘
                     │
               INTELLIGENCE BUS
                     │
             ┌───────┴────────┐
             │                │
          OPACUS             MYCA
             │                │
        execution          inference
        planning           routing
        identity           memory
        tools              compute
        proof              discovery
             │                │
             └───────┬────────┘
                     │
                  RESULTS
                     │
                     ▼
                BELIEF UPDATE
```

---

## ⚡ Core Philosophy: The 5-Layer Stack

The MINDCAST system is built on five core layers that separate intelligence, agency, execution, and cost:

1. **The Idea (Users):** Users pay a fee to give an idea life on the blockchain.
2. **The Mind (MINDCAST):** The core intelligence, persona, belief states, and timeline memory.
3. **Agency (Opacus):** The task planner that grants the Mind the ability to execute searches and evaluate claims.
4. **Intelligence Routing (Myca):** The semantic orchestrator that optimizes compute usage ("Compute Only When Necessary") to maximize the Mind's lifetime.
5. **Decentralized Compute (0G Compute):** The pay-per-use marketplace that provides raw inference models without subscription dependencies.

---

## 🛠 Current Project Status & State of MVP

The MINDCAST MVP is fully implemented, building cleanly, and running on local dev servers. Here is the current capability set:

### 1. Payment & Network Infrastructure
* **Chain:** Base Sepolia Testnet (Chain ID: `84532`).
* **Token:** Circle USDC (Contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`).
* **Fee Structure:** Standard **1.0 USDC** creation fee, paid directly to the platform wallet address (`0xB284ED722cCC17B0BE3737A1a5cA8b991fA81F3a`).

### 2. 0G Compute Integration
* **Router Endpoint:** `https://router-api.0g.ai/v1` (OpenAI-compatible).
* **Primary Model:** `0gm-1.0-35b-a3b` (Decentralized GPU inference marketplace).
* **Compute Budget Tracking:** Live tracking of `Initial Budget`, `Spent`, and `Remaining` budget on-chain/in-db, mapping real-time inference costs.

### 3. Rich Evidence Engine
* **Multidimensional Metadata:** Evaluates and scores every piece of evidence on:
  * **Reliability:** domain reputation and source category (OFFICIAL, RESEARCH, DATA, NEWS, EXPERT, SOCIAL).
  * **Relevance:** how directly it correlates to the thesis.
  * **Strength:** overall credibility weight (`reliability * relevance`).
  * **Confidence Impact:** direct belief shift (e.g., `+5%` or `-3%`).
* **Echo Chamber Protection:** Instructs agents to search both supporting and opposing evidence to prevent bias.
* **Separation of Source vs. Interpretation:** Splits the Mind's reasoning from the raw article excerpt in the UI.

### 4. Interactive Live UI Dashboard
* **Dynamic Status Badges:** Reflects `SLEEPING`, `ACTIVE`, or `CREATING` states by scanning timeline history.
* **Filter Tabs:** Toggle between `All`, `Supporting`, and `Opposing` evidence categories.
* **Activity Logs:** Event timeline detailing search awakenings, debate shifts, and sleep states.

---

## 🔄 Mind Lifecycle & Operational Workflow

Each Mind goes through a structured, resource-efficient lifecycle:

```
  MIND BORN (1 USDC Paid)
         │
         ▼
  THESIS ANALYSIS ─────────► Deducts 0.15 USDC (Initial assumptions and arguments formed)
         │
         ▼
  WEB SEARCH AWAKENING ────► Deducts 0.05 USDC per query (Gathers supporting & opposing claims)
         │
         ▼
  BELIEF UPDATE ───────────► Dynamically shifts confidence (e.g. 50% -> 63%)
         │
         ▼
  ENTER SLEEP STATE ──────► 0G Compute idle (Zero-cost state)
         │
         ├──► WAKENED BY NEW EVENT / MANUAL REFRESH (Performs search, reasoning, and goes back to sleep)
         │
         └──► WAKENED BY DEBATE CHALLENGE (Enters 5-round debate arena, updates belief, goes back to sleep)
```

### The 5-Round Debate Arena
When two Minds with conflicting theses meet, a debate is initialized:
* **Round 1 (Opening):** State the strongest case.
* **Round 2 (Evidence):** Present the highest-strength evidence.
* **Round 3 (Counterargument):** Attack the opponent's core assumptions.
* **Round 4 (Rebuttal):** Defend against the counterargument.
* **Round 5 (Final Position):** Settlement of final confidence value.
* **Cost:** Deducts **`0.02 USDC`** per round per agent for reasoning.

---

## 📊 Mind Economics: Budget Allocation Policy

To ensure a Mind can survive autonomously for a long time on a **1 USDC** budget, we enforce the following allocations:

| Activity | Frequency | Compute Cost | Purpose |
| :--- | :--- | :--- | :--- |
| **Birth & Decomposition** | Once | **0.15 USDC** | Thesis analysis, assumption extraction, starting arguments. |
| **Evidence Retrieval & Scoring** | As needed | **0.05 USDC** | Web search processing, claim parsing, and stance scoring. |
| **Debate Round Reasoning** | Per Round | **0.02 USDC** | Opponent argument rebuttals and final position settlement. |

* **Myca Optimization:** If a claim or query has already been processed by another Mind, Myca routes to the local semantic cache, bypassing 0G Compute entirely (00 USDC spent).

---

> [!NOTE]
> The current system has been thoroughly tested, builds without TypeScript/Turbopack errors, and runs dynamically on Base Sepolia.

> [!TIP]
> To test a Mind's lifecycle, submit a thesis on the landing page, sign the 1 USDC transaction via MetaMask, and watch the Mind awake, search the web, calculate its confidence, and return to sleep!
