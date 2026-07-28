export const WEI_PER_GEN = 10n ** 18n;

export function parseGenAmount(input: string): bigint {
  const normalized = input.trim();
  if (!/^\d+(?:\.\d{1,18})?$/.test(normalized)) {
    throw new Error("Enter a valid GEN amount with at most 18 decimals");
  }

  const [whole, fraction = ""] = normalized.split(".");
  const wei =
    BigInt(whole) * WEI_PER_GEN +
    BigInt(fraction.padEnd(18, "0") || "0");

  if (wei <= 0n) {
    throw new Error("Amount must be greater than 0 GEN");
  }
  return wei;
}

export function formatGenAmount(
  value: string | bigint,
  maxFractionDigits = 4,
): string {
  const wei = typeof value === "bigint" ? value : BigInt(value);
  const whole = wei / WEI_PER_GEN;
  const fraction = (wei % WEI_PER_GEN).toString().padStart(18, "0");
  const visibleFraction = fraction
    .slice(0, Math.max(0, Math.min(18, maxFractionDigits)))
    .replace(/0+$/, "");
  const formattedWhole = whole.toLocaleString("en-US");
  return visibleFraction
    ? `${formattedWhole}.${visibleFraction}`
    : formattedWhole;
}

export function calculateOdds(
  totalYes: string | bigint,
  totalNo: string | bigint,
): { yes: number; no: number } {
  const yes = typeof totalYes === "bigint" ? totalYes : BigInt(totalYes);
  const no = typeof totalNo === "bigint" ? totalNo : BigInt(totalNo);
  const total = yes + no;

  if (total === 0n) {
    return { yes: 50, no: 50 };
  }

  const yesTenths = (yes * 1000n) / total;
  const yesPercent = Number(yesTenths) / 10;
  return { yes: yesPercent, no: 100 - yesPercent };
}

export function estimatePayout(
  stakeGen: string,
  totalYes: string,
  totalNo: string,
  choice: "YES" | "NO",
): bigint {
  const stake = parseGenAmount(stakeGen);
  const yes = BigInt(totalYes);
  const no = BigInt(totalNo);
  const totalAfterStake = yes + no + stake;
  const winningPoolAfterStake = (choice === "YES" ? yes : no) + stake;
  return (stake * totalAfterStake) / winningPoolAfterStake;
}

export function calculateRoiPercent(payout: bigint, stake: bigint): number {
  if (stake <= 0n) {
    return 0;
  }
  return Number(((payout - stake) * 10000n) / stake) / 100;
}
