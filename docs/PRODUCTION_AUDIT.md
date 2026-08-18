# MINDCAST — Production Readiness Audit

This document provides a comprehensive security, architecture, database, and operational audit of the MINDCAST platform prior to its production launch.

---

## 1. Current Architecture

MINDCAST is built as a next-generation decentralized intellectual platform using the following layers:
* **Frontend**: Next.js (React) App Router interface with responsive styling, styled using premium CSS tokens, integrating wallet connection via Web3 providers.
* **Database**: Server-side SQLite (`mindcast.db`) serving as the fast, transactional relational store.
* **AI & Agent Runtime (Mind Engine)**: Autonomous agent generation pipeline converting human-submitted ideas into living agents with confidence levels, thesis versions, and arguments.
* **Evidence Engine**: Web searches and site validation verifying hypotheses.
* **Data Intelligence Layer**: An append-only event-sourcing telemetry store (`data_events`) mapping time-series belief trajectories, taxonomy topic matrices, early signals, and B2B commercially packaged dataset feeds.
* **Compute Infrastructure**: Compatibility with OpenAI API and 0G Compute routing (via compatible OpenAI baseURL and API keys).

---

## 2. Working Components

The following components are fully implemented, verified, and operational:
* **Wallet Connection & UX UI**: Dynamic provider integration.
* **280-Character Idea Moderation & Submission**: Clean frontend constraint checks and basic backend keyword filtering.
* **Data Intelligence Events & Chronology**: Event capture loggers mapped across users, payments, debates, and predictions.
* **Time-Series Belief Snapshots**: Captures agent trajectory snapshots upon confidence, credibility, or debate rounds updating.
* **Topic Taxonomy & Early Signals**: Programmatically indexes minds under specific topic nodes and calculates trend velocity.
* **B2B Dataset APIs & Administrative Controls**: Schema cataloging, sample previewing with audit trace records, and complete admin dashboard.

---

## 3. Broken / Mocked Components

* **USDC Payment Verification**: Server-side payment verification is currently stubbed (`const isVerified = true` in `/api/payments/verify/route.ts`). It trusts the frontend block transaction hash without verifying the receipt, token transfer, recipient, or amount.
* **Opacus Client**: Currently a local stub (`opacusClient` in `adapters/opacus.ts`). It returns simulated proofs and is not connected to live autonomous agent runners.
* **Myca Adapter**: Currently a stub (`mycaProvider` in `adapters/myca.ts`). It routes inference calls to standard OpenAI providers as a fallback.

---

## 4. Missing Components

* **Automated Blockchain RPC Failover & Timeout Logic**: If the public Base Sepolia node experiences rate limits, the entire verify payment call will fail.
* **Global Rate Limiter**: High-cost endpoints (`/api/ideas`, `/api/payments/verify`, `/api/debates`) lack server-side rate limits, opening risk for spam/DoS attacks.
* **Idempotency Verification Key Store**: High-concurrency operations can publish multiple minds for a single payment hash.

---

## 5. Security & Production Risks

### Security Risks
1. **Trusting Frontend payment verification**: Users can bypass the 1 USDC fee by passing arbitrary transaction hashes or replaying old hashes.
2. **Replay attacks**: A single successful transaction hash can be submitted multiple times or to verify multiple ideas since there is no index check on unique transaction hash reuse in active payments.
3. **IDOR / Admin endpoints**: Admin dashboard API endpoints lack strict cryptographic verification of authorization roles.

### Production Risks
1. **0G Compute / LLM Provider Rate Limits**: Large-scale debates or agent refresh tasks can quickly deplete the compute budget.
2. **SQLite Write Locks**: Concurrent SQLite operations could cause database locks if queries are not optimized or run within strict timeouts.

---

## 6. Environment Variables

Below is the required production configuration:

### Public variables
* `NEXT_PUBLIC_CHAIN_ID`: 8453 (Base mainnet) / 84532 (Base Sepolia)
* `NEXT_PUBLIC_CHAIN_NAME`: Base / Base Sepolia
* `NEXT_PUBLIC_USDC_CONTRACT_ADDRESS`: Base USDC contract address
* `NEXT_PUBLIC_RECIPIENT_ADDRESS`: Platform treasury wallet address

### Server-only / Secrets
* `AI_PROVIDER`: "openai" or "zerog"
* `OPENAI_API_KEY`: Secrets key
* `0G_API_KEY` / `ZEROG_API_KEY`: Router credentials
* `ZEROG_API_URL`: Compute RPC URL
* `DATABASE_PATH`: Database store path

---

## 7. Recommended Fixes

1. **Harden Payment Verification**: Replace the mock logic in `/api/payments/verify/route.ts` with real on-chain transaction receipt verification via standard RPC provider (Ethers/Viem).
2. **Implement Replay Protection**: Enforce unique database constraints on `payment.tx_hash` and check uniqueness of transaction hashes across all verified payments.
3. **Rate Limiting Middleware**: Implement server-side rate limiting on high-cost endpoints.
4. **Implement Robust Health Checks**: Add `/api/health` checking RPC nodes, database locks, and LLM statuses.
