# MINDCAST — 24/7 Cloud Deployment Guide

This guide explains how to deploy the MINDCAST platform to a cloud hosting provider (Render or Railway) so that it runs 24/7 in the cloud with full SQLite database persistence, even if your local PC is turned off.

---

## Option 1: Deployment to Render (Recommended)

Render uses the preconfigured `render.yaml` blueprint file in this repository to set up everything automatically.

### Step 1: Push Code to GitHub
1. Create a new private repository on GitHub (e.g. `mindcast-app`).
2. Run these commands in your project terminal to push the code:
   ```bash
   git init
   git add .
   git commit -m "feat: render config and pricing model updates"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### Step 2: Deploy on Render
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New** -> **Blueprint**.
3. Connect your GitHub repository.
4. Render will read the `render.yaml` blueprint file and:
   - Create a Next.js Web Service.
   - Attach a **1GB Persistent Disk** (`data-volume`) mounted at `/data`.
   - Pre-fill the environment variables.
5. Click **Approve** to deploy.

---

## Option 2: Deployment to Railway

Railway is a great alternative that automatically detects Next.js applications and supports persistent volume attachments.

### Step 1: Create a Railway Project
1. Log in to [Railway](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your repository.

### Step 2: Attach a Persistent Volume
1. In the Railway project board, click your service block -> **Settings** -> **Volumes**.
2. Click **Add Volume**.
3. Set the Mount Path to `/data`.

### Step 3: Configure Variables
Go to the **Variables** tab of your service in Railway and add the following environment variables:
- `DATABASE_PATH` = `/data/mindcast.db`
- `AI_PROVIDER` = `zerog`
- `0G_API_KEY` = `sk-4ac33601-31cd-4bfc-abbc-6c60a8b4ff95`
- `ZEROG_API_URL` = `https://router-api.0g.ai/v1`
- `ZEROG_MODEL` = `0gm-1.0-35b-a3b`
- `NEXT_PUBLIC_CHAIN_ID` = `84532`
- `NEXT_PUBLIC_CHAIN_NAME` = `Base Sepolia`
- `NEXT_PUBLIC_USDC_CONTRACT_ADDRESS` = `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- `PAYMENT_RECIPIENT_ADDRESS` = `0xB284ED722cCC17B0BE3737A1a5cA8b991fA81F3a`
- `PAYMENT_AMOUNT` = `1`
- `TEST_PRIVATE_KEY` = `d132546c497138729ad1537e04411a13aa86be262101811f4ebb376f011cd1ea`

---

## 🔒 Verification of Cloud Health
Once deployed, check that `/api/health` returns `"status": "healthy"` to confirm all services (DB, AI, blockchain, frontend) are operational.
