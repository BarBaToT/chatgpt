"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export type ActionDTO = {
  id: string;
  slug: string;
  targetName: string;
  description: string;
  energyCost: number;
  requiredSoftwareReq: number;
  successRateBase: number;
  rewardCredsMin: number;
  rewardCredsMax: number;
  rewardRep: number;
};

type Outcome =
  | {
      kind: "ok";
      success: boolean;
      roll: number;
      successRate: number;
      credsGained: number;
      repGained: number;
      lockedUntil: string | null;
    }
  | { kind: "err"; code: string; meta?: Record<string, unknown> };

export function GridList({
  actions,
  initialBandwidth,
  softwareLevel,
  initialLockedUntil,
}: {
  actions: ActionDTO[];
  initialBandwidth: number;
  softwareLevel: number;
  initialLockedUntil: string | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [bandwidth, setBandwidth] = useState(initialBandwidth);
  const [lockedUntil, setLockedUntil] = useState<string | null>(initialLockedUntil);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});

  const isLocked = lockedUntil ? new Date(lockedUntil) > new Date() : false;

  async function execute(action: ActionDTO) {
    setPendingId(action.id);
    try {
      const res = await fetch("/api/hack/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: action.id }),
      });
      const data = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        const code = typeof data.error === "string" ? data.error : "UNKNOWN";
        const lu = typeof data.lockedUntil === "string" ? data.lockedUntil : null;
        if (lu) setLockedUntil(lu);
        setOutcomes((o) => ({ ...o, [action.id]: { kind: "err", code, meta: data } }));
        return;
      }

      const stats = (data.stats ?? {}) as { bandwidth?: number };
      if (typeof stats.bandwidth === "number") setBandwidth(stats.bandwidth);
      const lu = typeof data.lockedUntil === "string" ? data.lockedUntil : null;
      setLockedUntil(lu);
      setOutcomes((o) => ({
        ...o,
        [action.id]: {
          kind: "ok",
          success: Boolean(data.success),
          roll: Number(data.roll ?? 0),
          successRate: Number(data.successRate ?? 0),
          credsGained: Number(data.credsGained ?? 0),
          repGained: Number(data.repGained ?? 0),
          lockedUntil: lu,
        },
      }));
      startTransition(() => router.refresh());
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {actions.map((action) => {
        const swLow = softwareLevel < action.requiredSoftwareReq;
        const broke = bandwidth < action.energyCost;
        const disabled = swLow || broke || isLocked || pendingId !== null;
        const outcome = outcomes[action.id];

        return (
          <article
            key={action.id}
            className="group relative overflow-hidden rounded-sm border border-cyan-500/20 bg-black/40 p-5 transition hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold tracking-widest text-cyan-300 group-hover:glitch">
                  {action.targetName}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">{action.description}</p>
              </div>
              <span className="rounded-sm border border-fuchsia-500/40 px-2 py-0.5 text-[10px] tracking-widest text-fuchsia-300">
                SW≥{action.requiredSoftwareReq}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <Cell label="COST" value={`${action.energyCost} BW`} tone="cyan" />
              <Cell label="ODDS" value={`${action.successRateBase}%`} tone="emerald" />
              <Cell
                label="REWARD"
                value={`${action.rewardCredsMin}-${action.rewardCredsMax}¢`}
                tone="amber"
              />
            </dl>

            <button
              type="button"
              onClick={() => execute(action)}
              disabled={disabled}
              className="mt-4 w-full rounded-sm border border-cyan-400/50 bg-cyan-500/10 py-2 text-xs font-bold tracking-[0.3em] text-cyan-300 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-transparent disabled:text-zinc-600"
            >
              {pendingId === action.id
                ? "EXECUTING..."
                : isLocked
                  ? "// SYSTEM LOCKOUT"
                  : swLow
                    ? `// SW LVL ${action.requiredSoftwareReq} REQUIRED`
                    : broke
                      ? "// INSUFFICIENT BANDWIDTH"
                      : "> EXECUTE"}
            </button>

            {outcome?.kind === "ok" && (
              <p
                className={`mt-3 text-xs tracking-wide ${
                  outcome.success ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {outcome.success
                  ? `[OK] roll ${outcome.roll}/${outcome.successRate} → +${outcome.credsGained}¢ / +${outcome.repGained} rep`
                  : `[FAIL] roll ${outcome.roll}/${outcome.successRate} → traced. lockout until ${
                      outcome.lockedUntil
                        ? new Date(outcome.lockedUntil).toLocaleTimeString()
                        : "—"
                    }`}
              </p>
            )}
            {outcome?.kind === "err" && (
              <p className="mt-3 text-xs text-rose-400">[ERR] {outcome.code}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}

function Cell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "emerald" | "amber";
}) {
  const colors = {
    cyan: "text-cyan-300 border-cyan-500/30",
    emerald: "text-emerald-300 border-emerald-500/30",
    amber: "text-amber-300 border-amber-500/30",
  } as const;
  return (
    <div className={`rounded-sm border bg-black/30 px-2 py-1 ${colors[tone]}`}>
      <dt className="text-[9px] tracking-widest text-zinc-500">{label}</dt>
      <dd className="font-bold tabular-nums">{value}</dd>
    </div>
  );
}
