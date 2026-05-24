"use client";

import { useEffect } from "react";
import { zeroAddress } from "viem";
import { useAccount, useChainId, useReadContract } from "wagmi";
import {
  getBlueRiftContractAddress,
  spaceRunnerScoresAbi,
} from "@/config/contracts";
import { activeChain } from "@/config/chains";

export type OnchainPlayerStats = {
  bestScore: number;
  runs: number;
  startedRuns: number;
  lastSurvivedSeconds: number;
  lastStartedAt: number;
  updatedAt: number;
  reachedOneThousand: boolean;
};

export function useOnchainPlayerStats() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const scoresAddress = getBlueRiftContractAddress(activeChain.id);
  const isActiveChain = chainId === activeChain.id;
  const canRead = Boolean(scoresAddress && address && isConnected && isActiveChain);

  const query = useReadContract({
    address: scoresAddress ?? zeroAddress,
    abi: spaceRunnerScoresAbi,
    functionName: "getPlayerStats",
    args: [address ?? zeroAddress],
    chainId: activeChain.id,
    query: {
      enabled: canRead,
      refetchInterval: 10_000,
      staleTime: 5_000,
    },
  });

  const { refetch } = query;

  useEffect(() => {
    const refetchStats = () => {
      void refetch();
    };

    window.addEventListener("space-runner-score-saved", refetchStats);
    return () => window.removeEventListener("space-runner-score-saved", refetchStats);
  }, [refetch]);

  const rawStats = query.data;
  const stats: OnchainPlayerStats | undefined = rawStats
    ? {
        bestScore: Number(rawStats.bestScore),
        runs: Number(rawStats.runs),
        startedRuns: Number(rawStats.startedRuns),
        lastSurvivedSeconds: Number(rawStats.lastSurvivedSeconds),
        lastStartedAt: Number(rawStats.lastStartedAt),
        updatedAt: Number(rawStats.updatedAt),
        reachedOneThousand: rawStats.reachedOneThousand,
      }
    : undefined;

  return {
    ...query,
    address,
    activeChain,
    canRead,
    isActiveChain,
    isBase: isActiveChain,
    isConnected,
    isConfigured: Boolean(scoresAddress),
    stats,
  };
}
