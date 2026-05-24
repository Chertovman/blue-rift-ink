# AGENTS.md

## Project

This is a mobile-first Base App game project.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Phaser
- wagmi
- viem
- @base-org/account
- Foundry
- Base Sepolia first

## Rules

- Use pnpm.
- Do not commit private keys or secrets.
- Do not create a token.
- Do not add gambling, betting, lootboxes, or prize mechanics.
- Keep gameplay mostly offchain.
- Use onchain only for achievements, best score, badges, payments, or season pass.
- Mobile-first UI is required.
- React handles wallet/onchain logic.
- Phaser handles gameplay only.
- Every change should pass:
  - pnpm lint
  - pnpm build
- Prefer simple shippable code over overengineering.
