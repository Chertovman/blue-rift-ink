import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractAddress = "0x3b083fBa83e07619229C78BA7A4cc6c42daFC10d";
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
const apiKey =
  process.env.ETHERSCAN_API_KEY ??
  localEnv.ETHERSCAN_API_KEY ??
  process.env.BASESCAN_API_KEY ??
  localEnv.BASESCAN_API_KEY;

if (!apiKey) {
  console.error("Missing ETHERSCAN_API_KEY or BASESCAN_API_KEY in .env.local.");
  process.exit(1);
}

const result = spawnSync(
  "forge",
  [
    "verify-contract",
    contractAddress,
    contractPath,
    "--chain",
    "base-sepolia",
    "--watch",
    "--etherscan-api-key",
    apiKey,
  ],
  {
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
