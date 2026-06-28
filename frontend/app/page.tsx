"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BetCard from "@/components/BetCard";
import type { Bet, Stats } from "@/lib/contract";
import { getAllBets, getStats } from "@/lib/contract";

export default function HomePage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [betsData, statsData] = await Promise.all([
          getAllBets(),
          getStats(),
        ]);
        setBets(betsData);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="hero-bg">
      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="relative px-4 pt-20 pb-16 sm:px-6 lg:px-8">
        {/* Background decoration */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300 border border-purple-500/20">
            <span className="animate-pulse">🔴</span>
            <span>Powered by GenLayer AI Validators</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl mb-6">
            <span className="text-white">Predict the Future.</span>
            <br />
            <span className="gradient-text">AI Reads the News.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-gray-400 mb-10 leading-relaxed">
            The first prediction market that auto-settles using AI reading real
            news on-chain. No oracles, no voting, no intermediaries.{" "}
            <span className="text-purple-300">
              GenLayer&apos;s AI validators
            </span>{" "}
            read Reuters, Bloomberg &amp; CoinDesk to determine outcomes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/create" className="btn-primary text-lg !px-8 !py-3.5">
              🚀 Create a Bet
            </Link>
            <a
              href="#markets"
              className="px-8 py-3.5 text-lg font-semibold text-gray-300 rounded-xl border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all"
            >
              Explore Markets ↓
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════ WHY GENLAYER ═══════════════════ */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: "🌐",
                title: "AI Reads Real News",
                desc: "gl.nondet.web.render() fetches live pages from Reuters, Bloomberg, CoinDesk — directly on-chain.",
              },
              {
                icon: "🧠",
                title: "AI Judges Outcomes",
                desc: "gl.nondet.exec_prompt() lets AI analyze news content and determine if events have occurred.",
              },
              {
                icon: "⚖️",
                title: "Validator Consensus",
                desc: "prompt_comparative() ensures multiple AI validators agree on the outcome — no single point of failure.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="glass-card p-5 text-center animate-slide-up"
                style={{ animationDelay: `${i * 0.15}s`, opacity: 0 }}
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ STATS BAR ═══════════════════ */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="glass-card p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              {
                label: "Total Bets",
                value: stats?.total_bets ?? "—",
                icon: "📊",
              },
              {
                label: "Total Volume",
                value: stats
                  ? `${stats.total_volume.toLocaleString()}`
                  : "—",
                icon: "💰",
              },
              {
                label: "Settled",
                value: bets.filter(b => b.settled).length,
                icon: "✅",
              },
              {
                label: "Active",
                value: bets.filter(b => !b.settled).length,
                icon: "🔴",
              },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold text-white">
                  {loading ? (
                    <div className="skeleton h-8 w-16 mx-auto" />
                  ) : (
                    s.value
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ MARKETS ═══════════════════ */}
      <section id="markets" className="px-4 py-12 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">
              🗞️ Prediction Markets
            </h2>
            <Link
              href="/create"
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              + Create New
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-5 space-y-4">
                  <div className="skeleton h-5 w-24" />
                  <div className="skeleton h-12 w-full" />
                  <div className="skeleton h-3 w-full" />
                  <div className="flex justify-between">
                    <div className="skeleton h-4 w-20" />
                    <div className="skeleton h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : bets.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="text-5xl mb-4">🏜️</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No markets yet
              </h3>
              <p className="text-gray-400 mb-6">
                Be the first to create a prediction market!
              </p>
              <Link href="/create" className="btn-primary">
                🚀 Create First Bet
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bets.map((bet, i) => (
                <BetCard key={bet.bet_id} bet={bet} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
