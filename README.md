# 🗞️ GenNews — AI-Powered Prediction Market on GenLayer

> **The first prediction market that settles itself by reading real news on-chain. No oracles, no votes, no intermediaries.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project)

---

## 🚀 Why GenNews?

Traditional prediction markets (Polymarket, Augur) need manual oracles or community votes to settle bets:
- ❌ **Slow** — days/weeks for manual resolution
- ❌ **Expensive** — oracle fees, dispute resolution
- ❌ **Manipulable** — biased voters, oracle attacks

**GenNews solves this with GenLayer's Intelligent Contracts:**
- ✅ AI reads independent sources such as Reuters, Bloomberg, AP, BBC, and CNBC
- ✅ Settles in **minutes** after deadline
- ✅ No oracles, no votes — pure **AI consensus**

### Why This Project Dies Without GenLayer

**Ethereum/Solidity CANNOT:**
- Read web content on-chain (`gl.nondet.web.render()`)
- Make subjective AI decisions (`gl.nondet.exec_prompt()`)
- Reach consensus on independently evaluated outcomes (`gl.vm.run_nondet_unsafe()`)

**GenLayer is the HEART, not a side feature.** Remove GenLayer and the entire settlement mechanism is impossible.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│               Frontend (Next.js)                 │
│                                                   │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐   │
│  │ Homepage  │ │  Create  │ │  Bet Detail    │   │
│  │ (Markets) │ │   Bet    │ │ Stake/Settle   │   │
│  └─────┬─────┘ └────┬─────┘ └───────┬────────┘   │
│        └──────────┬──┴───────────────┘            │
│                   │                                │
│            genlayer-js SDK                         │
└───────────────────┼────────────────────────────────┘
                    │
          ┌─────────▼──────────┐
          │   GenLayer GenVM   │
          │                    │
          │  BettingPool.py    │
          │  ┌──────────────┐  │
          │  │  AI SETTLE   │  │
          │  │              │  │
          │  │ web.render() │◄─┼── Fetches live news
          │  │ exec_prompt()│◄─┼── AI analyzes content
          │  │ prompt_comp()│◄─┼── Validators consensus
          │  └──────────────┘  │
          └────────────────────┘
                    │
      ┌─────────────┼──────────────┐
      │             │              │
 ┌────▼────┐  ┌────▼─────┐  ┌────▼─────┐
 │ Reuters │  │Bloomberg │  │ AP / BBC │
 │  News   │  │  News    │  │  News    │
 └─────────┘  └──────────┘  └──────────┘
```

---

## 🧪 User Flow (Test Example)

### 1. Create Bet
- **Question**: "Will Bitcoin reach $150,000 by Dec 31, 2026?"
- **Deadline**: Dec 31, 2026
- **Initial Stake**: 1000 tokens on YES

### 2. Others Stake
- User B: 500 tokens on NO
- User C: 300 tokens on YES
- User D: 700 tokens on NO

### 3. After Deadline — AI Settlement
- Anyone clicks **"Settle with AI"**
- AI reads 5 news sources (takes 1-2 min):
  - Reuters, Bloomberg, AP News, BBC, CNBC
- AI analyzes: "Has Bitcoin reached $150k?"
- Multiple GenLayer validators reach consensus
- **Result**: YES (Confidence: 8/10)
- **Reasoning**: "Multiple sources confirm Bitcoin surpassed $150,000..."

### 4. Winners Claim
- YES voters claim proportional share of total pool
- Payout = (your_stake / total_winning_side) × total_pool

---

## 📦 Project Structure

```
gennews-prediction-market/
├── contracts/
│   └── BettingPool.py          ← GenLayer Intelligent Contract
├── frontend/
│   ├── app/
│   │   ├── page.tsx            ← Homepage with hero + markets
│   │   ├── create/page.tsx     ← Create new prediction
│   │   └── bet/[id]/page.tsx   ← Bet detail + stake + settle
│   ├── components/
│   │   ├── BetCard.tsx         ← Market card component
│   │   ├── StakeForm.tsx       ← YES/NO staking interface
│   │   └── SettleButton.tsx    ← AI settlement trigger
│   ├── lib/
│   │   └── contract.ts         ← GenLayer SDK integration
│   └── ...
├── DEPLOYMENT.md               ← Deploy guide + test results
└── README.md                   ← This file
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Smart Contract | Python (GenLayer Intelligent Contract) |
| Frontend | Next.js 16, TypeScript, TailwindCSS |
| Blockchain SDK | genlayer-js |
| Deployment | Vercel (frontend), GenLayer Studio (contract) |
| AI Settlement | GenLayer AI Validators (LLM consensus) |

---

## 📦 Setup & Deploy

### Prerequisites
- Node.js 18+
- npm

### 1. Clone & Install

```bash
git clone https://github.com/tranhop26/gennews-prediction-market.git
cd gennews-prediction-market/frontend
npm ci
```

### 2. Deploy Contract on GenLayer Studio

