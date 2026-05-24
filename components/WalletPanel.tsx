"use client";

import { useEffect, useRef, useState } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { RetroButton } from "@/components/RetroButton";
import { useOnchainPlayerStats } from "@/components/useOnchainPlayerStats";
import { activeChain } from "@/config/chains";

function isVisibleConnector(walletConnector: { id: string; name: string }) {
  if (activeChain.name === "Base") {
    return true;
  }

  const connectorLabel = `${walletConnector.id} ${walletConnector.name}`.toLowerCase();
  return !connectorLabel.includes("base");
}

function formatAddress(address: `0x${string}`) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function OnchainStats() {
  const { error, isActiveChain, isConfigured, isLoading, stats } = useOnchainPlayerStats();

  if (!isConfigured) {
    return null;
  }

  if (!isActiveChain) {
    return (
      <p className="rounded-md border border-amber-200/25 bg-amber-200/5 p-3 text-sm leading-6 text-amber-100">
        Switch to {activeChain.name} to load profile stats.
      </p>
    );
  }

  if (isLoading) {
    return (
      <p className="rounded-md border border-white/10 bg-slate-950/35 p-3 text-sm text-slate-300">
        Loading onchain profile...
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-md border border-fuchsia-300/25 bg-fuchsia-300/5 p-3 text-sm leading-6 text-fuchsia-100">
        Could not load onchain stats.
      </p>
    );
  }

  const bestScore = stats?.bestScore ?? 0;
  const runs = stats?.runs ?? 0;
  const survivedSeconds = stats?.lastSurvivedSeconds ?? 0;
  const reachedOneThousand = Boolean(stats?.reachedOneThousand);

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-md border border-white/10 bg-slate-950/35 p-3">
        <div className="font-mono text-[0.68rem] uppercase text-slate-400">Best</div>
        <div className="mt-1 font-mono text-lg font-black text-cyan-100">{bestScore}</div>
      </div>
      <div className="rounded-md border border-white/10 bg-slate-950/35 p-3">
        <div className="font-mono text-[0.68rem] uppercase text-slate-400">Runs</div>
        <div className="mt-1 font-mono text-lg font-black text-white">{runs}</div>
      </div>
      <div className="rounded-md border border-white/10 bg-slate-950/35 p-3">
        <div className="font-mono text-[0.68rem] uppercase text-slate-400">1000+</div>
        <div
          className={[
            "mt-1 font-mono text-lg font-black",
            reachedOneThousand ? "text-lime-200" : "text-slate-500",
          ].join(" ")}
        >
          {reachedOneThousand ? "Yes" : "No"}
        </div>
      </div>
      {runs > 0 ? (
        <p className="col-span-3 font-mono text-xs uppercase text-slate-400">
          Last survival: {survivedSeconds}s
        </p>
      ) : null}
    </div>
  );
}

export function WalletPanel() {
  const { address, connector, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, error: connectError, isPending, variables } = useConnect();
  const { disconnect } = useDisconnect();
  const {
    error: switchError,
    isPending: isSwitching,
    switchChain,
  } = useSwitchChain();

  const isActiveChain = chainId === activeChain.id;
  const activeError = connectError ?? switchError;

  return (
    <section className="retro-panel rounded-md p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-mono text-sm font-black uppercase text-cyan-100">
            {activeChain.name} wallet
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Connect before saving self-reported achievements or best scores on {activeChain.name}.
          </p>
        </div>
        <span
          className={[
            "shrink-0 rounded-sm border px-2 py-1 font-mono text-xs font-black uppercase",
            isConnected
              ? isActiveChain
                ? "border-lime-200/40 text-lime-100"
                : "border-amber-200/40 text-amber-100"
              : "border-slate-500/60 text-slate-300",
          ].join(" ")}
        >
          {isConnected ? (isActiveChain ? "Ready" : "Wrong net") : "Offline"}
        </span>
      </div>

      {isConnected && address ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-md border border-white/10 bg-slate-950/35 p-4">
            <div className="font-mono text-xs uppercase text-slate-400">Connected</div>
            <div className="mt-2 font-mono text-base font-black text-white">
              {formatAddress(address)}
            </div>
            <div className="mt-1 text-sm text-slate-400">{connector?.name ?? "Wallet"}</div>
          </div>

          {!isActiveChain ? (
            <RetroButton
              type="button"
              className="w-full"
              onClick={() => switchChain({ chainId: activeChain.id })}
              disabled={isSwitching}
            >
              {isSwitching ? "Switching..." : `Switch to ${activeChain.name}`}
            </RetroButton>
          ) : null}

          <RetroButton
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => disconnect()}
          >
            Disconnect
          </RetroButton>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {connectors.filter(isVisibleConnector).map((walletConnector) => (
            <RetroButton
              key={`${walletConnector.id}-${walletConnector.name}`}
              type="button"
              variant={walletConnector.id.includes("base") ? "primary" : "secondary"}
              className="w-full"
              onClick={() => connect({ connector: walletConnector, chainId: activeChain.id })}
              disabled={isPending}
            >
              {isPending && variables?.connector === walletConnector
                ? "Connecting..."
                : walletConnector.name}
            </RetroButton>
          ))}
        </div>
      )}

      {activeError ? (
        <p className="mt-4 rounded-md border border-fuchsia-300/25 bg-fuchsia-300/5 p-3 text-sm leading-6 text-fuchsia-100">
          {activeError.message}
        </p>
      ) : null}
    </section>
  );
}

