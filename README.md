# GenEscrow - Decentralized Freelance Escrow on GenLayer

GenEscrow is a decentralized freelance escrow platform built on GenLayer, featuring Intelligent Contracts with built-in AI dispute resolution.

## Features
- **Create Escrow Jobs**: Clients can deposit funds (GEN) and define acceptance criteria.
- **Submit Work**: Freelancers accept jobs and submit public URLs containing their completed work.
- **Client Approval**: Clients can review and approve the work, instantly releasing the funds.
- **AI Jury Dispute Resolution**: In case of a dispute, either party can request a resolution. GenLayer's AI validators automatically fetch the submitted webpage, analyze the content against the initial criteria, and reach a consensus (Release, Refund, or Partial) using a majority vote mechanism.

## How it works
1. **Client Creates Job**: Sets description, acceptance criteria, deadline, and funds.
2. **Freelancer Accepts**: A freelancer takes on the job.
3. **Freelancer Submits**: Submits a URL to their work.
4. **Approval or Dispute**:
   - Client approves -> Funds released to freelancer.
   - Dispute raised -> AI Jury triggered.
5. **AI Jury**: GenLayer's Intelligent Contract uses `gl.nondet.web.render` to read the submission URL and `gl.nondet.exec_prompt` to analyze it against criteria. It returns a verdict based on AI consensus.

## Installation & Setup

1. **Install GenLayer CLI**:
   ```bash
   npm install -g genlayer
   genlayer --version
   ```

2. **Initialize GenLayer** (if not already done):
   ```bash
   genlayer init
   ```

3. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

## How to Deploy

To deploy the `gen_escrow.py` contract, Codex (or you) can simply use the included deployment script:

```bash
npx ts-node deploy/deployScript.ts
```

> **IMPORTANT**: Sau khi deploy contract, Codex sẽ tự động thêm `NEXT_PUBLIC_CONTRACT_ADDRESS` vào file `frontend/.env`.

## How to Test

Start the frontend in development mode:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` to interact with the application. Make sure your wallet is connected to the GenLayer network.
