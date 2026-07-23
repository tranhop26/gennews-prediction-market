# GenNews Deployment Info

## Contract Details
- **Network:** GenLayer Studio (Simulator)
- **Contract File:** `contracts/BettingPool.py`
- **Contract Address:** `0x79c3eeA98B9f2c70D05Cd19a7f978b756634Cdee`
- **Deployed Studio Link:** https://studio.genlayer.com/contracts/0x79c3eeA98B9f2c70D05Cd19a7f978b756634Cdee
- **Status:** Deployed & Finalized

## How to Deploy

1. Go to https://studio.genlayer.com
2. Click Settings ⚙️ → "Reset Storage" → Confirm
3. Hard refresh: `Ctrl+Shift+F5`
4. Click "New Contract" or "+"
5. Copy contents of `contracts/BettingPool.py`
6. Paste into editor → Click "Deploy"
7. Wait for `Status: FINALIZED` and `Result: SUCCESS`
8. Copy contract address and paste above

## Test Results

### Test 1: Create Bet
```
create_bet("Will Bitcoin reach $150,000 by Dec 31, 2026?", 1735689600, 1000, "YES")
```
Expected: ✅ Returns bet_id = 1

### Test 2: Get Bet
```
get_bet(1)
```
Expected: ✅ Returns bet JSON with question, stakes, etc.

### Test 3: Stake
```
stake(1, "NO", 500)
```
Expected: ✅ "Staked 500 on NO"

### Test 4: Get Stats
```
get_stats()
```
Expected: ✅ `{"total_bets": 1, "total_volume": 1500, ...}`

### Test 5: Settle Bet (AI Settlement)
```
settle_bet(1)
```
Expected: ✅ AI reads news, returns "Settled: YES/NO (Confidence: X/10)"
Note: Takes 1-2 minutes (AI reads real news sources)

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Contract Queues not found` | Missing `# v0.2.16` on first line |
| `AssertionError: TreeMap <- TreeMap` | Remove `self.x = TreeMap()` from `__init__` |
| `Schema error` | Check for `float` type usage |
| `Module 'genlayer' has no attribute` | Use `from genlayer import *` not `import genlayer as gl` |
