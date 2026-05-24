import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const networks = {
  ink: {
    label: "Ink",
    rpcEnv: "INK_RPC_URL",
    defaultRpcUrl: "https://rpc-gel.inkonchain.com",
  },
  "ink-sepolia": {
    label: "Ink Sepolia",
    rpcEnv: "INK_SEPOLIA_RPC_URL",
    defaultRpcUrl: "https://rpc-gel-sepolia.inkonchain.com",
  },
};

const networkKey = process.argv[2];
const network = networks[networkKey];
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
  console.error("Usage: node scripts/deploy-ink-network.mjs <ink|ink-sepolia>");
  process.exit(1);
}

const localEnv = readLocalEnv(envPath);
const privateKey = process.env.PRIVATE_KEY ?? localEnv.PRIVATE_KEY;
const rpcUrl = process.env[network.rpcEnv] ?? localEnv[network.rpcEnv] ?? network.defaultRpcUrl;

if (!privateKey || privateKey === "0x0000000000000000000000000000000000000000000000000000000000000000") {
  console.error(`Missing PRIVATE_KEY. Add a funded ${network.label} deployer key to .env.local.`);
  process.exit(1);
}

const result = spawnSync(
  "forge",
  [
    "script",
    "contracts/script/DeploySpaceRunnerScores.s.sol:DeploySpaceRunnerScores",
    "--rpc-url",
    rpcUrl,
    "--broadcast",
  ],
  {
    env: {
      ...process.env,
      PRIVATE_KEY: privateKey,
    },
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
