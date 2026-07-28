"use client";

import { useState } from "react";
import { connectWallet } from "@/lib/contract";

export default function WalletButton() {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    setError("");
    try {
      setAddress(await connectWallet());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleConnect}
        disabled={connecting}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10 disabled:opacity-50"
      >
        {connecting
          ? "Connecting..."
          : address
            ? `${address.slice(0, 6)}...${address.slice(-4)}`
            : "Connect Wallet"}
      </button>
      {error && (
        <div className="absolute right-0 top-11 z-50 w-72 rounded-lg border border-red-500/30 bg-[#14030a] p-3 text-xs text-red-300 shadow-xl">
          {error}
        </div>
      )}
    </div>
  );
}
