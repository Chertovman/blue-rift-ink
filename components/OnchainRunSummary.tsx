"use client";

import { useOnchainPlayerStats } from "@/components/useOnchainPlayerStats";
import { activeChain } from "@/config/chains";
import type { SpaceRunnerResult } from "@/game/types";

type OnchainRunSummaryProps = {
  result: SpaceRunnerResult;
};

const ACHIEVEMENT_SCORE = 1_000;

export function OnchainRunSummary({ result }: OnchainRunSummaryProps) {
  const { error, isActiveChain, isConfigured, isConnected, isLoading, stats } =
    useOnchainPlayerStats();

  if (!isConfigured) {
    return null;
  }

  if (!isConnected) {
    return (
      <p className="mt-4 rounded-md border border-cyan-300/20 bg-cyan-300/5 p-3 text-sm leading-6 text-cyan-100">
        Connect wallet to compare this run with saved {activeChain.name} profile stats.
      </p>
    );
  }

  if (!isActiveChain) {
    return (
      <p className="mt-4 rounded-md border border-amber-200/25 bg-amber-200/5 p-3 text-sm leading-6 text-amber-100">
        Switch to {activeChain.name} to compare this run onchain.
      </p>
    );
  }

  if (isLoading) {
    return (
      <p className="mt-4 rounded-md border border-white/10 bg-slate-950/35 p-3 text-sm text-slate-300">
        Loading saved best...
      </p>
    );
  }

  if (error) {
    return (
      <p className="mt-4 rounded-md border border-fuchsia-300/25 bg-fuchsia-300/5 p-3 text-sm leading-6 text-fuchsia-100">
        Could not load saved best.
      </p>
    );
  }

  const onchainBest = stats?.bestScore ?? 0;
  const isNewBest = result.score > onchainBest;
  const isAchievementRun = result.score >= ACHIEVEMENT_SCORE;
  const isAchievementSaved = Boolean(stats?.reachedOneThousand);
  const achievementLabel = isAchievementSaved
    ? "Achievement saved onchain"
    : isAchievementRun
      ? "Achievement ready to save"
      : `${ACHIEVEMENT_SCORE - result.score} points to achievement`;

  return (
    <div className="mt-3 rounded-md border border-white/10 bg-slate-950/35 p-3 text-left sm:p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="font-mono text-xs uppercase text-slate-400">Saved best</div>
          <div className="mt-1 font-mono text-xl font-black text-lime-200 sm:text-2xl">
            {onchainBest}
          </div>
        </div>
        <div>
          <div className="font-mono text-xs uppercase text-slate-400">Saved runs</div>
          <div className="mt-1 font-mono text-xl font-black text-white sm:text-2xl">
            {stats?.runs ?? 0}
          </div>
        </div>
      </div>
      <p
        className={[
          "mt-3 font-mono text-xs uppercase",
          isNewBest ? "text-cyan-100" : "text-slate-400",
        ].join(" ")}
      >
        {isNewBest ? "New saved best available" : "Below current saved best"}
      </p>
      <div
        className={[
          "mt-3 rounded-sm border px-3 py-2 font-mono text-xs font-black uppercase",
          isAchievementSaved
            ? "border-lime-300/35 bg-lime-300/10 text-lime-100"
            : isAchievementRun
              ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-100"
              : "border-white/10 bg-slate-950/35 text-slate-400",
        ].join(" ")}
      >
        1000+ · {achievementLabel}
      </div>
    </div>
  );
}
