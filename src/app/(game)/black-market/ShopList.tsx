"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Cpu, Code2, Zap as ZapIcon } from "lucide-react";
import { getShopVisual } from "@/lib/visuals";

type Category = "STIM" | "HARDWARE" | "SOFTWARE";

export type ShopItemDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: Category;
  cost: number;
  bandwidthRestore: number;
  hardwareDelta: number;
  softwareDelta: number;
};

type Stats = {
  creds: number;
  bandwidth: number;
  bandwidthMax: number;
  hardwareLevel: number;
  softwareLevel: number;
};

const CATEGORY_META: Record<
  Category,
  {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    accent: {
      text: string;
      border: string;
      grad: string;
      glow: string;
    };
  }
> = {
  STIM: {
    label: "// CYBER_STIMS",
    icon: ZapIcon,
    accent: {
      text: "text-cyan-300",
      border: "border-cyan-500/40",
      grad: "from-cyan-500/25 via-cyan-500/5 to-transparent",
      glow: "drop-shadow-[0_0_12px_rgba(34,211,238,0.55)]",
    },
  },
  HARDWARE: {
    label: "// HARDWARE",
    icon: Cpu,
    accent: {
      text: "text-amber-300",
      border: "border-amber-500/40",
      grad: "from-amber-500/25 via-amber-500/5 to-transparent",
      glow: "drop-shadow-[0_0_12px_rgba(245,158,11,0.55)]",
    },
  },
  SOFTWARE: {
    label: "// SOFTWARE",
    icon: Code2,
    accent: {
      text: "text-fuchsia-300",
      border: "border-fuchsia-500/40",
      grad: "from-fuchsia-500/25 via-fuchsia-500/5 to-transparent",
      glow: "drop-shadow-[0_0_12px_rgba(217,70,239,0.55)]",
    },
  },
};

