import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [user, recentLogs] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.hackLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { action: true },
    }),
  ]);

  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h2 className="neon-text text-3xl font-bold tracking-widest text-cyan-300">
          {"// DASHBOARD"}
        </h2>
        <p className="text-sm text-zinc-500">
          Welcome back, <span className="text-cyan-300">@{user.username}</span>. Stay
          frosty.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="CREDS" value={`${user.creds.toLocaleString()}¢`} tone="emerald" />
        <StatCard
          label="STREET_REP"
          value={user.streetRep.toLocaleString()}
          tone="fuchsia"
        />
        <StatCard
          label="HARDWARE"
          value={`LVL ${user.hardwareLevel}`}
          tone="amber"
        />
        <StatCard
          label="SOFTWARE"
          value={`LVL ${user.softwareLevel}`}
          tone="cyan"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="// QUICK_ACTIONS">
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/grid"
                className="flex items-center justify-between rounded-sm border border-cyan-500/30 bg-black/30 px-4 py-3 text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/10"
              >
                <span>&gt; ENTER THE GRID</span>
                <span className="text-xs text-zinc-500">
                  bandwidth {user.bandwidth}/{user.bandwidthMax}
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/black-market"
                className="flex items-center justify-between rounded-sm border border-fuchsia-500/30 bg-black/30 px-4 py-3 text-fuchsia-300 transition hover:border-fuchsia-400 hover:bg-fuchsia-500/10"
              >
                <span>&gt; OPEN BLACK MARKET</span>
                <span className="text-xs text-zinc-500">spend creds</span>
              </Link>
            </li>
          </ul>
        </Panel>

        <Panel title="// RECENT_OPS">
          {recentLogs.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No recorded ops yet. Hit the grid, choomba.
            </p>
          ) : (
            <ul className="space-y-1 text-xs">
              {recentLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between rounded-sm border border-zinc-800 bg-black/40 px-3 py-2"
                >
                  <span className="truncate text-zinc-300">
                    {log.action.targetName}
                  </span>
                  <span
                    className={[
                      "ml-3 shrink-0 tabular-nums",
                      log.success ? "text-emerald-400" : "text-rose-400",
                    ].join(" ")}
                  >
                    {log.success
                      ? `+${log.credsDelta}¢ / +${log.repDelta}rep`
                      : `[FAIL] roll ${log.roll}/${log.finalRate}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "fuchsia" | "amber" | "cyan";
}) {
  const colors = {
    emerald: "border-emerald-500/30 text-emerald-300",
    fuchsia: "border-fuchsia-500/30 text-fuchsia-300",
    amber: "border-amber-500/30 text-amber-300",
    cyan: "border-cyan-500/30 text-cyan-300",
  } as const;

  return (
    <div
      className={`rounded-sm border bg-black/40 px-4 py-3 ${colors[tone]}`}
    >
      <div className="text-[10px] tracking-widest text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-cyan-500/20 bg-black/30 p-5">
      <h3 className="mb-3 text-sm font-bold tracking-widest text-cyan-300">
        {title}
      </h3>
      {children}
    </section>
  );
}
