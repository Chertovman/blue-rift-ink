# Ink Spark Application Draft

## Project Name

Blue Rift

## One-Liner

Blue Rift is a mobile-first arcade runner that lets players optionally save
compact run achievements on Ink.

## What the Product Does

Blue Rift is an endless tunnel runner built for fast mobile sessions. Players
pilot a neon craft, dodge blockers, collect energy shards, and chase their best
score. Gameplay is offchain for speed and responsiveness, while players can
optionally save a run summary onchain.

The `SpaceRunnerScores` contract stores:

- best score
- saved run count
- started run count
- last survival time
- last update time
- Score 1000+ achievement flag

There is no token, gambling, betting, lootbox, prize, or reward mechanic.

## Why It Matters for Ink

Blue Rift is a consumer app with a simple repeat transaction loop: start a run,
play, save a run, compare progress, and return for another attempt. Ink is a
strong fit because the game needs low-cost EVM transactions for frequent,
optional user actions without making gameplay depend on chain latency.

The project can demonstrate Ink as a home for lightweight onchain gaming
profiles, achievements, and repeat consumer usage.

## What Is Live Today

- Mobile-first Next.js arcade game
- Phaser endless tunnel gameplay
- Wallet connection through wagmi, viem, and injected wallets
- Optional onchain run saves
- Best score and run count reads
- Score 1000+ achievement state
- Ink mainnet deployment
- Verified Ink mainnet contract
- Ink Sepolia test deployment with completed QA
- `/ink` project page
- Production Vercel deployment

## Ink Contract Address

`0x0674795bA09210431a73fCa7bA36b90A692B3755`

Explorer: https://explorer.inkonchain.com/address/0x0674795ba09210431a73fca7ba36b90a692b3755

## Live App URL

https://blue-rift-ink.vercel.app

## GitHub URL

https://github.com/Chertovman/blue-rift-ink

## Demo Video URL

https://github.com/Chertovman/blue-rift-ink/releases/download/demo-v1/2026-05-24.16.12.07.mov

## Metrics

- Wallets: 1 connected mainnet wallet in initial QA
- Saved runs: 2 confirmed Ink mainnet saved runs in initial QA
- Transactions: 2 confirmed Ink mainnet `RunSubmitted` transactions
- Retention / repeat players: initial repeat-save QA completed; public user metrics pending launch

## 30-Day Roadmap

- Publish the Ink mainnet build and submit to Spark.
- Record a short demo video showing wallet connect, gameplay, save transaction,
  explorer view, and leaderboard update.
- Collect first public saved-run metrics: connected wallets, runs, repeat
  players, and transactions.
- Add lightweight analytics for conversion from play session to saved run.
- Improve mobile wallet onboarding copy for first-time Ink users.
- Add a public changelog entry for Ink support.
- Prepare a small playtest campaign focused on mobile wallet UX.

## Requested Grant Amount

Placeholder: `$...`

## How Funds Would Help Grow Usage on Ink

Grant funds would support mobile UX polish, Ink-specific QA, user testing,
content production for launch, analytics instrumentation, and continued
iteration on lightweight onchain achievement loops. The goal is to increase
repeat player sessions and saved-run transactions on Ink without introducing
speculative token or prize mechanics.

## Evidence Checklist

- Live app URL
- Public GitHub repository
- Ink mainnet contract address
- Verified contract source on Ink explorer
- Mainnet save transaction: https://explorer.inkonchain.com/tx/0x4bd590155b12728be420718437e17804a91fb1112aedc220f5604d8518b26d61
- Mainnet repeat save transaction: https://explorer.inkonchain.com/tx/0xd3cd8116699f4a1b88cea6a549eb2a818be7a08e88b7cbaa21da9c49a8da8e49
- Demo video
- Screenshots of mobile gameplay
- Screenshots of wallet connection and save transaction
- Transaction examples
- Metrics export for wallets, saved runs, and repeat players
- Short technical summary of what is onchain vs offchain
