"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Coins, Crosshair, Trophy, Zap } from "lucide-react";
import {
  ACCENT_CLASSES,
  type AccentKey,
  getActionVisual,
} from "@/lib/visuals";

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
        const visual = getActionVisual(action.slug);
        const accent = ACCENT_CLASSES[visual.accent as AccentKey];
        const Icon = visual.icon;
        const pending = pendingId === action.id;

        return (
          <article
            key={action.id}
            className={`group relative flex overflow-hidden rounded-md border border-zinc-800 bg-zinc-950/80 transition ${disabled ? "" : `${accent.hoverBorder} ${accent.hoverShadow}`}`}
          >
            <div
              className={`relative hidden w-32 shrink-0 items-center justify-center border-r border-zinc-800 bg-gradient-to-br ${accent.grad} sm:flex`}
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-30 mix-blend-overlay"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)",
                }}
              />
              <Icon
                size={56}
                className={`${accent.text} ${accent.glow} transition group-hover:scale-110`}
                strokeWidth={1.25}
                aria-hidden
              />
              <span
                className={`absolute left-2 top-2 rounded-sm border ${accent.border} bg-black/60 px-1.5 py-0.5 text-[9px] font-bold tracking-[0.2em] ${accent.text}`}
              >
                {visual.tag}
              </span>
              <span className="absolute bottom-2 left-2 right-2 text-center text-[9px] tracking-widest text-zinc-500">
                SW≥{action.requiredSoftwareReq}
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col p-5">
              <header>
                <h3 className={`text-lg font-bold tracking-widest ${accent.text} group-hover:glitch`}>
                  {action.targetName}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  {action.description}
                </p>
              </header>

              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <StatPill
                  icon={Zap}
                  label="COST"
                  value={`${action.energyCost} BW`}
                  tone="cyan"
                />
                <StatPill
                  icon={Crosshair}
                  label="ODDS"
                  value={`${action.successRateBase}%`}
                  tone="emerald"
                />
                <StatPill
                  icon={Coins}
                  label="REWARD"
                  value={`${action.rewardCredsMin}-${action.rewardCredsMax}¢`}
                  tone="amber"
                />
              </dl>

              <div className="mt-3 flex items-center gap-1 text-[10px] tracking-widest text-fuchsia-300/80">
                <Trophy size={11} aria-hidden /> +{action.rewardRep} REP ON SUCCESS
              </div>

              <button
                type="button"
                onClick={() => execute(action)}
                disabled={disabled}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-sm border py-2 text-xs font-bold tracking-[0.3em] transition ${
                  disabled
                    ? "cursor-not-allowed border-zinc-800 bg-zinc-900/40 text-zinc-600"
                    : `${accent.border} bg-gradient-to-r ${accent.grad} ${accent.text} hover:brightness-125`
                }`}
              >
                {pending
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
                  className={`mt-3 rounded-sm border px-2 py-1 text-[11px] tracking-wide ${
                    outcome.success
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-rose-500/40 bg-rose-500/10 text-rose-300"
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
                <p className="mt-3 rounded-sm border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-300">
                  [ERR] {outcome.code}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
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
    <div className={`rounded-sm border bg-black/30 px-2 py-1.5 ${colors[tone]}`}>
      <dt className="flex items-center gap-1 text-[9px] tracking-widest text-zinc-500">
        <Icon size={10} aria-hidden /> {label}
      </dt>
      <dd className="mt-0.5 font-bold tabular-nums">{value}</dd>
    </div>
  );
}
