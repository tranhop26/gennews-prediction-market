"use client";

import { useState } from "react";
import { stakeBet } from "@/lib/contract";
import { parseGenAmount } from "@/lib/amounts";

interface StakeFormProps {
  betId: number;
  disabled?: boolean;
  onStakeComplete?: () => void;
}

export default function StakeForm({
  betId,
  disabled = false,
  onStakeComplete,
}: StakeFormProps) {
  const [choice, setChoice] = useState<"YES" | "NO" | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleStake = async () => {
    if (!choice) {
      setError("Please select YES or NO");
      return;
    }
    try {
      parseGenAmount(amount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await stakeBet(betId, choice, amount);
      setSuccess(`Successfully staked ${amount} GEN on ${choice}!`);
      setAmount("");
      setChoice(null);
      onStakeComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stake failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <span>🎯</span> Place Your Stake
      </h3>

      {/* Choice Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setChoice("YES"); setError(""); }}
          disabled={disabled || loading}
          className={`py-3 rounded-xl font-bold text-lg transition-all ${
            choice === "YES"
              ? "btn-yes ring-2 ring-emerald-400/50 scale-[1.02]"
              : "bg-white/5 text-gray-400 border border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          👍 YES
        </button>
        <button
          onClick={() => { setChoice("NO"); setError(""); }}
          disabled={disabled || loading}
          className={`py-3 rounded-xl font-bold text-lg transition-all ${
            choice === "NO"
              ? "btn-no ring-2 ring-red-400/50 scale-[1.02]"
              : "bg-white/5 text-gray-400 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          👎 NO
        </button>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">
          Stake Amount (GEN)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(""); }}
          placeholder="Enter amount..."
          disabled={disabled || loading}
          min="0.000001"
          step="0.000001"
          className="input-glass disabled:opacity-40"
        />
      </div>

      {/* Quick Amount Buttons */}
      <div className="flex gap-2">
        {["0.1", "0.5", "1", "5"].map((val) => (
          <button
            key={val}
            onClick={() => setAmount(String(val))}
            disabled={disabled || loading}
            className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-gray-400 
                       hover:bg-purple-500/10 hover:text-purple-300 border border-white/5 
                       hover:border-purple-500/20 transition-all disabled:opacity-40"
          >
            {val} GEN
          </button>
        ))}
      </div>

      {/* Submit */}
      <button
        onClick={handleStake}
        disabled={disabled || loading || !choice || !amount}
        className="w-full btn-primary disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting...
          </>
        ) : (
          `Stake${choice ? ` on ${choice}` : ""}`
        )}
      </button>

      {/* Feedback */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
          ✅ {success}
        </div>
      )}
    </div>
  );
}
