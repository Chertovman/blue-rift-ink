# Blue Rift Contracts

Minimal Ink-ready contracts for Blue Rift.

## Contract

- `SpaceRunnerScores.sol` stores one player's best score, run count, last survival time, and a simple `reachedOneThousand` achievement.
- Survival time supports endless runs and is not capped at 60 seconds.
- It does not create a token.
- It does not add betting, prizes, lootboxes, or gambling mechanics.
- Gameplay remains offchain; React submits only the self-reported final run summary.

## Commands

Install Foundry first if `forge` is not available locally.

```sh
pnpm contracts:build
pnpm contracts:test
```

## Deploy to Ink Sepolia

1. Add a funded Ink Sepolia deployer key to `.env.local` or your shell:

```sh
PRIVATE_KEY=0x...
INK_SEPOLIA_RPC_URL=https://rpc-gel-sepolia.inkonchain.com
```

2. Deploy:

```sh
pnpm deploy:ink-sepolia
```

3. Copy the deployed `SpaceRunnerScores` address into `.env.local`:

```sh
NEXT_PUBLIC_BLUE_RIFT_CHAIN_ID=763373
NEXT_PUBLIC_INK_SEPOLIA_SPACE_RUNNER_SCORES_ADDRESS=0x...
```

4. Restart the Next.js dev server and run the manual save-flow QA.

## Deploy to Ink Mainnet

1. Add a funded Ink mainnet deployer key to `.env.local` or your shell:

```sh
PRIVATE_KEY=0x...
INK_RPC_URL=https://rpc-gel.inkonchain.com
```

2. Deploy:

```sh
pnpm deploy:ink
```

3. Copy the deployed `SpaceRunnerScores` address into `.env.local` or hosting env:

```sh
NEXT_PUBLIC_BLUE_RIFT_CHAIN_ID=57073
NEXT_PUBLIC_INK_SPACE_RUNNER_SCORES_ADDRESS=0x...
```

4. Verify:

```sh
pnpm verify:ink
```

## Legacy Base Deployment

1. Add a funded Base deployer key to `.env.local` or your shell:

```sh
PRIVATE_KEY=0x...
```

2. Deploy:

```sh
pnpm contracts:deploy:base
```

3. Copy the deployed `SpaceRunnerScores` address into `.env.local`:

```sh
NEXT_PUBLIC_BASE_SPACE_RUNNER_SCORES_ADDRESS=0x...
```

4. Restart the Next.js dev server.

5. Verify the contract source when `ETHERSCAN_API_KEY` or `BASESCAN_API_KEY`
   is available in `.env.local`:

```sh
pnpm contracts:verify:base
```

Do not commit private keys, seed phrases, RPC secrets, or `.env` files.
