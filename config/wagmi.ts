import { Attribution } from "ox/erc8021";
import { createConfig, createStorage, cookieStorage, http } from "wagmi";
import { baseAccount, injected } from "wagmi/connectors";
import { supportedChains } from "@/config/chains";

export const builderCodeDataSuffix = Attribution.toDataSuffix({
  codes: ["bc_6qygkg7m"],
});

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [
    injected(),
    baseAccount({
      appName: "Blue Rift",
    }),
  ],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [supportedChains[0].id]: http(),
    [supportedChains[1].id]: http(),
    [supportedChains[2].id]: http(),
    [supportedChains[3].id]: http(),
  },
  dataSuffix: builderCodeDataSuffix,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
