import { RetroButton } from "@/components/RetroButton";
import { activeChain, getExplorerAddressUrl } from "@/config/chains";
import { getBlueRiftContractAddress } from "@/config/contracts";

const savedData = [
  "best score",
  "submitted run count",
  "last survival time",
  "Score 1000+ achievement",
];

const links = [
  ["Contract", "#ink-contract-address-placeholder"],
  ["Explorer", "https://explorer.inkonchain.com"],
  ["Demo", "#demo-url-placeholder"],
];

export const metadata = {
  title: "Blue Rift on Ink",
  description:
    "Blue Rift is prepared for Ink with optional onchain run saves for scores, run counts, survival time, and achievements.",
  alternates: {
    canonical: "/ink",
  },
};

export default function InkPage() {
  const contractAddress = getBlueRiftContractAddress(activeChain.id);
  const contractUrl = contractAddress
    ? getExplorerAddressUrl(activeChain.id, contractAddress)
    : undefined;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-4 py-5 sm:px-6 lg:px-10">
      <nav className="mb-8 flex items-center justify-between gap-3 sm:mb-10">
        <RetroButton href="/" variant="secondary" className="h-10 px-4 text-xs">
          Home
        </RetroButton>
        <RetroButton href="/game" className="h-10 px-4 text-xs">
          Play
        </RetroButton>
      </nav>

      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div>
          <p className="font-mono text-sm font-bold uppercase text-fuchsia-200">
            Built on Ink
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase leading-none text-white sm:text-6xl">
            Blue Rift is live on Ink
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Blue Rift is a mobile-first arcade runner where gameplay stays offchain
            and players can optionally save compact run summaries onchain.
            Ink gives the game a low-cost EVM home for frequent consumer transactions
            without adding tokens, prizes, betting, or lootboxes.
          </p>

          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
            <RetroButton href="/game" className="w-full sm:w-auto">
              Save run on Ink
            </RetroButton>
            {contractUrl ? (
              <RetroButton href={contractUrl} variant="secondary">
                View contract
              </RetroButton>
            ) : (
              <span className="inline-flex min-h-11 items-center justify-center rounded-md border border-amber-200/30 px-4 font-mono text-xs font-black uppercase text-amber-100">
                Contract pending
              </span>
            )}
          </div>
        </div>

        <div className="retro-panel rounded-md p-5">
          <h2 className="font-mono text-sm font-black uppercase text-cyan-100">
            Onchain data
          </h2>
          <div className="mt-4 grid gap-3">
            {savedData.map((item) => (
              <div
                key={item}
                className="rounded-md border border-white/10 bg-slate-950/35 p-3 font-mono text-xs font-black uppercase text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {links.map(([label, href]) => {
          const resolvedHref =
            label === "Contract" && contractUrl
              ? contractUrl
              : label === "Explorer"
                ? activeChain.blockExplorers.default.url
                : href;
          const isExternal = resolvedHref.startsWith("http");

          return (
            <a
              key={label}
              href={resolvedHref}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noreferrer" : undefined}
              className="retro-panel rounded-md p-4 transition hover:border-cyan-300/50"
            >
              <div className="font-mono text-xs font-black uppercase text-slate-400">
                {label}
              </div>
              <div className="mt-2 font-mono text-sm font-black uppercase text-cyan-100">
                {label === "Contract" && !contractUrl ? "Add after deploy" : "Open"}
              </div>
            </a>
          );
        })}
      </section>
    </main>
  );
}
