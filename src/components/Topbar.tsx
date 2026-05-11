"use client";

import { useEffect, useState } from "react";
import { Activity, Coins, Lock, Trophy, User } from "lucide-react";

export type TopbarUser = {
  username: string;
  creds: number;
  streetRep: number;
  bandwidth: number;
  bandwidthMax: number;
  lockedUntil: string | null;
};

export function Topbar({ user }: { user: TopbarUser }) {
  const bwPct = Math.min(
    100,
    Math.max(0, Math.round((user.bandwidth / user.bandwidthMax) * 100))
  );
  const locked = user.lockedUntil ? new Date(user.lockedUntil) > new Date() : false;

  return (
    <header className="sticky top-0 z-10 border-b border-cyan-500/20 bg-black/70 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-2 text-xs tracking-widest text-zinc-500">
          <User size={12} aria-hidden className="text-cyan-300" />
          USER: <span className="text-cyan-300">@{user.username}</span>
          {locked && user.lockedUntil && (
            <LockoutBadge until={user.lockedUntil} />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <Stat
            icon={Coins}
            label="CREDS"
            value={`${user.creds.toLocaleString()}¢`}
            className="text-emerald-400"
          />
          <Stat
            icon={Trophy}
            label="STREET_REP"
            value={user.streetRep.toLocaleString()}
            className="text-fuchsia-400"
          />
          <Bandwidth pct={bwPct} value={`${user.bandwidth}/${user.bandwidthMax}`} />
        </div>
      </div>
    </header>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className="flex items-center gap-2 tabular-nums">
      <Icon size={12} aria-hidden className={className} />
      <span className="text-zinc-500">{label}</span>
      <span className={`font-bold ${className}`}>{value}</span>
    </div>
  );
}

function Bandwidth({ pct, value }: { pct: number; value: string }) {
  const low = pct < 30;
  return (
    <div className="flex items-center gap-2 tabular-nums">
      <Activity
        size={12}
        aria-hidden
        className={low ? "text-rose-400" : "text-cyan-300"}
      />
      <span className="text-zinc-500">BANDWIDTH</span>
      <div className="relative h-2 w-32 overflow-hidden rounded bg-zinc-800">
        <div
          className={`h-full transition-[width] ${low ? "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" : "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={low ? "text-rose-400" : "text-cyan-300"}>{value}</span>
    </div>
  );
}

function LockoutBadge({ until }: { until: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(0, Math.ceil((new Date(until).getTime() - now) / 1000));
  const m = Math.floor(remaining / 60).toString().padStart(2, "0");
  const s = (remaining % 60).toString().padStart(2, "0");

  return (
    <span className="ml-3 inline-flex items-center gap-1 rounded-sm border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.35)]">
      <Lock size={10} aria-hidden className="animate-pulse" />
      SYS_LOCKOUT {m}:{s}
    </span>
  );
}
