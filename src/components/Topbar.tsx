"use client";

import { useEffect, useState } from "react";

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
        <div className="text-xs tracking-widest text-zinc-500">
          USER: <span className="text-cyan-300">@{user.username}</span>
          {locked && user.lockedUntil && (
            <LockoutBadge until={user.lockedUntil} />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <Stat
            label="CREDS"
            value={`${user.creds.toLocaleString()}¢`}
            className="text-emerald-400"
          />
          <Stat
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
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className="flex items-center gap-2 tabular-nums">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-bold ${className}`}>{value}</span>
    </div>
  );
}

function Bandwidth({ pct, value }: { pct: number; value: string }) {
  return (
    <div className="flex items-center gap-2 tabular-nums">
      <span className="text-zinc-500">BANDWIDTH</span>
      <div className="relative h-2 w-32 overflow-hidden rounded bg-zinc-800">
        <div
          className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-cyan-300">{value}</span>
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
    <span className="ml-3 inline-flex items-center gap-1 rounded-sm border border-rose-500/40 px-2 py-0.5 text-[10px] tracking-widest text-rose-400">
      SYS_LOCKOUT {m}:{s}
    </span>
  );
}
