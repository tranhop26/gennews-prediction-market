"use client";

import { useState } from "react";
import { settleBet } from "@/lib/contract";

interface SettleButtonProps {
  betId: number;
  settled: boolean;
  onSettleComplete?: () => void;
}

export default function SettleButton({
  betId,
  settled,
  onSettleComplete,
}: SettleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const handleSettle = async () => {
    setLoading(true);
    setError("");
    setResult("");

    try {
      await settleBet(betId);
      setResult("AI settlement complete! Refresh to see results.");
      onSettleComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Settlement failed");
    } finally {
      setLoading(false);
    }
  };

  if (settled) {
    return null;
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <span>🤖</span> AI Settlement
      </h3>

      <p className="text-sm text-gray-400">
        Trigger AI to read real news sources and determine the bet outcome.
        GenLayer validators will reach consensus using multiple AI models.
      </p>

      <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
        <div className="flex items-start gap-2">
          <span className="text-purple-400 text-sm mt-0.5">ℹ️</span>
          <div className="text-xs text-purple-300 space-y-1">
            <p>
              <strong>How it works:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-purple-300/80">
              <li>AI fetches news from Reuters, Bloomberg, CoinDesk...</li>
              <li>AI analyzes whether the event has occurred</li>
              <li>Multiple validators reach consensus</li>
              <li>Outcome is recorded on-chain</li>
            </ol>
            <p className="text-purple-400/60 mt-1">
              ⏱️ This may take 1-2 minutes
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSettle}
        disabled={loading}
        className="w-full btn-settle disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            AI is reading news... (1-2 min)
          </>
        ) : (
          <>🧠 Settle with AI</>
        )}
      </button>

      {/* Loading Animation */}
      {loading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-yellow-300/80">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Fetching news from multiple sources...
          </div>
          <div className="flex items-center gap-2 text-xs text-yellow-300/60">
            <div className="w-2 h-2 rounded-full bg-yellow-400/60 animate-pulse" style={{ animationDelay: "0.5s" }} />
            AI analyzing evidence...
          </div>
          <div className="flex items-center gap-2 text-xs text-yellow-300/40">
            <div className="w-2 h-2 rounded-full bg-yellow-400/40 animate-pulse" style={{ animationDelay: "1s" }} />
            Validators reaching consensus...
          </div>
        </div>
      )}

      {/* Results */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}
      {result && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
          ✅ {result}
        </div>
      )}
    </div>
  );
}
