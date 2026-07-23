"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import BetCard from "@/components/BetCard";
import type { Bet, Stats } from "@/lib/contract";
import { getAllBets, getStats } from "@/lib/contract";

export default function HomePage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "EXPIRED" | "SETTLED" | "UNRESOLVED">("ALL");

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

  const filteredBets = useMemo(() => {
    return bets.filter((bet) => {
      // Search filter
      const matchesSearch =
        bet.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bet.creator.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status filter
      const now = new Date();
      const deadlineDate = new Date(bet.deadline * 1000);
      const isExpired = deadlineDate < now;

      if (statusFilter === "ACTIVE") return !bet.settled && !isExpired;
      if (statusFilter === "EXPIRED") return !bet.settled && isExpired;
      if (statusFilter === "SETTLED") return bet.settled && bet.outcome !== "UNRESOLVED";
      if (statusFilter === "UNRESOLVED") return bet.settled && bet.outcome === "UNRESOLVED";

      return true;
    });
  }, [bets, searchQuery, statusFilter]);

  return (
    <div className="hero-bg min-h-screen">
      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="relative px-4 pt-20 pb-16 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gradient-to-tr from-purple-600/15 via-indigo-500/10 to-blue-500/10 blur-[130px] pointer-events-none" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-purple-300 border border-purple-500/30 backdrop-blur-md shadow-lg shadow-purple-500/5">
            <span className="animate-pulse text-purple-400">🔴</span>
            <span>Powered by GenLayer Intelligent Contracts &amp; AI Consensus</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl mb-6">
            <span className="text-white">Predict the Future.</span>
            <br />
            <span className="gradient-text">AI Reads the News.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-gray-300 mb-10 leading-relaxed font-normal">
            The first prediction market that auto-settles using AI reading real
            news on-chain. No human oracles, no voting, no central authority.{" "}
            <span className="text-purple-300 font-semibold">
              GenLayer&apos;s AI validators
            </span>{" "}
            read Reuters, Bloomberg &amp; CoinDesk to deliver decentralized consensus.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/create" className="btn-primary text-lg !px-8 !py-3.5 shadow-xl shadow-purple-500/20">
              🚀 Create a Bet
            </Link>
            <a
              href="#markets"
              className="px-8 py-3.5 text-lg font-semibold text-gray-300 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-md"
            >
              Explore Markets ↓
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES GRID ═══════════════════ */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🌐",
                title: "Live Web Access",
                desc: "gl.nondet.web.render() fetches real-time news articles from Reuters, Bloomberg & CoinDesk on-chain.",
              },
              {
                icon: "🧠",
                title: "AI Semantic Judgment",
                desc: "gl.nondet.exec_prompt() uses LLM intelligence to evaluate evidence and judge prediction outcomes.",
              },
              {
                icon: "⚖️",
                title: "Validator Consensus",
                desc: "prompt_comparative() requires multiple validator nodes to reach semantic agreement before settlement.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="glass-card p-6 text-center hover:border-purple-500/30 transition-all duration-300 group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ STATS DASHBOARD ═══════════════════ */}
      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="glass-card p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center border-purple-500/20">
            {[
              {
                label: "Total Markets",
                value: stats?.total_bets ?? "—",
                icon: "📊",
              },
              {
                label: "Total Volume",
                value: stats
                  ? `${stats.total_volume.toLocaleString()} GEN`
                  : "—",
                icon: "💰",
              },
              {
                label: "AI Settled",
                value: bets.filter((b) => b.settled).length,
                icon: "✅",
              },
              {
                label: "Active Markets",
                value: bets.filter((b) => !b.settled).length,
                icon: "🔴",
              },
            ].map((s, i) => (
              <div key={i} className="p-2">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  {loading ? (
                    <div className="skeleton h-8 w-20 mx-auto" />
                  ) : (
                    s.value
                  )}
                </div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ MARKETS SECTION ═══════════════════ */}
      <section id="markets" className="px-4 py-12 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                🗞️ Prediction Markets
              </h2>
              <p className="text-sm text-gray-400">
                Browse, stake, or trigger AI settlement on open markets
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search question..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                />
              </div>

              <Link
                href="/create"
                className="btn-primary text-sm !px-4 !py-2 shrink-0"
              >
                + Create New
              </Link>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-white/5">
            {[
              { id: "ALL", label: "All Markets", count: bets.length },
              {
                id: "ACTIVE",
                label: "🔴 Active",
                count: bets.filter((b) => {
                  const isExpired = new Date(b.deadline * 1000) < new Date();
                  return !b.settled && !isExpired;
                }).length,
              },
              {
                id: "EXPIRED",
                label: "⏰ Ready to Settle",
                count: bets.filter((b) => {
                  const isExpired = new Date(b.deadline * 1000) < new Date();
                  return !b.settled && isExpired;
                }).length,
              },
              {
                id: "SETTLED",
                label: "✅ Settled",
                count: bets.filter((b) => b.settled && b.outcome !== "UNRESOLVED").length,
              },
              {
                id: "UNRESOLVED",
                label: "⚠️ Unresolved",
                count: bets.filter((b) => b.settled && b.outcome === "UNRESOLVED").length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                  statusFilter === tab.id
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Markets List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-6 space-y-4">
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
          ) : filteredBets.length === 0 ? (
            <div className="glass-card p-12 text-center border-purple-500/10">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No markets found
              </h3>
              <p className="text-gray-400 mb-6 text-sm">
                {searchQuery
                  ? "Try matching your search term with another question."
                  : "No prediction markets match the selected filter."}
              </p>
              <Link href="/create" className="btn-primary">
                🚀 Create Prediction Market
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBets.map((bet, i) => (
                <BetCard key={bet.bet_id} bet={bet} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
