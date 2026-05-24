"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Leaderboard } from "@/components/Leaderboard";
import { OnchainRunSummary } from "@/components/OnchainRunSummary";
import { RetroButton } from "@/components/RetroButton";
import { SaveScoreButton } from "@/components/SaveScoreButton";
import { StartOnchainRunButton } from "@/components/StartOnchainRunButton";
import { readBestScore, useBestScore, writeBestScore } from "@/components/useBestScore";
import { activeChain } from "@/config/chains";
import type { SpaceRunnerResult } from "@/game/types";

type TouchControlAction = "up" | "down" | "left" | "right" | "fire" | "pause";

const shareUrl = "https://blue-rift.vercel.app/game";

const emitTouchControl = (action: TouchControlAction, active: boolean) => {
  window.dispatchEvent(
    new CustomEvent("space-runner-control", {
      detail: { action, active },
    }),
  );
};

function ControlButton({
  action,
  children,
  className = "",
  pulse = false,
}: {
  action: TouchControlAction;
  children: ReactNode;
  className?: string;
  pulse?: boolean;
}) {
  const press = () => emitTouchControl(action, true);
  const release = () => emitTouchControl(action, false);

  return (
    <button
      type="button"
      aria-label={`${action} control`}
      className={[
        "flex h-14 min-w-14 select-none items-center justify-center rounded-md border font-mono text-xs font-black uppercase text-slate-100 shadow-[0_12px_34px_rgba(0,0,0,0.24)] transition active:scale-95",
        pulse
          ? "border-cyan-200 bg-cyan-200 text-slate-950 shadow-[0_0_26px_rgba(34,211,238,0.32)]"
          : "border-slate-500/60 bg-slate-950/70",
        className,
      ].join(" ")}
      onContextMenu={(event) => event.preventDefault()}
      onPointerCancel={release}
      onPointerDown={press}
      onPointerLeave={release}
      onPointerUp={release}
    >
      {children}
    </button>
  );
}

function MobileControls() {
  return (
    <div className="retro-panel grid gap-4 rounded-md p-4 xl:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-mono text-sm font-black uppercase text-cyan-100">Touch controls</h2>
          <p className="mt-1 text-sm text-slate-400">Boost adds speed and score rate</p>
        </div>
        <ControlButton action="pause" className="h-12 min-w-20 border-amber-200/40 text-amber-100">
          Pause
        </ControlButton>
      </div>

      <div className="grid grid-cols-[minmax(9.5rem,1fr)_minmax(5.75rem,7rem)] items-end gap-4 sm:grid-cols-[1fr_112px] sm:gap-5">
        <div className="grid w-full max-w-44 grid-cols-3 gap-2">
          <div />
          <ControlButton action="up">Up</ControlButton>
          <div />
          <ControlButton action="left">Left</ControlButton>
          <div className="h-14 rounded-md border border-slate-700/60 bg-slate-950/30" />
          <ControlButton action="right">Right</ControlButton>
          <div />
          <ControlButton action="down">Down</ControlButton>
          <div />
        </div>

        <ControlButton action="fire" className="h-24 min-w-0 rounded-md sm:h-28 sm:min-w-28" pulse>
          Boost
        </ControlButton>
      </div>
    </div>
  );
}

function ShareScoreButton({ result }: { result: SpaceRunnerResult }) {
  const [status, setStatus] = useState<"idle" | "shared" | "copied" | "failed">("idle");
  const shareText = `I scored ${result.score} in Blue Rift: Endless Tunnel.`;

  const shareScore = async () => {
    setStatus("idle");

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Blue Rift score",
          text: shareText,
          url: shareUrl,
        });
        setStatus("shared");
        return;
      }

      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setStatus("copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setStatus("failed");
    }
  };

  const label =
    status === "copied"
      ? "Copied"
      : status === "shared"
        ? "Shared"
        : status === "failed"
          ? "Share failed"
          : "Share score";

  return (
    <button
      type="button"
      onClick={shareScore}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-cyan-300/35 bg-cyan-300/10 px-3 font-mono text-xs font-black uppercase text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/18 hover:text-white"
    >
      {label}
    </button>
  );
}

