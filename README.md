# Blue Rift

Blue Rift is a mobile-first Ink arcade game. The first game is **Endless
Tunnel**: an endless 3D tunnel runner where the player pilots a neon craft,
dodges red blockers, collects green energy shards, grabs rare INK repairs,
boosts through clean lanes, and tries to beat the best score.

Gameplay stays mostly offchain. The Ink version uses `SpaceRunnerScores` for
optional self-reported run saves, basic player stats, and the
`reachedOneThousand` achievement flag. Base support is preserved as an alternate
deployment target, but this branch is Ink-first. There is no token, gambling,
betting, lootbox, prize, NFT, or reward mechanic.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Phaser
- wagmi
- viem
- @base-org/account
- Foundry
- Ink
- Base support preserved
- pnpm

## Install

```bash
pnpm install
```

## Development

Port `3000` is intentionally avoided. The dev server runs on `3001`.

```bash
pnpm dev
```

Open http://localhost:3001.

## Vercel

Vercel is the intended web host for the demo. Next.js projects are auto-detected
by Vercel, so the default install/build settings work with this repo:

- Production URL: https://blue-rift.vercel.app
- Vercel project: `dimas-projects-f45dbf45/blue-rift`
- Install Command: `pnpm install`
- Build Command: `pnpm build`
- Framework Preset: Next.js

Set this environment variable in Vercel Project Settings for Production and
Preview deployments:

```bash
NEXT_PUBLIC_BLUE_RIFT_CHAIN_ID=57073
NEXT_PUBLIC_INK_SPACE_RUNNER_SCORES_ADDRESS=0x...
```

Do not add `PRIVATE_KEY` to Vercel. Deployment keys are only needed locally for
deploy scripts.

## Environment

Self-reported onchain score saves are optional. To enable them, deploy
`SpaceRunnerScores` and add the contract address locally. Ink is the default
active chain for this branch:

```bash
NEXT_PUBLIC_BLUE_RIFT_CHAIN_ID=57073
NEXT_PUBLIC_INK_SPACE_RUNNER_SCORES_ADDRESS=0x...
```

For Ink Sepolia QA, use:

```bash
NEXT_PUBLIC_BLUE_RIFT_CHAIN_ID=763373
NEXT_PUBLIC_INK_SEPOLIA_SPACE_RUNNER_SCORES_ADDRESS=0x...
```

Base remains available by setting `NEXT_PUBLIC_BLUE_RIFT_CHAIN_ID=8453` and
`NEXT_PUBLIC_BASE_SPACE_RUNNER_SCORES_ADDRESS`.

Do not commit private keys, seed phrases, RPC secrets, or `.env` files.

## Build

```bash
pnpm lint
pnpm build
pnpm contracts:build
pnpm contracts:test
pnpm deploy:ink
pnpm verify:ink
pnpm deploy:ink-sepolia
pnpm verify:ink-sepolia
```

## Game

Endless Tunnel is a neon tunnel runner:

- Move with arrow keys or WASD.
- Use touch controls on mobile.
- Hold boost through clean lanes.
- Dodge red blockers.
- Collect green energy shards for score and energy.
- Rare INK pickups restore one life up to the 3-life maximum.
- The run ends only when the ship loses all 3 lives.
- Final score and best local score are saved in the browser with localStorage.
- The leaderboard shows mock arcade rankings, local browser best, and connected
  self-reported onchain best when available.

## Onchain

`contracts/src/SpaceRunnerScores.sol` stores:

- best score
- submitted run count
- last survived seconds
- last update timestamp
- `reachedOneThousand`

React handles wallet and contract logic. Phaser handles gameplay only.
The frontend contract mapping lives in `config/contracts.ts` and is keyed by
chain ID for Base, Base Sepolia, Ink, and Ink Sepolia.

Ink deployments:

- Ink Sepolia contract: `0x...`
- Ink Sepolia explorer: https://explorer-sepolia.inkonchain.com/address/0x...
- Ink mainnet contract: `0x0674795bA09210431a73fCa7bA36b90A692B3755`
- Ink mainnet explorer: https://explorer.inkonchain.com/address/0x0674795ba09210431a73fca7ba36b90a692b3755
- Live app: https://blue-rift-ink.vercel.app

Previous Base deployments are preserved for the original Base version.

Base Sepolia test deployment:

- Contract: `0x3b083fBa83e07619229C78BA7A4cc6c42daFC10d`
- BaseScan: https://sepolia.basescan.org/address/0x3b083fBa83e07619229C78BA7A4cc6c42daFC10d
- Verified source: yes
- Successful score tx: https://sepolia.basescan.org/tx/0x2fcbd7130f02a94656d09021a9c8be7b514fb803c6a2cad33895ab820be1f0d2

Base mainnet contract:

- Contract: `0x1543aB590Ef693cF3A610dBd4c1fAB4a5A69ae7d`
- BaseScan: https://basescan.org/address/0x1543aB590Ef693cF3A610dBd4c1fAB4a5A69ae7d
- Env var: `NEXT_PUBLIC_BASE_SPACE_RUNNER_SCORES_ADDRESS`

## Contracts

```bash
pnpm contracts:build
pnpm contracts:test
pnpm deploy:ink
pnpm verify:ink
pnpm deploy:ink-sepolia
pnpm verify:ink-sepolia
```

Deployment scripts live in `contracts/script`. Supply private keys only through
local shell or local env files that are not committed. Ink mainnet deploys
require a deployer wallet funded with ETH on Ink.

Base deploy scripts are still available:

```bash
pnpm contracts:deploy:base
pnpm contracts:verify:base
pnpm contracts:deploy:base-sepolia
pnpm contracts:verify:base-sepolia
```

## Demo Checklist

- Open `/game` and finish a run by losing all 3 lives.
- Connect wallet from the save panel or the top-right profile.
- Switch to Ink if prompted.
- Save the self-reported run onchain.
- Confirm the post-run summary shows saved best and `Score 1000+` achievement
  state.
- Open `/leaderboard` and confirm local and connected onchain rows appear.