export function WalletProfile() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { address, connector, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, error: connectError, isPending, variables } = useConnect();
  const { disconnect } = useDisconnect();
  const {
    error: switchError,
    isPending: isSwitching,
    switchChain,
  } = useSwitchChain();

  const isActiveChain = chainId === activeChain.id;
  const activeError = connectError ?? switchError;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", closeOnOutsidePress);
    return () => window.removeEventListener("pointerdown", closeOnOutsidePress);
  }, [isOpen]);

  return (
    <div ref={panelRef} className="relative z-30">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={[
          "flex min-h-11 items-center gap-2 rounded-md border bg-slate-950/70 px-3 font-mono text-xs font-black uppercase text-slate-100 transition hover:border-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200",
          isConnected
            ? isActiveChain
              ? "border-lime-200/40"
              : "border-amber-200/50"
            : "border-slate-500/60",
        ].join(" ")}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span
          className={[
            "h-2.5 w-2.5 rounded-full",
            isConnected ? (isActiveChain ? "bg-lime-300" : "bg-amber-300") : "bg-slate-500",
          ].join(" ")}
        />
        <span>{isConnected && address ? formatAddress(address) : "Connect"}</span>
      </button>

      <div
        className={[
          "absolute right-0 top-full w-[min(21rem,calc(100vw-2rem))] pt-3 transition",
          isOpen ? "visible opacity-100" : "invisible opacity-0",
        ].join(" ")}
      >
        <div className="retro-panel rounded-md p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-sm font-black uppercase text-cyan-100">
                {activeChain.name} profile
              </div>
              <div className="mt-1 text-sm text-slate-400">
                {isConnected && address
                  ? `${connector?.name ?? "Wallet"} · ${formatAddress(address)}`
                  : `Connect to ${activeChain.name}`}
              </div>
            </div>
            <span
              className={[
                "rounded-sm border px-2 py-1 font-mono text-xs font-black uppercase",
                isConnected
                  ? isActiveChain
                    ? "border-lime-200/40 text-lime-100"
                    : "border-amber-200/40 text-amber-100"
                  : "border-slate-500/60 text-slate-300",
              ].join(" ")}
            >
              {isConnected ? (isActiveChain ? "Ready" : "Wrong net") : "Offline"}
            </span>
          </div>

          {isConnected ? (
            <div className="mt-4 grid gap-3">
              {address ? <OnchainStats /> : null}

              {!isActiveChain ? (
                <RetroButton
                  type="button"
                  className="w-full"
                  onClick={() => switchChain({ chainId: activeChain.id })}
                  disabled={isSwitching}
                >
                  {isSwitching ? "Switching..." : activeChain.name}
                </RetroButton>
              ) : null}
              <RetroButton
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => disconnect()}
              >
                Disconnect
              </RetroButton>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {connectors.filter(isVisibleConnector).map((walletConnector) => (
                <RetroButton
                  key={`${walletConnector.id}-${walletConnector.name}`}
                  type="button"
                  variant={walletConnector.id.includes("base") ? "primary" : "secondary"}
                  className="w-full"
                  onClick={() => connect({ connector: walletConnector, chainId: activeChain.id })}
                  disabled={isPending}
                >
                  {isPending && variables?.connector === walletConnector
                    ? "Connecting..."
                    : walletConnector.name}
                </RetroButton>
              ))}
            </div>
          )}

          {activeError ? (
            <p className="mt-3 rounded-md border border-fuchsia-300/25 bg-fuchsia-300/5 p-3 text-sm leading-6 text-fuchsia-100">
              {activeError.message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