function GameOverPanel({
  bestScore,
  result,
  restart,
}: {
  bestScore: number;
  result: SpaceRunnerResult;
  restart: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-md rounded-md border border-fuchsia-300/40 bg-slate-950/95 p-3 text-center shadow-[0_0_50px_rgba(251,77,255,0.22)] sm:p-6">
      <p className="font-mono text-xs font-black uppercase text-fuchsia-200 sm:text-sm">
        Tunnel breach
      </p>
      <h2 className="mt-1 text-2xl font-black uppercase text-white sm:mt-2 sm:text-3xl">
        Game Over
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4">
        <div className="rounded-md border border-cyan-300/25 p-3 sm:p-4">
          <div className="font-mono text-xs uppercase text-slate-400">
            Final
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-cyan-100 sm:text-3xl">
            {result.score}
          </div>
        </div>
        <div className="rounded-md border border-lime-300/25 p-3 sm:p-4">
          <div className="font-mono text-xs uppercase text-slate-400">
            Best
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-lime-200 sm:text-3xl">
            {bestScore}
          </div>
        </div>
      </div>
      <SaveScoreButton result={result} />
      <OnchainRunSummary result={result} />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <RetroButton onClick={restart} variant="secondary" className="w-full px-3 text-xs">
          Restart
        </RetroButton>
        <ShareScoreButton result={result} />
      </div>
    </div>
  );
}

export function GameShell() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<{ destroy: () => void } | null>(null);
  const [runId, setRunId] = useState(1);
  const [result, setResult] = useState<SpaceRunnerResult | null>(null);
  const storedBestScore = useBestScore();
  const [sessionBestScore, setSessionBestScore] = useState(0);
  const bestScore = Math.max(storedBestScore, sessionBestScore);

  const handleGameOver = useCallback((nextResult: SpaceRunnerResult) => {
    const currentBest = readBestScore();
    const nextBest = Math.max(currentBest, nextResult.score);
    writeBestScore(nextBest);
    setSessionBestScore(nextBest);
    setResult(nextResult);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function startGame() {
      if (!containerRef.current) {
        return;
      }

      const { createEndlessTunnelGame } = await import("@/game/EndlessTunnelGame");

      if (cancelled || !containerRef.current) {
        return;
      }

      gameRef.current?.destroy();
      gameRef.current = createEndlessTunnelGame({
        parent: containerRef.current,
        onGameOver: handleGameOver,
      });
    }

    startGame();

    return () => {
      cancelled = true;
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [handleGameOver, runId]);

  const restart = () => {
    setResult(null);
    setRunId((value) => value + 1);
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="retro-panel relative overflow-hidden rounded-md p-2 sm:p-3">
        <div
          ref={containerRef}
          className="pixelated scanline mx-auto aspect-video w-full max-w-[1280px] overflow-hidden rounded-sm border border-cyan-300/30 bg-slate-950"
        />

        {result ? (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/88 px-3 py-4 backdrop-blur-sm sm:absolute sm:inset-3 sm:z-10 sm:flex sm:items-center sm:justify-center sm:overflow-y-auto sm:px-4 sm:py-6">
            <div className="flex min-h-full items-start justify-center py-2 pb-8 sm:min-h-0 sm:items-center sm:py-0">
              <GameOverPanel bestScore={bestScore} result={result} restart={restart} />
            </div>
          </div>
        ) : null}
      </div>

      <MobileControls />

      <aside className="space-y-6">
        <div className="retro-panel rounded-md p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-sm font-black uppercase text-cyan-100">
              Mission
            </h2>
            <span className="rounded-sm border border-amber-200/30 px-2 py-1 font-mono text-xs font-black uppercase text-amber-100">
              3 lives
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Launch after the countdown, dodge red blockers, collect green energy,
            grab rare INK repairs, and keep moving as the tunnel accelerates.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 font-mono text-xs uppercase text-slate-300">
            <div className="rounded-md border border-white/10 p-3">Arrows</div>
            <div className="rounded-md border border-white/10 p-3">WASD</div>
            <div className="rounded-md border border-white/10 p-3">Touch pad</div>
            <div className="rounded-md border border-white/10 p-3">Boost = faster scoring</div>
          </div>
          <div className="mt-4 rounded-md border border-fuchsia-300/20 bg-fuchsia-300/5 p-3 font-mono text-xs uppercase text-fuchsia-100">
            Red blockers can cut through center lanes. Green shards score. INK repairs restore one life.
          </div>
        </div>
        <div className="retro-panel rounded-md p-5">
          <div className="mb-4">
            <h2 className="font-mono text-sm font-black uppercase text-cyan-100">
              Onchain mode
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Register a start tx before launch if you want the run counted in your {activeChain.name} profile.
            </p>
          </div>
          <StartOnchainRunButton onStartedHref="/game" />
        </div>
        <Leaderboard bestScoreOverride={bestScore} />
      </aside>
    </section>
  );
}
