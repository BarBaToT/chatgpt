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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-cyan-500/20 bg-black/80 backdrop-blur">
      <div className="border-b border-cyan-500/20 p-5">
        <h1 className="neon-text text-xl font-bold tracking-[0.25em] text-cyan-400">
          NEON_SYNDICATE
        </h1>
        <p className="mt-1 text-[10px] tracking-[0.3em] text-zinc-500">
          {"// MAINFRAME v0.1 //"}
        </p>
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
