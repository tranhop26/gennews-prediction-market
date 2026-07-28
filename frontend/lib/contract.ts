import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import {
  ExecutionResult,
  TransactionStatus,
  type TransactionHash,
} from "genlayer-js/types";
import { parseGenAmount } from "@/lib/amounts";

export interface Bet {
  bet_id: number;
  question: string;
  deadline: number;
  creator: string;
  total_yes: string;
  total_no: string;
  settled: boolean;
  outcome: string;
  reason: string;
  confidence: number;
  source_count: number;
  created_at: number;
}

export interface Stats {
  total_bets: number;
  total_volume: string;
  total_paid_out: string;
  contract_balance: string;
  next_bet_id: number;
}

export interface UserStake {
  choice: string;
  amount: string;
  claimed: boolean;
}

type ClientOptions = NonNullable<Parameters<typeof createClient>[0]>;
type WalletProvider = NonNullable<ClientOptions["provider"]>;

declare global {
  interface Window {
    ethereum?: WalletProvider;
  }
}

const configuredAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const DEPRECATED_CONTRACT_ADDRESS =
  "0x79c3eea98b9f2c70d05cd19a7f978b756634cdee";

export const CONTRACT_ADDRESS = configuredAddress as `0x${string}`;

export const readClient = createClient({
  chain: studionet,
});

function requireContractAddress(): `0x${string}` {
  if (
    !/^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS) ||
    CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000" ||
    CONTRACT_ADDRESS.toLowerCase() === DEPRECATED_CONTRACT_ADDRESS
  ) {
    throw new Error(
      "NEXT_PUBLIC_CONTRACT_ADDRESS is missing, invalid, or points to the deprecated contract. Deploy the fixed contract and configure its new address.",
    );
  }
  return CONTRACT_ADDRESS;
}

async function getWalletClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Install or enable an EVM wallet such as MetaMask");
  }

  const requested = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  if (!Array.isArray(requested) || typeof requested[0] !== "string") {
    throw new Error("The wallet did not return an account");
  }

  const address = requested[0] as `0x${string}`;
  const client = createClient({
    chain: studionet,
    account: address,
    provider: window.ethereum,
  });
  await client.connect("studionet");
  return { address, client };
}

async function waitForSuccess(
  hash: TransactionHash,
  retries = 120,
): Promise<void> {
  const receipt = await readClient.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    interval: 5_000,
    retries,
  });

  if (
    receipt.txExecutionResultName !== ExecutionResult.FINISHED_WITH_RETURN
  ) {
    throw new Error(
      `Transaction ${hash} finalized but contract execution failed`,
    );
  }
}

export async function connectWallet(): Promise<string> {
  const { address } = await getWalletClient();
  return address;
}

export async function getAllBets(): Promise<Bet[]> {
  const raw = await readClient.readContract({
    address: requireContractAddress(),
    functionName: "get_all_bets",
    args: [],
  });
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!Array.isArray(data)) {
    throw new Error("Contract returned an invalid market list");
  }
  return data as Bet[];
}

export async function getBet(id: number): Promise<Bet | null> {
  const raw = await readClient.readContract({
    address: requireContractAddress(),
    functionName: "get_bet",
    args: [id],
  });
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (
    !data ||
    typeof data !== "object" ||
    "error" in data
  ) {
    return null;
  }
  return data as Bet;
}

export async function getStats(): Promise<Stats> {
  const raw = await readClient.readContract({
    address: requireContractAddress(),
    functionName: "get_stats",
    args: [],
  });
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  return data as Stats;
}

export async function getUserStake(
  userAddress: string,
  betId: number,
): Promise<UserStake> {
  const raw = await readClient.readContract({
    address: requireContractAddress(),
    functionName: "get_user_stake",
    args: [userAddress, betId],
  });
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  return data as UserStake;
}

export async function createBet(
  question: string,
  deadline: number,
  initialStakeGen: string,
  initialChoice: string,
): Promise<string> {
  const stakeWei = parseGenAmount(initialStakeGen);
  const { client } = await getWalletClient();
  const hash = await client.writeContract({
    address: requireContractAddress(),
    functionName: "create_bet",
    args: [question, deadline, stakeWei, initialChoice],
    value: stakeWei,
  });
  await waitForSuccess(hash);
  return hash;
}

export async function stakeBet(
  betId: number,
  choice: string,
  amountGen: string,
): Promise<string> {
  const amountWei = parseGenAmount(amountGen);
  const { client } = await getWalletClient();
  const hash = await client.writeContract({
    address: requireContractAddress(),
    functionName: "stake",
    args: [betId, choice, amountWei],
    value: amountWei,
  });
  await waitForSuccess(hash);
  return hash;
}

export async function settleBet(betId: number): Promise<string> {
  const { client } = await getWalletClient();
  const hash = await client.writeContract({
    address: requireContractAddress(),
    functionName: "settle_bet",
    args: [betId],
    value: 0n,
  });
  await waitForSuccess(hash, 240);
  return hash;
}

export async function claimWinnings(betId: number): Promise<string> {
  const { client } = await getWalletClient();
  const hash = await client.writeContract({
    address: requireContractAddress(),
    functionName: "claim_winnings",
    args: [betId],
    value: 0n,
  });
  await waitForSuccess(hash);

  const triggered = await readClient.getTriggeredTransactionIds(hash);
  for (const childHash of triggered) {
    await waitForSuccess(childHash);
  }
  return hash;
}

export function formatDeadline(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
