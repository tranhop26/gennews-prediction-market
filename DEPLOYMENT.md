# GenNews Deployment and Verification

## Deployment Status

The legacy contract below is deprecated and must not be used:

- Address: `0x79c3eeA98B9f2c70D05Cd19a7f978b756634Cdee`
- Reason: its deployed source predates native GEN escrow, deadline enforcement,
  unresolved refunds, and payout transfers.

Deploy the current `contracts/BettingPool.py` as a new contract. Record the new
address and transaction evidence here before presenting the project as live.

## Deploy the Fixed Contract

1. Open https://studio.genlayer.com.
2. Create a new contract.
3. Paste the current `contracts/BettingPool.py`.
4. Deploy and wait for `FINALIZED` with a successful execution result.
5. Copy the new contract address.
6. Copy `frontend/.env.example` to `frontend/.env.local`.
7. Set `NEXT_PUBLIC_CONTRACT_ADDRESS` to the new address.

## Required End-to-End Verification

GEN values are denominated in wei: `1 GEN = 1000000000000000000 wei`.
For every payable call, the Studio transaction value must exactly equal the
stake argument.

### 1. Create a funded market

Call:

```text
create_bet(
  "Will Bitcoin trade above USD 150000 before January 1, 2027?",
  1798761600,
  1000000000000000000,
  "YES"
)
```

Transaction value:

```text
1000000000000000000
```

Verify:

- Execution is successful and finalized.
- `get_bet(1)` reports `total_yes = "1000000000000000000"`.
- Contract balance increased by exactly 1 GEN.

### 2. Stake from a second account

Switch accounts and call:

```text
stake(1, "NO", 500000000000000000)
```

Transaction value:

```text
500000000000000000
```

Verify:

- Execution is successful and finalized.
- `get_bet(1)` reports `total_no = "500000000000000000"`.
- A call with transaction value `0` fails.
- A call whose value differs from `amount` fails.

### 3. Verify deadline enforcement

Before the deadline:

- A new stake succeeds.
- `settle_bet(1)` fails.

After the deadline:

- A new stake fails.
- `settle_bet(1)` can proceed.

Use a short test deadline for this verification; do not change contract code to
bypass time checks.

### 4. Verify resolved payout

After settlement:

1. Record the winning account's balance.
2. Call `claim_winnings(1)` from that same wallet.
3. Wait for the parent transaction and its triggered transfer to finalize.
4. Confirm the wallet balance increased by the returned payout.
5. Confirm a second claim fails.

### 5. Verify unresolved refunds

Create a separate short-lived market whose evidence cannot be confirmed by two
independent sources. After settlement returns `UNRESOLVED`, each participant
must receive exactly their original stake when claiming.

## Frontend Verification

From `frontend/`:

```bash
npm ci
npm test
npm run lint
npm run build
```

Then verify with two wallet accounts:

1. Connect wallet A and create a market.
2. Connect wallet B and stake.
3. Reload the page and confirm the same wallet retains claim ownership.
4. Settle after the deadline.
5. Claim and confirm the wallet balance changes.

## Evidence to Publish

- New contract address.
- Deployed source hash matching `contracts/BettingPool.py`.
- Create, stake, settle, claim, and unresolved-refund transaction hashes.
- Correct GenNews frontend URL.
- Short video showing wallet balances before and after claim.