1. Go to https://studio.genlayer.com
2. Click Settings ⚙️ → **"Reset Storage"** → Confirm
3. Hard refresh: `Ctrl+Shift+F5`
4. Click "+" → paste contents of `contracts/BettingPool.py`
5. Click **"Deploy"** → wait for `FINALIZED` + `SUCCESS`
6. Copy the **new** contract address

> The legacy deployment `0x79c3eeA98B9f2c70D05Cd19a7f978b756634Cdee`
> predates the escrow fixes and must not be used by the frontend.

### 3. Configure Frontend

```bash
cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_CONTRACT_ADDRESS=0x...your_contract_address
```

### 4. Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

### 5. Deploy to Vercel

```bash
npm install -g vercel
vercel login
cd frontend
vercel --prod
```

Then add env var `NEXT_PUBLIC_CONTRACT_ADDRESS` in Vercel dashboard → Settings → Environment Variables.

---

## 🧠 Smart Contract Details

### Contract Methods

| Method | Type | Description |
|--------|------|-------------|
| `create_bet(question, deadline, initial_stake, initial_choice)` | Payable write | Create a market; `initial_stake` must equal native GEN sent |
| `stake(bet_id, choice, amount)` | Payable write | Stake native GEN; `amount` must equal transaction value |
| `settle_bet(bet_id)` | Write | **🤖 AI reads news & determines outcome** |
| `claim_winnings(bet_id)` | Write | Claim proportional winnings |
| `get_bet(bet_id)` | View | Get bet details |
| `get_all_bets()` | View | List all bets |
| `get_stats()` | View | Platform statistics |
| `get_user_stakes(bet_id, address)` | View | User's stake info |

### AI Settlement — The Core Feature

```python
# Step 1: Fetch news from 5 real sources
page = gl.nondet.web.render(url, mode='html')

# Step 2: AI analyzes all evidence
result = gl.nondet.exec_prompt(prompt, response_format='json')

# Step 3: every validator independently fetches evidence and evaluates outcome
outcome = gl.vm.run_nondet_unsafe(evaluate, validate)
```

### Rules Followed
- ✅ `# v0.2.16` version header (Rule #1)
- ✅ No TreeMap reassignment in `__init__` (Rule #2)
- ✅ No `float` types — uses `u256` (Rule #3)
- ✅ Allowed types only: `str, bool, u256, TreeMap, DynArray` (Rule #4)
- ✅ `TreeMap`/`DynArray` storage (Rule #5)
- ✅ Class named `Contract` (Rule #6)
- ✅ Nondet wrapped properly (Rule #7)
- ✅ `from genlayer import *` (Rule R13)
- ✅ Independent leader/validator evaluation using `run_nondet_unsafe`

### Edge Cases Handled
- Empty question → `UserError`
- Invalid choice (not YES/NO) → `UserError`
- Bet doesn't exist → `UserError`
- Already settled → `UserError`
- Double claim → `UserError`
- Zero stake → `UserError`
- Missing transaction datetime → fail closed
- Declared amount does not match native GEN sent → `UserError`
- Fewer than two accessible sources → `UNRESOLVED`

### Key Refactorings & Enhancements
- 🟢 **Real Contract-Side Escrow & Value Transfers**: payable methods only credit `gl.message.value` and require it to exactly match the declared amount. Claims transfer native GEN to the caller through an EVM recipient interface.
- 🟢 **Market Deadline Enforcement**: Strict deadline checks enforced in `create_bet`, `stake` (blocks late staking), and `settle_bet` (blocks early settlement).
- 🟢 **Unresolved State Preservation**: If fewer than 2 reliable news sources can be rendered/accessed, outcome defaults to `UNRESOLVED`. Users claim 100% of their staked tokens back as an escrow refund.
- 🟢 **Wallet-Signed Frontend**: browser writes use the connected wallet instead of an ephemeral generated private key. Decimal GEN values are converted to wei without floating point.
- 🟢 **Finalized Receipt Checks**: the UI reports success only after the transaction is finalized and contract execution succeeds.

---

## ✅ Verification Required Before Submission

The project is ready to advertise as live only after all of these artifacts are
updated:

- New GenLayer contract address deployed from the current
  `contracts/BettingPool.py`.
- Transaction hashes proving Create → Stake → Settle → Claim.
- A second test proving `UNRESOLVED` returns each user's exact stake.
- Vercel URL running this GenNews frontend with the new address.
- `npm test`, `npm run lint`, and `npm run build` all passing.

The old contract and Vercel URLs have intentionally been removed because they
do not represent the current source.

---

## 🎥 Video Demo Script (2-3 min)

1. **Intro** (15s): Show homepage, explain GenNews concept
2. **Create Bet** (30s): Create "Will Bitcoin reach $150k?" bet
3. **Stake** (20s): Stake tokens on YES and NO
4. **AI Settlement** (60s): Trigger settlement, show AI reading news
5. **Outro** (15s): "This is impossible without GenLayer"

---

## 📄 License

MIT

---

Built with ❤️ on [GenLayer](https://genlayer.com)
