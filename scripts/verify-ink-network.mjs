import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const networks = {
  ink: {
    label: "Ink",
    chainId: "57073",
    addressEnv: "NEXT_PUBLIC_INK_SPACE_RUNNER_SCORES_ADDRESS",
    verifierUrl: "https://explorer.inkonchain.com/api",
  },
  "ink-sepolia": {
    label: "Ink Sepolia",
    chainId: "763373",
    addressEnv: "NEXT_PUBLIC_INK_SEPOLIA_SPACE_RUNNER_SCORES_ADDRESS",
    verifierUrl: "https://explorer-sepolia.inkonchain.com/api",
  },
};

const networkKey = process.argv[2];
const network = networks[networkKey];
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

if (!network) {
  console.error("Usage: node scripts/verify-ink-network.mjs <ink|ink-sepolia>");
  process.exit(1);
}

const localEnv = readLocalEnv(envPath);
const address = process.env[network.addressEnv] ?? localEnv[network.addressEnv];
const apiKey = process.env.BLOCKSCOUT_API_KEY ?? localEnv.BLOCKSCOUT_API_KEY;

if (!address) {
  console.error(`Missing ${network.addressEnv}. Add the deployed ${network.label} contract address.`);
  process.exit(1);
}

const args = [
  "verify-contract",
  address,
  contractPath,
  "--chain-id",
  network.chainId,
  "--verifier",
  "blockscout",
  "--verifier-url",
  network.verifierUrl,
  "--watch",
];

if (apiKey) {
  args.push("--etherscan-api-key", apiKey);
}

const result = spawnSync("forge", args, {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
