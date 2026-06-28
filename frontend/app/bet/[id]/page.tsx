"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StakeForm from "@/components/StakeForm";
import SettleButton from "@/components/SettleButton";
import { getBet, claimWinnings } from "@/lib/contract";
import type { Bet } from "@/lib/contract";

export default function BetDetailPage() {
  const params = useParams();
  const betId = Number(params.id);

  const [bet, setBet] = useState<Bet | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState("");
  const [claimError, setClaimError] = useState("");

  const fetchBet = useCallback(async () => {
    try {
      const data = await getBet(betId);
      setBet(data);
    } catch (err) {
      console.error("Failed to fetch bet:", err);
    } finally {
      setLoading(false);
    }
  }, [betId]);

  useEffect(() => {
    fetchBet();
  }, [fetchBet]);

  const handleClaim = async () => {
    setClaiming(true);
    setClaimError("");
    setClaimResult("");
    try {
      await claimWinnings(betId);
      setClaimResult("Successfully claimed your winnings!");
      fetchBet();
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setClaiming(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8 hero-bg">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="skeleton h-6 w-32" />
          <div className="glass-card p-6 space-y-4">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (!bet) {
    return (
      <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8 hero-bg">
        <div className="mx-auto max-w-4xl text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-white mb-2">Bet Not Found</h1>
          <p className="text-gray-400 mb-6">
            This prediction market doesn&apos;t exist.
          </p>
          <Link href="/" className="btn-primary">
            ← Back to Markets
          </Link>
        </div>
      </div>
    );
  }

  const totalPool = bet.total_yes + bet.total_no;
  const yesPercent = totalPool > 0 ? (bet.total_yes / totalPool) * 100 : 50;
  const noPercent = totalPool > 0 ? (bet.total_no / totalPool) * 100 : 50;
  const deadlineDate = new Date(bet.deadline * 1000);
  const now = new Date();
  const isExpired = deadlineDate < now;

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8 hero-bg">
      <div className="mx-auto max-w-4xl">
        {/* Back Link */}
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-white transition-colors mb-6 inline-block"
        >
          ← Back to Markets
        </Link>

        {/* ═══ BET HEADER ═══ */}
        <div className="glass-card p-6 mb-6 animate-fade-in">
          {/* Status */}
          <div className="mb-4">
            {bet.settled ? (
              <span className="badge badge-settled">✅ Settled: {bet.outcome}</span>
            ) : isExpired ? (
              <span className="badge badge-pending">⏰ Ready to Settle</span>
            ) : (
              <span className="badge badge-active">🔴 Active</span>
            )}
          </div>

          {/* Question */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {bet.question}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <span>📅</span>
              <span>
                Deadline:{" "}
                {deadlineDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>👤</span>
              <span>
                Creator: {bet.creator.slice(0, 6)}...{bet.creator.slice(-4)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>🆔</span>
              <span>Bet #{bet.bet_id}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ═══ LEFT COLUMN: Pool & Details ═══ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pool Visualization */}
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <h2 className="text-lg font-semibold text-white mb-4">
                💰 Pool Distribution
              </h2>

              <div className="space-y-4">
                {/* YES Bar */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-semibold text-emerald-400">
                      👍 YES
                    </span>
                    <span className="text-sm text-gray-300">
                      {bet.total_yes.toLocaleString()} tokens ({yesPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-yes"
                      style={{ width: `${yesPercent}%` }}
                    />
                  </div>
                </div>

                {/* NO Bar */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-semibold text-red-400">
                      👎 NO
                    </span>
                    <span className="text-sm text-gray-300">
                      {bet.total_no.toLocaleString()} tokens ({noPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-no"
                      style={{ width: `${noPercent}%` }}
                    />
                  </div>
                </div>

                {/* Total */}
                <div className="pt-3 border-t border-white/5 flex justify-between">
                  <span className="text-sm text-gray-400">Total Pool</span>
                  <span className="text-sm font-bold gradient-text-gold">
                    {totalPool.toLocaleString()} tokens
                  </span>
                </div>
              </div>
            </div>

            {/* AI Reasoning (if settled) */}
            {bet.settled && bet.reason && (
              <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <span>🤖</span> AI Analysis
                  {bet.confidence > 0 && (
                    <span className="text-sm font-normal text-purple-300">
                      ({bet.confidence}% confidence)
                    </span>
                  )}
                </h2>
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                  <p className="text-sm text-purple-200 leading-relaxed">
                    {bet.reason}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This analysis was performed by GenLayer AI validators reading
                  real news sources and reaching consensus.
                </p>
              </div>
            )}

            {/* Settlement Outcome (if settled) */}
            {bet.settled && (
              <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <h2 className="text-lg font-semibold text-white mb-4">
                  🏆 Final Outcome
                </h2>
                <div
                  className={`p-6 rounded-xl text-center ${
                    bet.outcome === "YES"
                      ? "bg-emerald-500/10 border border-emerald-500/30"
                      : "bg-red-500/10 border border-red-500/30"
                  }`}
                >
                  <div className="text-4xl mb-2">
                    {bet.outcome === "YES" ? "✅" : "❌"}
                  </div>
                  <div
                    className={`text-3xl font-extrabold ${
                      bet.outcome === "YES"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {bet.outcome}
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {bet.outcome === "YES" ? "YES" : "NO"} side wins the pool
                  </p>
                </div>

                {/* Claim Button */}
                <div className="mt-4">
                  <button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    {claiming ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Claiming...
                      </>
                    ) : (
                      <>💸 Claim Winnings</>
                    )}
                  </button>
                  {claimResult && (
                    <div className="mt-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
                      ✅ {claimResult}
                    </div>
                  )}
                  {claimError && (
                    <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                      ⚠️ {claimError}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT COLUMN: Actions ═══ */}
          <div className="space-y-6">
            {/* Stake Form (only if not settled) */}
            {!bet.settled && (
              <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
                <StakeForm
                  betId={betId}
                  disabled={bet.settled}
                  onStakeComplete={fetchBet}
                />
              </div>
            )}

            {/* Settle Button (only if expired and not settled) */}
            {!bet.settled && (
              <div className="animate-fade-in" style={{ animationDelay: "0.25s" }}>
                <SettleButton
                  betId={betId}
                  settled={bet.settled}
                  onSettleComplete={fetchBet}
                />
              </div>
            )}

            {/* Bet Info Card */}
            <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: "0.35s" }}>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                ℹ️ How This Works
              </h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">1.</span>
                  Stake tokens on YES or NO
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">2.</span>
                  After deadline, anyone can trigger AI settlement
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">3.</span>
                  AI reads real news from multiple sources
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">4.</span>
                  GenLayer validators reach consensus
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">5.</span>
                  Winners claim proportional share of pool
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
