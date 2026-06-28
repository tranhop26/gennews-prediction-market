import { createClient, createAccount } from "genlayer-js";
import { simulator } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single prediction market bet (matches contract JSON output) */
export interface Bet {
  bet_id: number;
  question: string;
  creator: string;
  deadline: number;
  resolution_urls: string;
  settled: boolean;
  outcome: string; // "PENDING" | "YES" | "NO"
  total_yes: number;
  total_no: number;
  ai_reasoning: string;
  created_at: number;
}

/** Global platform statistics */
export interface Stats {
  total_bets: number;
  total_settled: number;
  total_volume: number;
  next_bet_id: number;
}

/** A user's stake information for a specific bet */
export interface UserStakes {
  yes_stake: number;
  no_stake: number;
  has_claimed: boolean;
}

// ─── Contract Address ────────────────────────────────────────────────────────

/** Contract address loaded from environment variables */
export const CONTRACT_ADDRESS: `0x${string}` =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

// ─── Clients & Account ──────────────────────────────────────────────────────

/** Read-only client — no account required */
export const readClient = createClient({
  chain: simulator,
});

/** Account used for write (transaction) operations */
export const account = createAccount();

/** Write client — signs transactions with the generated account */
export const writeClient = createClient({
  chain: simulator,
  account,
});

// ─── Read Helpers ────────────────────────────────────────────────────────────

/** Fetch every bet on the platform */
export async function getAllBets(): Promise<Bet[]> {
  try {
    const raw = await readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_all_bets",
      args: [],
    });
    const parsed = JSON.parse(raw as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[getAllBets] Failed:", error);
    return [];
  }
}

/** Fetch a single bet by its ID */
export async function getBet(id: number): Promise<Bet | null> {
  try {
    const raw = await readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_bet",
      args: [id],
    });
    const parsed = JSON.parse(raw as string);
    if (parsed.error) return null;
    return parsed as Bet;
  } catch (error) {
    console.error(`[getBet] Failed for #${id}:`, error);
    return null;
  }
}

/** Fetch aggregate platform statistics */
export async function getStats(): Promise<Stats> {
  try {
    const raw = await readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_stats",
      args: [],
    });
    return JSON.parse(raw as string) as Stats;
  } catch (error) {
    console.error("[getStats] Failed:", error);
    return { total_bets: 0, total_settled: 0, total_volume: 0, next_bet_id: 1 };
  }
}

/** Fetch a user's stakes for a specific bet */
export async function getUserStakes(
  betId: number,
  userAddress: string
): Promise<UserStakes> {
  try {
    const raw = await readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_user_stakes",
      args: [betId, userAddress],
    });
    return JSON.parse(raw as string) as UserStakes;
  } catch (error) {
    console.error(`[getUserStakes] Failed for bet #${betId}:`, error);
    return { yes_stake: 0, no_stake: 0, has_claimed: false };
  }
}

// ─── Write Helpers ───────────────────────────────────────────────────────────

/** Create a new prediction market bet */
export async function createBet(
  question: string,
  deadline: number,
  initialStake: number,
  initialChoice: string
): Promise<string> {
  const hash = await writeClient.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "create_bet",
    args: [question, deadline, initialStake, initialChoice],
    value: BigInt(0),
  });
  await writeClient.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
  });
  return hash;
}

/** Stake on an existing bet */
export async function stakeBet(
  betId: number,
  choice: string,
  amount: number
): Promise<string> {
  const hash = await writeClient.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "stake",
    args: [betId, choice, amount],
    value: BigInt(0),
  });
  await writeClient.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
  });
  return hash;
}

/** Settle a bet — triggers AI news analysis on-chain */
export async function settleBet(betId: number): Promise<string> {
  const hash = await writeClient.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "settle_bet",
    args: [betId],
    value: BigInt(0),
  });
  await writeClient.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
  });
  return hash;
}

/** Claim winnings from a settled bet */
export async function claimWinnings(betId: number): Promise<string> {
  const hash = await writeClient.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "claim_winnings",
    args: [betId],
    value: BigInt(0),
  });
  await writeClient.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
  });
  return hash;
}
