"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  ShoppingBag,
  Terminal,
  Trophy,
  Zap,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Terminal },
  { href: "/grid", label: "The Grid", icon: Zap },
  { href: "/black-market", label: "Black Market", icon: ShoppingBag },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
] as const;

type SidebarUser = {
  username: string;
  streetRep: number;
};

function rankFromRep(rep: number) {
  if (rep >= 200)
    return { tier: "KINGPIN", color: "text-fuchsia-300", border: "border-fuchsia-500/50" };
  if (rep >= 100)
    return { tier: "FIXER", color: "text-rose-300", border: "border-rose-500/50" };
  if (rep >= 40)
    return { tier: "OPERATOR", color: "text-amber-300", border: "border-amber-500/50" };
  if (rep >= 10)
    return { tier: "RUNNER", color: "text-emerald-300", border: "border-emerald-500/50" };
  return { tier: "GHOST", color: "text-cyan-300", border: "border-cyan-500/50" };
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const rank = rankFromRep(user.streetRep);
  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-cyan-500/20 bg-black/80 backdrop-blur">
      <div className="border-b border-cyan-500/20 p-4">
        <h1 className="neon-text text-base font-bold tracking-[0.18em] text-cyan-400">
          NEON_SYNDICATE
        </h1>
        <p className="mt-1 text-[9px] tracking-[0.3em] text-zinc-500">
          {"// MAINFRAME v0.1 //"}
        </p>
      </div>

      <div className="border-b border-cyan-500/10 p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-md border ${rank.border} bg-black/60 text-sm font-bold ${rank.color} drop-shadow-[0_0_6px_currentColor]`}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs tracking-widest text-zinc-300">
              @{user.username}
            </p>
            <p className={`mt-0.5 text-[10px] tracking-[0.25em] ${rank.color}`}>
              {rank.tier}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-3 rounded-sm px-3 py-2 text-sm tracking-widest transition",
                active
                  ? "bg-cyan-500/10 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                  : "text-zinc-400 hover:bg-fuchsia-500/5 hover:text-fuchsia-300",
              ].join(" ")}
            >
              <Icon size={16} aria-hidden />
              <span>{label.toUpperCase()}</span>
            </Link>
          );
        })}
      </nav>

      <form
        action="/api/auth/logout"
        method="post"
        className="border-t border-cyan-500/10 p-3"
      >
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm tracking-widest text-zinc-500 transition hover:text-fuchsia-400"
        >
          <LogOut size={16} aria-hidden /> DISCONNECT
        </button>
      </form>
    </aside>
  );
}
