import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

// ─── Types (match contract return types) ─────────────────────────────────────

/** A single prediction market bet */
export interface Bet {
  bet_id: number;
  question: string;
  deadline: number;
  creator: string;
  total_yes: number;
  total_no: number;
  settled: boolean;
  outcome: string;
  reason: string;
  confidence: number;
  created_at: number;
}

/** Global platform statistics */
export interface Stats {
  total_bets: number;
  total_volume: number;
  next_bet_id: number;
}

/** A user's stake info for a specific bet */
export interface UserStake {
  choice: string;
  amount: number;
  claimed: boolean;
}

// ─── Contract Address ────────────────────────────────────────────────────────

export const CONTRACT_ADDRESS: `0x${string}` =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`;

// ─── Clients & Account ──────────────────────────────────────────────────────

/** Read-only client — no account required */
export const readClient = createClient({
  chain: studionet,
});

/** Account used for write operations */
export const account = createAccount();

/** Write client — signs transactions with the generated account */
export const writeClient = createClient({
  chain: studionet,
  account,
});

// ─── Read Helpers ────────────────────────────────────────────────────────────

/** Fetch every bet on the platform (returns full bet objects) */
export async function getAllBets(): Promise<Bet[]> {
  try {
    const raw = await readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_all_bets",
      args: [],
    });
    // Contract returns list of dicts directly
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("[getAllBets] Failed:", error);
    return [];
  }
}

/** Fetch a single bet by ID */
export async function getBet(id: number): Promise<Bet | null> {
  try {
    const raw = await readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_bet",
      args: [id],
    });
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    return data as Bet;
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
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    return data as Stats;
  } catch (error) {
    console.error("[getStats] Failed:", error);
    return { total_bets: 0, total_volume: 0, next_bet_id: 1 };
  }
}

/** Fetch a user's stake for a specific bet */
export async function getUserStake(
  userAddress: string,
  betId: number
): Promise<UserStake> {
  try {
    const raw = await readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_user_stake",
      args: [userAddress, betId],
    });
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    return data as UserStake;
  } catch (error) {
    console.error(`[getUserStake] Failed for bet #${betId}:`, error);
    return { choice: "", amount: 0, claimed: false };
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
    value: BigInt(initialStake),
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
    value: BigInt(amount),
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

// ─── Utility Functions ───────────────────────────────────────────────────────

/** Format unix timestamp to readable date */
export function formatDeadline(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Calculate YES/NO odds as percentages */
export function calculateOdds(
  totalYes: number,
  totalNo: number
): { yes: string; no: string } {
  const total = totalYes + totalNo;
  if (total === 0) return { yes: "50%", no: "50%" };
  const yesPercent = ((totalYes / total) * 100).toFixed(1);
  const noPercent = ((totalNo / total) * 100).toFixed(1);
  return { yes: `${yesPercent}%`, no: `${noPercent}%` };
}
