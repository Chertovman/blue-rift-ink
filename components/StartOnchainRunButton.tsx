"use client";

import { encodeFunctionData } from "viem";
import type { BaseError } from "wagmi";
import { useAccount, useChainId, useSendTransaction, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import { RetroButton } from "@/components/RetroButton";
import { activeChain, getExplorerTxUrl } from "@/config/chains";
import {
  getBlueRiftContractAddress,
  spaceRunnerScoresAbi,
} from "@/config/contracts";

type StartOnchainRunButtonProps = {
  className?: string;
  onStartedHref?: string;
};

export function StartOnchainRunButton({
  className = "",
  onStartedHref,
}: StartOnchainRunButtonProps) {
  const scoresAddress = getBlueRiftContractAddress(activeChain.id);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { isPending: isSwitching, switchChain } = useSwitchChain();
  const {
    data: hash,
    error,
    isPending: isWriting,
    sendTransaction,
  } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  const isActiveChain = chainId === activeChain.id;
  const transactionUrl = hash ? getExplorerTxUrl(activeChain.id, hash) : undefined;

  if (!scoresAddress) {
    return null;
  }

  if (!isConnected) {
    return (
      <p className="rounded-md border border-cyan-300/20 bg-cyan-300/5 p-3 text-sm leading-6 text-cyan-100">
        Connect wallet to start an onchain-tracked run.
      </p>
    );
  }

  if (!isActiveChain) {
    return (
      <RetroButton
        type="button"
        className="w-full"
        onClick={() => switchChain({ chainId: activeChain.id })}
        disabled={isSwitching}
      >
        {isSwitching ? "Switching..." : `Switch to ${activeChain.name}`}
      </RetroButton>
    );
  }

  return (
    <div className={["grid gap-3", className].join(" ")}>
      <RetroButton
        type="button"
        className="w-full"
        disabled={isWriting || isConfirming || isConfirmed}
        onClick={() => {
          const callData = encodeFunctionData({
            abi: spaceRunnerScoresAbi,
            functionName: "startRun",
          });

          sendTransaction({
            to: scoresAddress,
            data: callData,
          });
        }}
      >
        {isWriting
          ? "Confirm in wallet"
          : isConfirming
            ? "Starting..."
            : isConfirmed
              ? "Start saved"
              : "Start onchain run"}
      </RetroButton>

      {isConfirmed && onStartedHref ? (
        <RetroButton href={onStartedHref} variant="secondary" className="w-full">
          Play run
        </RetroButton>
      ) : null}

      {transactionUrl ? (
        <a
          href={transactionUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-white/10 bg-slate-950/35 p-3 font-mono text-xs font-black uppercase leading-5 text-cyan-100 transition hover:border-cyan-300/40 hover:text-white"
        >
          View start tx on {activeChain.blockExplorers.default.name}
        </a>
      ) : null}

      {error ? (
        <p className="rounded-md border border-fuchsia-300/25 bg-fuchsia-300/5 p-3 text-sm leading-6 text-fuchsia-100">
          {(error as BaseError).shortMessage || error.message}
        </p>
      ) : null}
    </div>
  );
}
