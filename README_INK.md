# Blue Rift on Ink

Blue Rift supports Ink as an optional onchain save target. Gameplay remains
offchain; only compact run summaries are submitted to `SpaceRunnerScores`.

- Live app: https://blue-rift-ink.vercel.app
- Ink mainnet contract: `0x0674795bA09210431a73fCa7bA36b90A692B3755`
- Ink explorer: https://explorer.inkonchain.com/address/0x0674795ba09210431a73fca7ba36b90a692b3755
- Ink Sepolia contract: `0x0674795bA09210431a73fCa7bA36b90A692B3755`
- Ink Sepolia explorer: https://explorer-sepolia.inkonchain.com/address/0x0674795ba09210431a73fca7ba36b90a692b3755

## Local Run

```bash
pnpm install
pnpm dev
```

Open http://localhost:3001.

To run the app against Ink Sepolia locally, add this to `.env.local`:

```bash
NEXT_PUBLIC_BLUE_RIFT_CHAIN_ID=763373
NEXT_PUBLIC_INK_SEPOLIA_SPACE_RUNNER_SCORES_ADDRESS=0x...
```

Use `57073` and `NEXT_PUBLIC_INK_SPACE_RUNNER_SCORES_ADDRESS` for Ink mainnet.
Do not put private keys in `NEXT_PUBLIC_*` variables.

## Add Ink to Wallet

Ink Mainnet:

- Network name: `Ink`
- Chain ID: `57073`
- Currency: `ETH`
- RPC: `https://rpc-gel.inkonchain.com`
- Explorer: `https://explorer.inkonchain.com`

Ink Sepolia:

- Network name: `Ink Sepolia`
- Chain ID: `763373`
- Currency: `ETH`
- RPC: `https://rpc-gel-sepolia.inkonchain.com`
- Explorer: `https://explorer-sepolia.inkonchain.com`

## Deploy to Ink Sepolia

Add deployment-only secrets to `.env.local` or export them in your shell:

```bash
PRIVATE_KEY=0x...
INK_SEPOLIA_RPC_URL=https://rpc-gel-sepolia.inkonchain.com
```

Deploy:

```bash
pnpm contracts:build
pnpm contracts:test
pnpm deploy:ink-sepolia
```

After deployment, paste the contract address into `.env.local`:

```bash
NEXT_PUBLIC_BLUE_RIFT_CHAIN_ID=763373
NEXT_PUBLIC_INK_SEPOLIA_SPACE_RUNNER_SCORES_ADDRESS=0x...
```

## Deploy to Ink Mainnet

Use a funded deployer wallet with ETH on Ink mainnet:

```bash
PRIVATE_KEY=0x...
INK_RPC_URL=https://rpc-gel.inkonchain.com
```

Deploy:

```bash
pnpm contracts:build
pnpm contracts:test
pnpm deploy:ink
```

After deployment, paste the contract address into `.env.local` or your hosting
provider:

```bash
NEXT_PUBLIC_BLUE_RIFT_CHAIN_ID=57073
NEXT_PUBLIC_INK_SPACE_RUNNER_SCORES_ADDRESS=0x0674795bA09210431a73fCa7bA36b90A692B3755
```

## Verify on Ink Explorer

Ink uses Blockscout-compatible explorers. `BLOCKSCOUT_API_KEY` is optional when
the explorer accepts unauthenticated verification.

```bash
BLOCKSCOUT_API_KEY=optional
pnpm verify:ink-sepolia
pnpm verify:ink
```

The verification scripts read the deployed contract address from:

- `NEXT_PUBLIC_INK_SEPOLIA_SPACE_RUNNER_SCORES_ADDRESS`
- `NEXT_PUBLIC_INK_SPACE_RUNNER_SCORES_ADDRESS`

Manual verification is also available in the explorer UI from the contract page.
Use Solidity `0.8.26` with optimizer enabled and `200` optimizer runs.

## Frontend Address Mapping

Contract addresses are configured in `config/contracts.ts` by chain ID:

- Base: `8453`
- Base Sepolia: `84532`
- Ink: `57073`
- Ink Sepolia: `763373`

Paste deployed Ink addresses into the matching `NEXT_PUBLIC_*` env var. The app
uses `NEXT_PUBLIC_BLUE_RIFT_CHAIN_ID` to choose which chain the save buttons,
profile reads, explorer links, and wallet switch prompts target.

## Manual QA Checklist

- Start the app with `NEXT_PUBLIC_BLUE_RIFT_CHAIN_ID=763373`.
- Open `/ink` and confirm the Ink messaging and links render.
- Connect a wallet that supports Ink Sepolia.
- Confirm the wallet prompt switches to Ink Sepolia when needed.
- Open `/game`, finish a run, and save it onchain.
- Confirm the transaction link opens the Ink Sepolia explorer.
- Confirm profile stats show saved best, run count, survival time, and 1000+
  achievement state after the transaction confirms.
- Open `/leaderboard` and confirm the onchain row appears when the connected
  wallet has saved runs.
- Repeat the same flow with `NEXT_PUBLIC_BLUE_RIFT_CHAIN_ID=57073` after mainnet
  deployment.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm contracts:test`.
