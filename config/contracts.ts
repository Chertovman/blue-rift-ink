import { isAddress, zeroAddress } from "viem";
import { base, baseSepolia } from "wagmi/chains";
import { ink, inkSepolia } from "@/config/chains";

const baseSpaceRunnerScoresAddress = "0x1543aB590Ef693cF3A610dBd4c1fAB4a5A69ae7d";
const baseSepoliaSpaceRunnerScoresAddress = "0x3b083fBa83e07619229C78BA7A4cc6c42daFC10d";

function configuredAddress(value: string | undefined, fallback?: `0x${string}`) {
  if (value && isAddress(value) && value !== zeroAddress) {
    return value;
  }

  return fallback;
}

export const spaceRunnerScoresAbi = [
  {
    type: "function",
    name: "submitRun",
    stateMutability: "nonpayable",
    inputs: [
      { name: "score", type: "uint256" },
      { name: "survivedSeconds", type: "uint64" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "startRun",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "getPlayerStats",
    stateMutability: "view",
    inputs: [{ name: "player", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "bestScore", type: "uint256" },
          { name: "runs", type: "uint64" },
          { name: "startedRuns", type: "uint64" },
          { name: "lastSurvivedSeconds", type: "uint64" },
          { name: "lastStartedAt", type: "uint64" },
          { name: "updatedAt", type: "uint64" },
          { name: "reachedOneThousand", type: "bool" },
        ],
      },
    ],
  },
] as const;

export const CONTRACTS = {
  [base.id]: {
    blueRift: configuredAddress(
      process.env.NEXT_PUBLIC_BASE_SPACE_RUNNER_SCORES_ADDRESS,
      baseSpaceRunnerScoresAddress,
    ),
  },
  [baseSepolia.id]: {
    blueRift: configuredAddress(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_SPACE_RUNNER_SCORES_ADDRESS,
      baseSepoliaSpaceRunnerScoresAddress,
    ),
  },
  [ink.id]: {
    blueRift: configuredAddress(process.env.NEXT_PUBLIC_INK_SPACE_RUNNER_SCORES_ADDRESS),
  },
  [inkSepolia.id]: {
    blueRift: configuredAddress(process.env.NEXT_PUBLIC_INK_SEPOLIA_SPACE_RUNNER_SCORES_ADDRESS),
  },
} as const;

export function getBlueRiftContractAddress(chainId: number | undefined) {
  return CONTRACTS[chainId as keyof typeof CONTRACTS]?.blueRift;
}

export function getBlueRiftContractEnvName(chainId: number | undefined) {
  const envNames = {
    [base.id]: "NEXT_PUBLIC_BASE_SPACE_RUNNER_SCORES_ADDRESS",
    [baseSepolia.id]: "NEXT_PUBLIC_BASE_SEPOLIA_SPACE_RUNNER_SCORES_ADDRESS",
    [ink.id]: "NEXT_PUBLIC_INK_SPACE_RUNNER_SCORES_ADDRESS",
    [inkSepolia.id]: "NEXT_PUBLIC_INK_SEPOLIA_SPACE_RUNNER_SCORES_ADDRESS",
  } as const;

  return envNames[chainId as keyof typeof envNames];
}
