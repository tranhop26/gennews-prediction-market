"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBet } from "@/lib/contract";
import { parseGenAmount } from "@/lib/amounts";

export default function CreateBetPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [deadline, setDeadline] = useState("");
  const [initialStake, setInitialStake] = useState("1");
  const [initialChoice, setInitialChoice] = useState<"YES" | "NO">("YES");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }
    if (question.length < 10) {
      setError("Question must be at least 10 characters");
      return;
    }
    if (!deadline) {
      setError("Please set a deadline");
      return;
    }

    const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);
    if (deadlineTimestamp <= now) {
      setError("Deadline must be in the future");
      return;
    }

    try {
      parseGenAmount(initialStake);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid initial stake");
      return;
    }

    setLoading(true);
    try {
      await createBet(
        question.trim(),
        deadlineTimestamp,
        initialStake,
        initialChoice,
      );
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8 hero-bg">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors mb-4 inline-block"
          >
            ← Back to Markets
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            🗞️ Create a Prediction
          </h1>
          <p className="text-gray-400">
            Create a bet about any future event. After the deadline, AI will
            read real news to settle the outcome.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question */}
          <div className="glass-card p-5 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-300 mb-1.5 block">
                🎯 Prediction Question
              </span>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., Will Bitcoin reach $150,000 by Dec 31, 2026?"
                rows={3}
                maxLength={500}
                className="input-glass resize-none"
                disabled={loading}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {question.length}/500
              </div>
            </label>

            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300/80">
              💡 <strong>Tip:</strong> Write a clear YES/NO question. The AI
              will search sources such as Reuters, Bloomberg, AP, BBC, and CNBC to
              determine the answer.
            </div>
          </div>

          {/* Deadline */}
          <div className="glass-card p-5">
            <label className="block">
              <span className="text-sm font-medium text-gray-300 mb-1.5 block">
                📅 Deadline
              </span>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input-glass"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Settlement can only happen after this date
              </p>
            </label>
          </div>

          {/* Initial Position */}
          <div className="glass-card p-5 space-y-4">
            <span className="text-sm font-medium text-gray-300 block">
              🏷️ Your Initial Position
            </span>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInitialChoice("YES")}
                disabled={loading}
                className={`py-4 rounded-xl font-bold text-lg transition-all ${
                  initialChoice === "YES"
                    ? "btn-yes ring-2 ring-emerald-400/50"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400"
                }`}
              >
                👍 YES
              </button>
              <button
                type="button"
                onClick={() => setInitialChoice("NO")}
                disabled={loading}
                className={`py-4 rounded-xl font-bold text-lg transition-all ${
                  initialChoice === "NO"
                    ? "btn-no ring-2 ring-red-400/50"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:bg-red-500/10 hover:text-red-400"
                }`}
              >
                👎 NO
              </button>
            </div>

            <label className="block">
              <span className="text-sm text-gray-400 mb-1.5 block">
                Initial Stake (GEN)
              </span>
              <input
                type="number"
                value={initialStake}
                onChange={(e) => setInitialStake(e.target.value)}
                placeholder="1"
                min="0.000001"
                step="0.000001"
                className="input-glass"
                disabled={loading}
              />
            </label>

            {/* Quick Amounts */}
            <div className="flex gap-2">
              {["0.1", "0.5", "1", "5", "10"].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setInitialStake(String(val))}
                  disabled={loading}
                  className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-gray-400
                             hover:bg-purple-500/10 hover:text-purple-300 border border-white/5
                             hover:border-purple-500/20 transition-all"
                >
                  {val} GEN
                </button>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              🤖 How AI Settlement Works
            </h3>
            <div className="space-y-2">
              {[
                "After deadline, anyone calls settle_bet()",
                "AI reads independent news sources",
                "AI analyzes: has the event occurred?",
                "Multiple GenLayer validators reach consensus",
                "Winners claim proportional share of the total pool",
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-gray-400"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-lg !py-4 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating Bet...
              </>
            ) : (
              <>🚀 Create Prediction Market</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
