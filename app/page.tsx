import { RetroButton } from "@/components/RetroButton";
import { StartOnchainRunButton } from "@/components/StartOnchainRunButton";
import { WalletProfile } from "@/components/WalletPanel";
import { activeChain, getExplorerAddressUrl } from "@/config/chains";
import { getBlueRiftContractAddress } from "@/config/contracts";

const stats = [
  ["Run", "Endless"],
  ["Mode", "Endless tunnel"],
  ["Lives", "3 hull"],
];

export default function HomePage() {
  const activeContractAddress = getBlueRiftContractAddress(activeChain.id);
  const activeContractUrl = activeContractAddress
    ? getExplorerAddressUrl(activeChain.id, activeContractAddress)
    : undefined;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-10">
      <nav className="flex items-center justify-between gap-3 py-2">
        <div className="font-mono text-sm font-black uppercase text-cyan-100">
          Blue Rift
        </div>
        <div className="flex items-center gap-2">
          <RetroButton href="/leaderboard" variant="secondary" className="h-10 px-3 text-xs">
            Scores
          </RetroButton>
          <WalletProfile />
        </div>
      </nav>

      <section className="grid flex-1 items-center gap-8 py-8 sm:py-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
        <div className="max-w-2xl">
          <p className="mb-4 font-mono text-sm font-bold uppercase text-fuchsia-200">
            First game: Endless Tunnel
          </p>
          <h1 className="text-5xl font-black uppercase leading-none text-white sm:text-7xl lg:text-8xl">
            Blue Rift
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
            Pilot a neon craft through an endless 3D tunnel. Dodge red blockers,
            collect energy shards, grab rare INK repairs, and chase the best
            onchain score on Ink.
          </p>

          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <RetroButton href="/game" className="w-full sm:w-auto">
              Play now
            </RetroButton>
            <RetroButton href="/leaderboard" variant="secondary">
              Scores
            </RetroButton>
          </div>

          <div className="retro-panel mt-5 max-w-xl rounded-md p-4">
            <div className="mb-4">
              <div className="font-mono text-xs font-black uppercase text-cyan-100">
                Onchain start
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-300">
                Register a start tx on {activeChain.name} before launch if you want the run counted in your profile.
              </div>
            </div>
            <StartOnchainRunButton onStartedHref="/game" />
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map(([label, value]) => (
              <div key={label} className="retro-panel rounded-md p-4">
                <div className="font-mono text-xs uppercase text-slate-400">
                  {label}
                </div>
                <div className="mt-2 font-mono text-lg font-black text-cyan-100">{value}</div>
              </div>
            ))}
          </div>

          <div className="retro-panel mt-5 max-w-xl rounded-md p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-mono text-xs font-black uppercase text-lime-100">
                  Onchain status
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-300">
                  Self-reported score saves and the Score 1000+ achievement are ready for Ink.
                </div>
              </div>
              {activeContractUrl ? (
                <a
                  href={activeContractUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-lime-300/30 px-3 font-mono text-xs font-black uppercase text-lime-100 transition hover:border-lime-200 hover:text-white"
                >
                  View contract
                </a>
              ) : (
                <span className="rounded-md border border-amber-200/30 px-3 py-2 font-mono text-xs font-black uppercase text-amber-100">
                  Contract pending
                </span>
              )}
            </div>
          </div>

          <div className="retro-panel mt-5 max-w-xl rounded-md p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-mono text-xs font-black uppercase text-cyan-100">
                  Built on Ink
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-300">
                  Blue Rift can save runs on Ink: best score, run count, survival time,
                  and the Score 1000+ achievement.
                </div>
              </div>
              <RetroButton href="/ink" variant="secondary" className="shrink-0">
                Ink page
              </RetroButton>
            </div>
          </div>
        </div>

        <div className="retro-panel relative min-h-[420px] overflow-hidden rounded-md p-3 sm:min-h-[480px] sm:p-5">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(34,211,238,0.08),transparent_46%),radial-gradient(circle_at_50%_20%,rgba(251,77,255,0.18),transparent_22rem)]" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(180deg,transparent,rgba(34,211,238,0.14))]" />
          <div className="scanline relative h-full min-h-[390px] overflow-hidden rounded-sm border border-cyan-300/25 bg-slate-950/70 sm:min-h-[440px]">
            <div className="absolute left-[18%] top-14 h-3 w-3 bg-cyan-200 shadow-[120px_70px_0_#fb4dff,260px_28px_0_#b6ff4d,390px_150px_0_#fff,300px_270px_0_#22d3ee,80px_310px_0_#fb4dff]" />
            <div className="absolute left-1/2 top-1/2 h-24 w-20 -translate-x-1/2 -translate-y-1/2">
              <div className="mx-auto h-24 w-8 bg-cyan-200 shadow-[0_0_36px_rgba(34,211,238,0.78)]" />
              <div className="absolute left-0 top-11 h-8 w-8 bg-fuchsia-400" />
              <div className="absolute right-0 top-11 h-8 w-8 bg-fuchsia-400" />
              <div className="absolute left-1/2 top-4 h-7 w-4 -translate-x-1/2 bg-white" />
              <div className="absolute bottom-[-18px] left-1/2 h-7 w-5 -translate-x-1/2 bg-lime-300 shadow-[0_0_32px_rgba(182,255,77,0.8)]" />
            </div>
            <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="font-mono text-xs uppercase text-slate-400">
                  MVP route
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  Gameplay first, optional onchain saves
                </div>
              </div>
              <div className="w-fit rounded-sm border border-amber-200/40 px-3 py-2 font-mono text-xs font-black uppercase text-amber-100">
                {activeChain.name} ready
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