export function ShopList({
  items,
  initialStats,
}: {
  items: ShopItemDTO[];
  initialStats: Stats;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [stats, setStats] = useState(initialStats);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    id: string;
    kind: "ok" | "err";
    message: string;
  } | null>(null);

  const grouped = useMemo(() => {
    const groups: Record<Category, ShopItemDTO[]> = {
      STIM: [],
      HARDWARE: [],
      SOFTWARE: [],
    };
    for (const item of items) groups[item.category].push(item);
    return groups;
  }, [items]);

  async function buy(item: ShopItemDTO) {
    setPendingId(item.id);
    setFeedback(null);
    try {
      const res = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const data = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        const code = typeof data.error === "string" ? data.error : "UNKNOWN";
        setFeedback({
          id: item.id,
          kind: "err",
          message: `[ERR] ${code}`,
        });
        return;
      }

      const next = data.stats as Stats | undefined;
      if (next) setStats(next);
      setFeedback({
        id: item.id,
        kind: "ok",
        message: `[OK] ACQUIRED ${item.name.toUpperCase()} -${item.cost}¢`,
      });
      startTransition(() => router.refresh());
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <WalletStrip stats={stats} />

      {(["STIM", "HARDWARE", "SOFTWARE"] as Category[]).map((cat) => {
        const list = grouped[cat];
        if (list.length === 0) return null;
        const meta = CATEGORY_META[cat];
        const CatIcon = meta.icon;
        return (
          <section key={cat} className="space-y-3">
            <h3
              className={`flex items-center gap-2 text-sm font-bold tracking-widest ${meta.accent.text}`}
            >
              <CatIcon size={14} aria-hidden />
              {meta.label}
              <span className="ml-2 h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {list.map((item) => {
                const broke = stats.creds < item.cost;
                const disabled = broke || pendingId !== null;
                const fb = feedback?.id === item.id ? feedback : null;
                const visual = getShopVisual(item.slug);
                const Icon = visual.icon;
                return (
                  <article
                    key={item.id}
                    className={`group relative overflow-hidden rounded-md border border-zinc-800 bg-zinc-950/80 transition ${
                      disabled
                        ? ""
                        : "hover:border-fuchsia-400/60 hover:shadow-[0_0_24px_rgba(217,70,239,0.25)]"
                    }`}
                  >
                    <div
                      className={`relative flex h-24 items-center justify-center border-b border-zinc-800 bg-gradient-to-b ${meta.accent.grad}`}
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
                        size={48}
                        strokeWidth={1.25}
                        className={`${meta.accent.text} ${meta.accent.glow} transition group-hover:scale-110`}
                        aria-hidden
                      />
                      <span
                        className={`absolute left-2 top-2 rounded-sm border bg-black/60 px-1.5 py-0.5 text-[9px] font-bold tracking-[0.2em] ${meta.accent.border} ${meta.accent.text}`}
                      >
                        {visual.tier}
                      </span>
                      <span className="absolute right-2 top-2 rounded-sm border border-emerald-500/40 bg-black/60 px-2 py-0.5 text-[10px] font-bold tracking-widest text-emerald-300">
                        {item.cost.toLocaleString()}¢
                      </span>
                    </div>

                    <div className="p-4">
                      <h4
                        className={`text-sm font-bold tracking-widest ${meta.accent.text}`}
                      >
                        {item.name}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                        {item.description}
                      </p>

                      <ul className="mt-3 space-y-0.5 text-[10px] tracking-widest text-zinc-500">
                        {item.bandwidthRestore > 0 && (
                          <li className="text-cyan-300">
                            + {item.bandwidthRestore} BANDWIDTH
                          </li>
                        )}
                        {item.hardwareDelta > 0 && (
                          <li className="text-amber-300">
                            + {item.hardwareDelta} HARDWARE LVL
                          </li>
                        )}
                        {item.softwareDelta > 0 && (
                          <li className="text-fuchsia-300">
                            + {item.softwareDelta} SOFTWARE LVL
                          </li>
                        )}
                      </ul>

                      <button
                        type="button"
                        onClick={() => buy(item)}
                        disabled={disabled}
                        className={`mt-4 w-full rounded-sm border py-2 text-xs font-bold tracking-[0.3em] transition ${
                          disabled
                            ? "cursor-not-allowed border-zinc-800 bg-zinc-900/40 text-zinc-600"
                            : `${meta.accent.border} bg-gradient-to-r ${meta.accent.grad} ${meta.accent.text} hover:brightness-125`
                        }`}
                      >
                        {pendingId === item.id
                          ? "ACQUIRING..."
                          : broke
                            ? "// INSUFFICIENT CREDS"
                            : "> ACQUIRE"}
                      </button>

                      {fb && (
                        <p
                          className={`mt-3 rounded-sm border px-2 py-1 text-[11px] tracking-wide ${
                            fb.kind === "ok"
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                              : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                          }`}
                        >
                          {fb.message}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function WalletStrip({ stats }: { stats: Stats }) {
  const bwPct = Math.min(
    100,
    Math.max(0, Math.round((stats.bandwidth / stats.bandwidthMax) * 100))
  );
  return (
    <div className="rounded-md border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-500/10 via-black/60 to-cyan-500/10 p-4">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs tracking-widest">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">WALLET</span>
          <span className="text-lg font-bold tabular-nums text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]">
            {stats.creds.toLocaleString()}¢
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">BW</span>
          <div className="relative h-1.5 w-28 overflow-hidden rounded bg-zinc-800">
            <div
              className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-[width]"
              style={{ width: `${bwPct}%` }}
            />
          </div>
          <span className="tabular-nums text-cyan-300">
            {stats.bandwidth}/{stats.bandwidthMax}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">HW</span>
          <span className="font-bold text-amber-300">LVL {stats.hardwareLevel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">SW</span>
          <span className="font-bold text-fuchsia-300">LVL {stats.softwareLevel}</span>
        </div>
      </div>
    </div>
  );
}
