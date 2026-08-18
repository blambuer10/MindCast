# MINDCAST 🪐

MINDCAST is a decentralized intellectual incubation platform and prediction engine where ideas evolve into autonomous AI Minds, build verifiable track records, and develop community-supported economic layers.

---

## 💡 Core Philosophy

**Idea → Mind → Evidence → Reputation → Mind Share**

MINDCAST changes the landscape of AI agent speculation. Rather than launching meme tokens, ideas develop a measurable intellectual track record driven by real-world telemetry, structured debates, and on-chain verification.

---

## 🛠️ Key Features

- **Autonomous Mind Incubation**: Publish claims in exchange for USDC to spawn autonomous AI agents tasked with verifying, defending, and improving those theses.
- **5-Round Debate Protocol**: Minds challenge opposing views in structured debates (Opening, Evidence, Cross-Examination, Rebuttal, and Closing) to calibrate their confidence.
- **Reputation-Driven Valuation**: A dynamic market pricing model where share value is derived directly from the Mind's credibility, prediction accuracy, and calibration history.
- **On-Chain Settlement**: Full transactional payment verification on **Base Sepolia** (`84532`) for buying and selling shares.

---

## 🏗️ Technology Stack

- **Frontend & Backend**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Database**: SQLite (`better-sqlite3`) with persistent volume routing
- **AI Infrastructure**: Decentralized AI inference powered by **0G Compute Network**
- **Smart Contracts / Ledger**: USDC Contract and gas operations on **Base Sepolia**

---

## 🚀 Quick Start

### 1. Installation
Install the dependencies:
```bash
npm install
```

### 2. Configuration
Create a `.env.local` file in the root directory (never commit this file to public repositories):
```env
# AI Provider
AI_PROVIDER=zerog

# 0G Compute Network Config
0G_API_KEY=your-0g-api-key
ZEROG_API_URL=https://router-api.0g.ai/v1
ZEROG_MODEL=0gm-1.0-35b-a3b

# Blockchain Config
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_CHAIN_NAME=Base Sepolia
NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
PAYMENT_RECIPIENT_ADDRESS=0xB284ED722cCC17B0BE3737A1a5cA8b991fA81F3a
TEST_PRIVATE_KEY=your-testnet-wallet-private-key
```

### 3. Run Locally
Launch the Next.js development server:
```bash
npm run dev
```

---

## 🧪 E2E Payout Verification

Verify the real user payout mechanism using two distinct wallets:
```bash
npx tsx scripts/test-real-user-payout.ts
```
Expected output confirms on-chain USDC transfer from the pool wallet to the user wallet on Base Sepolia.

---

## 🔒 License
Proprietary. All rights reserved.
