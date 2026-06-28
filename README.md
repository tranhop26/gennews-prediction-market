# 🗞️ GenNews - AI-Powered Prediction Market on GenLayer

> **"GenNews là prediction market đầu tiên trên thế giới tự động settle bằng AI đọc tin tức thật on-chain — không cần Oracle, không cần vote, không cần trung gian."**

## 🎯 What is GenNews?

GenNews is a decentralized prediction market built on **GenLayer** where bets are automatically settled by AI reading real news sources on-chain. Users create predictions about future events, stake tokens on YES/NO outcomes, and when the deadline arrives, GenLayer's AI validators read actual news from Reuters, Bloomberg, CoinDesk and more to determine the outcome.

### Why GenLayer?

**Without GenLayer, this project DIES.** Solidity cannot:
- ❌ Read Reuters/Bloomberg articles on-chain
- ❌ Subjectively reason "has event X happened?" from news text
- ❌ Reach AI-powered consensus on ambiguous real-world outcomes

GenLayer makes this possible with:
- ✅ `gl.nondet.web.render()` — fetch and render live news pages
- ✅ `gl.nondet.exec_prompt()` — AI analyzes news content
- ✅ `gl.eq_principle.prompt_comparative()` — validators reach semantic consensus

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│           (Next.js + TailwindCSS)            │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Homepage  │ │  Create  │ │  Bet Detail  │ │
│  │          │ │   Bet    │ │ + AI Settle  │ │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘ │
│       │             │              │          │
│       └─────────────┼──────────────┘          │
│                     │                         │
│              genlayer-js SDK                  │
└─────────────────────┼─────────────────────────┘
                      │
              ┌───────▼────────┐
              │  GenLayer VM   │
              │                │
              │  BettingPool   │
              │   Contract     │
              │                │
              │ ┌────────────┐ │
              │ │ AI Settle  │ │
              │ │ web.render │ │
              │ │ exec_prompt│ │
              │ └────────────┘ │
              └───────┬────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼───┐   ┌────▼───┐   ┌────▼───┐
   │Reuters │   │Bloomberg│   │CoinDesk│
   │  News  │   │  News   │   │  News  │
   └────────┘   └─────────┘   └────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- GenLayer Studio account

### Setup

```bash
# Clone the repo
git clone https://github.com/[YOUR_USERNAME]/gennews-prediction-market.git
cd gennews-prediction-market

# Install frontend dependencies
cd frontend
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your contract address

# Run development server
npm run dev
```

### Deploy Contract
1. Go to https://studio.genlayer.com
2. Upload `contracts/BettingPool.py`
3. Deploy and copy contract address
4. Paste address into `frontend/.env.local`

## 📦 Project Structure

```
gennews-prediction-market/
├── contracts/
│   └── BettingPool.py          ← GenLayer Intelligent Contract
├── frontend/
│   ├── app/                    ← Next.js App Router pages
│   ├── components/             ← Reusable UI components
│   ├── lib/                    ← GenLayer SDK integration
│   └── ...
├── DEPLOYMENT.md               ← Deployment info & addresses
└── README.md                   ← This file
```

## 🔗 Links

- **Live App**: [Coming soon]
- **Contract Address**: [Coming soon]
- **Demo Video**: [Coming soon]
- **GenLayer Docs**: https://docs.genlayer.com

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Smart Contract | Python (GenLayer Intelligent Contract) |
| Frontend | Next.js 14, TypeScript, TailwindCSS |
| Blockchain SDK | genlayer-js |
| Deployment | Vercel (frontend), GenLayer Studio (contract) |
| AI Settlement | GenLayer AI Validators (LLM consensus) |

## 📄 License

MIT
