"use client";

import { useMemo } from "react";
import { useBestScore } from "@/components/useBestScore";
import { useOnchainPlayerStats } from "@/components/useOnchainPlayerStats";
import { activeChain, getExplorerAddressUrl } from "@/config/chains";
import {
  getBlueRiftContractAddress,
} from "@/config/contracts";

const mockScores = [
  { name: "NEON-7", score: 1260 },
  { name: "PIXELJET", score: 1125 },
  { name: "ORBIT-03", score: 980 },
  { name: "STARBYTE", score: 835 },
  { name: "VOIDRUN", score: 720 },
];

type LeaderboardProps = {
  bestScoreOverride?: number;
};

export function Leaderboard({ bestScoreOverride }: LeaderboardProps) {
  const storedBestScore = useBestScore();
  const { isActiveChain, isConfigured, isConnected, stats } = useOnchainPlayerStats();
  const scoresAddress = getBlueRiftContractAddress(activeChain.id);
  const contractUrl = scoresAddress ? getExplorerAddressUrl(activeChain.id, scoresAddress) : undefined;
  const bestScore = bestScoreOverride ?? storedBestScore;
  const onchainStatus = !isConfigured
    ? "Contract not configured"
    : !isConnected
      ? "Connect wallet for onchain score"
      : !isActiveChain
        ? `Switch to ${activeChain.name}`
        : stats && stats.runs > 0
          ? `${stats.runs} onchain run${stats.runs === 1 ? "" : "s"} saved`
          : "No onchain runs yet";

  const rows = useMemo(() => {
    const localRow = { kind: "local", name: "YOU LOCAL", score: bestScore };
    const onchainRow =
      stats && stats.runs > 0
        ? { kind: "onchain", name: "YOU ONCHAIN", score: stats.bestScore }
        : null;

    return [...mockScores.map((row) => ({ ...row, kind: "mock" })), localRow, onchainRow]
      .filter((row): row is { kind: string; name: string; score: number } => Boolean(row))
      .sort((a, b) => b.score - a.score)
      .map((row, index) => ({ ...row, rank: index + 1 }));
  }, [bestScore, stats]);

  return (
    <div className="retro-panel overflow-hidden rounded-md">
      <div className="grid gap-3 border-b border-cyan-300/20 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
        <div>
          <div className="font-mono text-xs font-black uppercase text-cyan-100">
            Score sources
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Local browser best is always shown. Self-reported {activeChain.name} profile data appears when connected.
          </p>
        </div>
        <div className="grid gap-2 sm:justify-items-end">
          <div className="rounded-sm border border-white/10 bg-slate-950/35 px-3 py-2 font-mono text-xs font-black uppercase text-slate-200">
            {onchainStatus}
          </div>
          {contractUrl ? (
            <a
              href={contractUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs font-black uppercase text-cyan-100 transition hover:text-white"
            >
              Contract configured
            </a>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-[56px_1fr_88px] border-b border-cyan-300/20 px-4 py-4 font-mono text-xs font-black uppercase text-slate-400 sm:grid-cols-[80px_1fr_140px] sm:px-5">
        <span>Rank</span>
        <span>Pilot</span>
        <span className="text-right">Score</span>
      </div>
      <div>
        {rows.map((row) => (
          <div
            key={`${row.name}-${row.rank}`}
            className={[
              "grid grid-cols-[56px_1fr_88px] items-center border-b border-white/5 px-4 py-4 last:border-b-0 sm:grid-cols-[80px_1fr_140px] sm:px-5",
              row.kind === "onchain"
                ? "bg-lime-300/10 text-lime-100 shadow-[0_0_0_1px_rgba(190,242,100,0.12)_inset]"
                : row.kind === "local"
                ? "bg-cyan-300/10 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.1)_inset]"
                : "text-slate-200",
            ].join(" ")}
          >
            <span className="font-mono text-sm font-black">#{row.rank}</span>
            <span className="truncate font-mono text-sm font-black uppercase">
              {row.name}
            </span>
            <span className="text-right font-mono text-lg font-black">{row.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
