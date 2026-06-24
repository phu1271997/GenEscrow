# GenEscrow (Milestone-Grade) — Secure Freelance Escrow with AI Dispute Appeal

**GenEscrow** is an AI-native decentralized freelance escrow platform built on GenLayer. It features Intelligent Contracts with built-in semantic AI dispute resolution and a robust dispute appeal flow, guaranteeing decentralized, middleman-free, and objective contract execution.

---

## 🌟 Upgraded Features (Milestone-Grade)

### 1. Advanced Semantic AI Consensus (Milestone 1)
- **Equivalence Principle:** Shifted from fragile literal string matching to semantic equivalence via `gl.eq_principle.prompt_comparative`.
- **Intelligent Payouts:** AI evaluates work against acceptance criteria and returns a structured JSON verdict: `RELEASE` (100% payout), `REFUND` (0%), or `PARTIAL` (payout percentage from 1-99%).
- **Semantic Rule:** Validators agree on consensus if they share the same verdict type, and if `PARTIAL`, their suggested payout percentages differ by $\le 10\%$. Differences in wording/reasoning are ignored.
- **Fail-Safe Web Access:** Robust error handling catches cào dữ liệu (web rendering) failures gracefully, feeding errors to the AI (e.g., dead URLs or inaccessible work result in a `REFUND` verdict).
- **Address & ID Normalization:** Complete case-insensitive wallet comparisons (`.lower()`) and strict input validation.

### 2. Multi-Stage Dispute Escalation & Appeal Flow (Milestone 2)
- **Second-Instance Trial:** A dissatisfied party (client or freelancer) can lodge a formal appeal within a window of time after the first AI Jury verdict.
- **Anti-Spam Staking:** Requires locking an anti-spam stake (`appeal_stake` in GEN) to prevent abuse.
- **Forensic AI Arbitrator:** Appeals trigger a high-severity, critical review from a dedicated forensic AI prompt (skeptic perspective) analyzing the submission alongside the previous jury's findings.
- **Forfeiture & Refund Rules:** If the forensic review overturns the previous verdict, the appealer's stake is fully refunded. If upheld, the stake is forfeited into the job's virtual pool.
- **State Progression:** `OPEN` ➔ `ACCEPTED` ➔ `SUBMITTED` ➔ `DISPUTED` ➔ `RESOLVED` ➔ `APPEALED` ➔ `FINALIZED`.

### 3. High-Fidelity Frontend & Developer Experience (Milestone 3)
- **Auto-Sync Env:** The deployment script (`deploy/deployScript.ts`) automatically writes the contract address to `frontend/.env`.
- **Consensus Loading States:** Visual loaders and real-time state feedback (e.g., *"AI Jury is deliberating..."*, *"Forensic AI is reviewing..."*) during active consensus rounds.
- **Deep Verdict Insights:** Detailed panels displaying the exact release percentage, visual distribution bar for partial payouts, and the AI's step-by-step reasoning.
- **Appeal Interface:** A modal dialog for submitting appeals with a custom stake, alongside live status indicators showing the appeal outcome (`UPHELD` vs. `OVERTURNED`).

---

## 🏗️ Architecture

```
├── contracts/
│   └── gen_escrow.py      # Upgraded Intelligent Contract (v0.2.16)
├── deploy/
│   └── deployScript.ts    # Auto-env writing deployment script
├── test/
│   └── test_gen_escrow.py # Comprehensive integration test suite (gltest)
└── frontend/
    ├── app/               # Next.js 15 pages
    ├── components/        # Radix UI + Tailwind components (JobsTable, Navbar)
    └── lib/
        ├── contracts/     # TypeScript wrapper for GenEscrow
        └── hooks/         # TanStack React Query hooks
```

---

## 🚀 Getting Started

### 1. Installation

Install GenLayer CLI globally and install project dependencies:
```bash
npm install -g genlayer
npm install
cd frontend && npm install
cd ..
```

### 2. Running the Contract Test Suite

Ensure GenLayer Studio or a local GenLayer node is running, then execute:
```bash
gltest test/test_gen_escrow.py
```
This tests:
1. **Happy Path:** Create, accept, submit, client approve.
2. **Dispute Resolution:** Dispute, resolve via AI Jury (semantic consensus).
3. **Appeal - Overturn:** Appeal, forensic review changes verdict, refunds stake.
4. **Appeal - Uphold:** Appeal, forensic review keeps verdict, forfeits stake.
5. **Edge Cases:** Validation, double-claim prevention, incorrect states.

### 3. Deploying to GenLayer Studio / Testnet

Deploy the contract:
```bash
npm run deploy
```
The script compiles `contracts/gen_escrow.py`, deploys it to your configured network, and automatically populates `frontend/.env` with:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STUDIO_URL=http://...
```

### 4. Running the Frontend

Start the development server:
```bash
npm run dev
```
Open `http://localhost:3000` to interact with the application.

---

## 🛠️ Verification Checklist for GenLayer Studio

When verifying on [GenLayer Studio](https://studio.genlayer.com/run-debug):
1. **Reset Storage:** Perform a clean reset of the contract state.
2. **Hard Refresh:** Reload the browser to clear cached ABIs.
3. **Deploy:** Compile and deploy `gen_escrow.py`.
4. **Interact:** Invoke transactions (`create_job`, `accept_job`, `submit_work`, `dispute_job`, `resolve_dispute`, `request_appeal`, `resolve_appeal`).
5. **Verify:** Check the **Transactions** tab to ensure each transaction reaches `Result: SUCCESS` (not just `Status: FINALIZED`).
