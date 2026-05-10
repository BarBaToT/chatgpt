"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

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

const CATEGORY_LABEL: Record<Category, string> = {
  STIM: "// CYBER_STIMS",
  HARDWARE: "// HARDWARE",
  SOFTWARE: "// SOFTWARE",
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
      <p className="rounded-sm border border-fuchsia-500/30 bg-black/40 px-4 py-2 text-xs tracking-widest text-fuchsia-200">
        WALLET: <span className="text-emerald-300">{stats.creds.toLocaleString()}¢</span>
        <span className="mx-3 text-zinc-700">|</span>
        BW: <span className="text-cyan-300">{stats.bandwidth}/{stats.bandwidthMax}</span>
        <span className="mx-3 text-zinc-700">|</span>
        HW: <span className="text-amber-300">LVL {stats.hardwareLevel}</span>
        <span className="mx-3 text-zinc-700">|</span>
        SW: <span className="text-cyan-300">LVL {stats.softwareLevel}</span>
      </p>

      {(["STIM", "HARDWARE", "SOFTWARE"] as Category[]).map((cat) => {
        const list = grouped[cat];
        if (list.length === 0) return null;
        return (
          <section key={cat} className="space-y-3">
            <h3 className="text-sm font-bold tracking-widest text-fuchsia-300">
              {CATEGORY_LABEL[cat]}
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {list.map((item) => {
                const broke = stats.creds < item.cost;
                const disabled = broke || pendingId !== null;
                const fb = feedback?.id === item.id ? feedback : null;
                return (
                  <article
                    key={item.id}
                    className="rounded-sm border border-fuchsia-500/20 bg-black/40 p-4 transition hover:border-fuchsia-400/60 hover:shadow-[0_0_20px_rgba(217,70,239,0.15)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold tracking-widest text-fuchsia-200">
                          {item.name}
                        </h4>
                        <p className="mt-1 text-xs text-zinc-500">
                          {item.description}
                        </p>
                      </div>
                      <span className="rounded-sm border border-emerald-500/40 px-2 py-0.5 text-[10px] tracking-widest text-emerald-300">
                        {item.cost.toLocaleString()}¢
                      </span>
                    </div>

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
                        <li className="text-cyan-300">
                          + {item.softwareDelta} SOFTWARE LVL
                        </li>
                      )}
                    </ul>

                    <button
                      type="button"
                      onClick={() => buy(item)}
                      disabled={disabled}
                      className="mt-4 w-full rounded-sm border border-fuchsia-400/50 bg-fuchsia-500/10 py-2 text-xs font-bold tracking-[0.3em] text-fuchsia-200 transition hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-transparent disabled:text-zinc-600"
                    >
                      {pendingId === item.id
                        ? "ACQUIRING..."
                        : broke
                          ? "// INSUFFICIENT CREDS"
                          : "> ACQUIRE"}
                    </button>

                    {fb && (
                      <p
                        className={[
                          "mt-3 text-xs tracking-wide",
                          fb.kind === "ok" ? "text-emerald-400" : "text-rose-400",
                        ].join(" ")}
                      >
                        {fb.message}
                      </p>
                    )}
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
