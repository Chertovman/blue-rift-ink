import { GameShell } from "@/components/GameShell";
import { RetroButton } from "@/components/RetroButton";
import { WalletProfile } from "@/components/WalletPanel";

export const metadata = {
  title: "Play Blue Rift | Endless Tunnel",
  description:
    "Play Blue Rift, a mobile-first endless tunnel runner with optional self-reported score saves on Ink.",
  alternates: {
    canonical: "/game",
  },
};

export default function GamePage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-10">
      <nav className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
        <RetroButton href="/" variant="secondary" className="h-10 px-4 text-xs">
          Home
        </RetroButton>
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <h1 className="font-mono text-xl font-black uppercase text-cyan-100 sm:text-2xl">
              Endless Tunnel
            </h1>
            <p className="mt-1 text-sm text-slate-400">Touch, arrows, WASD, boost</p>
          </div>
          <WalletProfile />
        </div>
      </nav>

      <GameShell />
    </main>
  );
}
