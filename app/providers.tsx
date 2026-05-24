"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import type { State } from "wagmi";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/config/wagmi";

type ProvidersProps = {
  children: ReactNode;
  initialState?: State;
};

export function Providers({ children, initialState }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
