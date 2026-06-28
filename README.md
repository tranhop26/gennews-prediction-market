# 🗞️ GenNews - AI-Powered Prediction Market on GenLayer

> **"GenNews là prediction market đầu tiên trên thế giới tự động settle bằng AI đọc tin tức thật on-chain — không cần Oracle, không cần vote, không cần trung gian."**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project)

## 🎯 What is GenNews?

GenNews is a decentralized prediction market built on **GenLayer** where bets are automatically settled by AI reading real news sources on-chain. Users create predictions about future events, stake tokens on YES/NO outcomes, and when the deadline arrives, GenLayer's AI validators read actual news from Reuters, Bloomberg, CoinDesk and more to determine the outcome.

### Why GenLayer? (Why This Project Dies Without It)

**Without GenLayer, this project CANNOT exist.** Solidity cannot:
- ❌ Read Reuters/Bloomberg articles on-chain
- ❌ Subjectively reason "has event X happened?" from news text
- ❌ Reach AI-powered consensus on ambiguous real-world outcomes

GenLayer makes this possible with:
- ✅ `gl.nondet.web.render()` — fetch and render live news pages on-chain
- ✅ `gl.nondet.exec_prompt()` — AI analyzes news content to determine outcomes
- ✅ `gl.eq_principle.prompt_comparative()` — multiple validators reach semantic consensus

**AI is the HEART of this system, not a side feature.** The entire settle flow — reading news, analyzing content, determining outcomes — is powered by GenLayer's AI infrastructure.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│               Frontend (Next.js)                │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ Homepage  │ │  Create  │ │  Bet Detail    │  │
│  │ (Markets) │ │   Bet    │ │ Stake/Settle   │  │
│  └─────┬─────┘ └────┬─────┘ └───────┬────────┘  │
│        └──────────┬──┴───────────────┘           │
│                   │                               │
│            genlayer-js SDK                        │
└───────────────────┼───────────────────────────────┘
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
 │ Reuters │  │Bloomberg │  │ CoinDesk │
 │  News   │  │  News    │  │  News    │
 └─────────┘  └──────────┘  └──────────┘
```

## 🚀 User Flow

1. **User A creates a bet**: "Will Bitcoin reach $150,000 by Dec 31, 2026?" — stakes 1000 tokens on YES
2. **Users B, C, D stake**: User B stakes 500 on NO, User C stakes 300 on YES, User D stakes 700 on NO
3. **After deadline**: Anyone calls `settle_bet()` → AI reads Reuters, Bloomberg, CoinDesk → determines outcome
4. **Winners claim**: Proportional share of total pool

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Smart Contract | Python (GenLayer Intelligent Contract) |
| Frontend | Next.js 16, TypeScript, TailwindCSS |
| Blockchain SDK | genlayer-js |
| Deployment | Vercel (frontend), GenLayer Studio (contract) |
| AI Settlement | GenLayer AI Validators (LLM consensus) |

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

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Clone & Install

```bash
git clone https://github.com/[YOUR_USERNAME]/gennews-prediction-market.git
cd gennews-prediction-market/frontend
npm install
```

### 2. Deploy Contract

1. Go to https://studio.genlayer.com
2. Click Settings ⚙️ → "Reset Storage" → Confirm
3. Hard refresh: `Ctrl+Shift+F5`
4. Click "+" → paste contents of `contracts/BettingPool.py`
5. Click "Deploy" → wait for `FINALIZED` + `SUCCESS`
6. Copy contract address

### 3. Configure Frontend

```bash
cp .env.example .env.local
# Edit .env.local with your contract address:
# NEXT_PUBLIC_CONTRACT_ADDRESS=0x...your_address
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 🧠 Smart Contract Details

### Methods

| Method | Type | Description |
|--------|------|-------------|
| `create_bet(question, deadline, initial_stake, initial_choice)` | Write | Create new prediction |
| `stake(bet_id, choice, amount)` | Write | Stake on YES or NO |
| `settle_bet(bet_id)` | Write | **AI reads news & settles** |
| `claim_winnings(bet_id)` | Write | Claim your winnings |
| `get_bet(bet_id)` | View | Get bet details |
| `get_all_bets()` | View | List all bets |
| `get_stats()` | View | Platform statistics |

### AI Settlement Process

```python
# 1. Fetch news from 5 sources
page = gl.nondet.web.render(url, mode='html')

# 2. AI analyzes evidence
result = gl.nondet.exec_prompt(analysis_prompt, response_format='json')

# 3. Validators reach consensus (NOT strict_eq!)
outcome = gl.eq_principle.prompt_comparative(
    evaluate,
    principle='The outcome must be the same YES/NO'
)
```

### Contract Rules Followed
- ✅ `# v0.2.16` version header
- ✅ `from genlayer import *` (Rule R13)
- ✅ Class named `Contract` (Rule #6)
- ✅ `TreeMap`/`DynArray` storage only (Rule #5)
- ✅ No `float` types (Rule #3)
- ✅ No TreeMap reassignment in `__init__` (Rule #2)
- ✅ `prompt_comparative` for consensus (not `strict_eq`)

## 🔗 Links

- **GenLayer Docs**: https://docs.genlayer.com
- **GenLayer Studio**: https://studio.genlayer.com
- **genlayer-js**: https://www.npmjs.com/package/genlayer-js

## 📄 License

MIT
