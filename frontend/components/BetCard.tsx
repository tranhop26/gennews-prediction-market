"use client";

import Link from "next/link";
import type { Bet } from "@/lib/contract";
import { calculateOdds, formatGenAmount } from "@/lib/amounts";

interface BetCardProps {
  bet: Bet;
  index?: number;
}

export default function BetCard({ bet, index = 0 }: BetCardProps) {
  const totalPool = BigInt(bet.total_yes) + BigInt(bet.total_no);
  const { yes: yesPercent, no: noPercent } = calculateOdds(
    bet.total_yes,
    bet.total_no,
  );

  const deadlineDate = new Date(bet.deadline * 1000);
  const now = new Date();
  const isExpired = deadlineDate < now;

  const getStatusBadge = () => {
    if (bet.settled) {
      return (
        <span className="badge badge-settled">
          ✅ Settled: {bet.outcome}
        </span>
      );
    }
    if (isExpired) {
      return <span className="badge badge-pending">⏰ Ready to Settle</span>;
    }
    return <span className="badge badge-active">🔴 Active</span>;
  };

  return (
    <Link href={`/bet/${bet.bet_id}`}>
      <div
        className={`glass-card p-5 cursor-pointer animate-slide-up stagger-${Math.min(index + 1, 4)}`}
      >
        {/* Status Badge */}
        <div className="mb-3">{getStatusBadge()}</div>

        {/* Question */}
        <h3 className="text-lg font-semibold text-white mb-4 leading-snug line-clamp-2">
          {bet.question}
        </h3>

        {/* Pool Distribution */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-emerald-400">YES {yesPercent.toFixed(0)}%</span>
            <span className="text-red-400">NO {noPercent.toFixed(0)}%</span>
          </div>
          <div className="progress-bar-container flex">
            <div
              className="progress-bar-yes"
              style={{ width: `${yesPercent}%` }}
            />
            <div
              className="progress-bar-no"
              style={{ width: `${noPercent}%` }}
            />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <span>💰</span>
            <span className="font-medium text-gray-300">
              {formatGenAmount(totalPool)} GEN
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span>
              {deadlineDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* AI Badge */}
        {bet.settled && bet.reason && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-xs text-purple-300 line-clamp-2">
              🤖 {bet.confidence > 0 && `(${bet.confidence}%) `}{bet.reason}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
