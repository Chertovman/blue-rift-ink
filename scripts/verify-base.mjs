import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractAddress = process.env.NEXT_PUBLIC_BASE_SPACE_RUNNER_SCORES_ADDRESS;
const contractPath = "contracts/src/SpaceRunnerScores.sol:SpaceRunnerScores";
const envPath = resolve(".env.local");

function readLocalEnv(path) {
  if (!existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const value = line
          .slice(index + 1)
          .trim()
          .replace(/^['"]|['"]$/g, "");
        return [key, value];
      }),
  );
}

const localEnv = readLocalEnv(envPath);
const address = contractAddress ?? localEnv.NEXT_PUBLIC_BASE_SPACE_RUNNER_SCORES_ADDRESS;
const apiKey =
  process.env.ETHERSCAN_API_KEY ??
  localEnv.ETHERSCAN_API_KEY ??
  process.env.BASESCAN_API_KEY ??
  localEnv.BASESCAN_API_KEY;

if (!address) {
  console.error("Missing NEXT_PUBLIC_BASE_SPACE_RUNNER_SCORES_ADDRESS.");
  process.exit(1);
}

if (!apiKey) {
  console.error("Missing ETHERSCAN_API_KEY or BASESCAN_API_KEY in .env.local.");
  process.exit(1);
}

const result = spawnSync(
  "forge",
  [
    "verify-contract",
    address,
    contractPath,
    "--chain",
    "base",
    "--watch",
    "--etherscan-api-key",
    apiKey,
  ],
  {
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
