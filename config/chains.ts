import { defineChain } from "viem";
import { base, baseSepolia } from "wagmi/chains";

export const ink = defineChain({
  id: 57_073,
  name: "Ink",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-gel.inkonchain.com", "https://rpc-qnd.inkonchain.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Ink Explorer",
      url: "https://explorer.inkonchain.com",
    },
  },
});

export const inkSepolia = defineChain({
  id: 763_373,
  name: "Ink Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [
        "https://rpc-gel-sepolia.inkonchain.com",
        "https://rpc-qnd-sepolia.inkonchain.com",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Ink Sepolia Explorer",
      url: "https://explorer-sepolia.inkonchain.com",
    },
  },
  testnet: true,
});

export const supportedChains = [base, baseSepolia, ink, inkSepolia] as const;

export type SupportedChain = (typeof supportedChains)[number];
export type SupportedChainId = SupportedChain["id"];

const configuredChainId = Number(process.env.NEXT_PUBLIC_BLUE_RIFT_CHAIN_ID);

export const activeChain =
  supportedChains.find((chain) => chain.id === configuredChainId) ?? ink;

export const activeChainId = activeChain.id;

export function getSupportedChain(chainId: number | undefined) {
  return supportedChains.find((chain) => chain.id === chainId);
}

export function getExplorerUrl(chainId: number | undefined) {
  return getSupportedChain(chainId)?.blockExplorers?.default.url;
}

export function getExplorerTxUrl(chainId: number | undefined, hash: `0x${string}`) {
  const explorerUrl = getExplorerUrl(chainId);
  return explorerUrl ? `${explorerUrl}/tx/${hash}` : undefined;
}

export function getExplorerAddressUrl(chainId: number | undefined, address: `0x${string}`) {
  const explorerUrl = getExplorerUrl(chainId);
  return explorerUrl ? `${explorerUrl}/address/${address}` : undefined;
}
