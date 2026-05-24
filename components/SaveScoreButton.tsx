"use client";

import { useEffect } from "react";
import { encodeFunctionData } from "viem";
import type { BaseError } from "wagmi";
import {
  useAccount,
  useChainId,
  useConnect,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
import { RetroButton } from "@/components/RetroButton";
import { activeChain, getExplorerTxUrl } from "@/config/chains";
import {
  getBlueRiftContractEnvName,
  getBlueRiftContractAddress,
  spaceRunnerScoresAbi,
} from "@/config/contracts";
import type { SpaceRunnerResult } from "@/game/types";

type SaveScoreButtonProps = {
  result: SpaceRunnerResult;
};

function isVisibleConnector(walletConnector: { id: string; name: string }) {
  if (activeChain.name === "Base") {
    return true;
  }

  const connectorLabel = `${walletConnector.id} ${walletConnector.name}`.toLowerCase();
  return !connectorLabel.includes("base");
}

export function SaveScoreButton({ result }: SaveScoreButtonProps) {
  const scoresAddress = getBlueRiftContractAddress(activeChain.id);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { isPending: isSwitching, switchChain } = useSwitchChain();
  const {
    connectors,
    connect,
    error: connectError,
    isPending: isConnecting,
    variables,
  } = useConnect();
  const {
    data: hash,
    error: sendError,
    isPending: isWriting,
    sendTransaction,
  } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed) {
      window.dispatchEvent(new CustomEvent("space-runner-score-saved"));
    }
  }, [isConfirmed]);

  const isActiveChain = chainId === activeChain.id;
  const disabled = !scoresAddress || !isConnected || isWriting || isConfirming;
  const error = sendError ?? connectError;
  const transactionUrl = hash ? getExplorerTxUrl(activeChain.id, hash) : undefined;
  const contractEnvName = getBlueRiftContractEnvName(activeChain.id);

  if (!scoresAddress) {
    return (
      <p className="mt-3 rounded-md border border-amber-200/25 bg-amber-200/5 p-3 text-sm leading-6 text-amber-100">
        Deploy `SpaceRunnerScores` on {activeChain.name} and set `{contractEnvName}` to enable
        onchain saves.
      </p>
    );
  }

  if (!isConnected) {
    return (
      <div className="mt-3 grid gap-3">
        <p className="rounded-md border border-cyan-300/20 bg-cyan-300/5 p-3 text-sm leading-6 text-cyan-100">
          Connect wallet to save this self-reported run on {activeChain.name}.
        </p>
        {connectors.filter(isVisibleConnector).map((walletConnector) => (
          <RetroButton
            key={`${walletConnector.id}-${walletConnector.name}`}
            type="button"
            variant={walletConnector.id.includes("base") ? "primary" : "secondary"}
            className="w-full"
            onClick={() => connect({ connector: walletConnector, chainId: activeChain.id })}
            disabled={isConnecting}
          >
            {isConnecting && variables?.connector === walletConnector
              ? "Connecting..."
              : walletConnector.name}
          </RetroButton>
        ))}
        {error ? (
          <p className="rounded-md border border-fuchsia-300/25 bg-fuchsia-300/5 p-3 text-sm leading-6 text-fuchsia-100">
            {(error as BaseError).shortMessage || error.message}
          </p>
        ) : null}
      </div>
    );
  }

  if (!isActiveChain) {
    return (
      <RetroButton
        type="button"
        className="mt-3 w-full"
        onClick={() => switchChain({ chainId: activeChain.id })}
        disabled={isSwitching}
      >
        {isSwitching ? "Switching..." : `Switch to ${activeChain.name}`}
      </RetroButton>
    );
  }

  return (
    <div className="mt-3">
      <RetroButton
        type="button"
        className="w-full"
        disabled={disabled || isConfirmed}
        onClick={() => {
          const callData = encodeFunctionData({
            abi: spaceRunnerScoresAbi,
            functionName: "submitRun",
            args: [BigInt(result.score), BigInt(result.survivedSeconds)],
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
            ? "Saving..."
            : isConfirmed
              ? "Saved onchain"
              : "Save self-reported score"}
      </RetroButton>

      {transactionUrl ? (
        <a
          href={transactionUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block rounded-md border border-white/10 bg-slate-950/35 p-3 font-mono text-xs font-black uppercase leading-5 text-cyan-100 transition hover:border-cyan-300/40 hover:text-white"
        >
          View transaction on {activeChain.blockExplorers.default.name}
        </a>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-md border border-fuchsia-300/25 bg-fuchsia-300/5 p-3 text-sm leading-6 text-fuchsia-100">
          {(error as BaseError).shortMessage || error.message}
        </p>
      ) : null}
    </div>
  );
}
