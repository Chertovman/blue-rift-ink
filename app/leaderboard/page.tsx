import { Leaderboard } from "@/components/Leaderboard";
import { RetroButton } from "@/components/RetroButton";
import { WalletProfile } from "@/components/WalletPanel";

export const metadata = {
  title: "Blue Rift Scores",
  description:
    "Compare local Blue Rift scores with optional self-reported Ink profile stats.",
  alternates: {
    canonical: "/leaderboard",
  },
};

export default function LeaderboardPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-4 py-5 sm:px-6 lg:px-10">
      <nav className="mb-8 flex items-center justify-between gap-3 sm:mb-10">
        <RetroButton href="/" variant="secondary" className="h-10 px-4 text-xs">
          Home
        </RetroButton>
        <div className="flex items-center gap-2">
          <RetroButton href="/game" className="h-10 px-4 text-xs">
            Play
          </RetroButton>
          <WalletProfile />
        </div>
      </nav>

      <section className="mb-8">
        <p className="font-mono text-sm font-bold uppercase text-fuchsia-200">
          Local scores
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase text-white sm:text-5xl">
          Leaderboard
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
          Track your browser best next to your onchain profile. Connect a
          wallet to load saved runs, saved best, and achievement state.
        </p>
      </section>

      <Leaderboard />
    </main>
  );
}
