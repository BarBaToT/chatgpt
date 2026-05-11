import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Banknote,
  Cpu,
  Code2,
  Coins,
  type LucideIcon,
  ShoppingBag,
  Skull,
  Trophy,
  Zap,
} from "lucide-react";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActionVisual } from "@/lib/visuals";

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
      <HeroBanner username={user.username} streetRep={user.streetRep} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Coins}
          label="CREDS"
          value={`${user.creds.toLocaleString()}¢`}
          tone="emerald"
        />
        <StatCard
          icon={Trophy}
          label="STREET_REP"
          value={user.streetRep.toLocaleString()}
          tone="fuchsia"
        />
        <StatCard
          icon={Cpu}
          label="HARDWARE"
          value={`LVL ${user.hardwareLevel}`}
          tone="amber"
        />
        <StatCard
          icon={Code2}
          label="SOFTWARE"
          value={`LVL ${user.softwareLevel}`}
          tone="cyan"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="// QUICK_ACTIONS" accent="cyan">
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/grid"
                className="group flex items-center justify-between gap-3 rounded-sm border border-cyan-500/30 bg-black/40 px-4 py-3 text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/10"
              >
                <span className="flex items-center gap-2">
                  <Zap size={14} aria-hidden className="text-cyan-300" />
                  &gt; ENTER THE GRID
                </span>
                <span className="text-xs text-zinc-500">
                  bandwidth {user.bandwidth}/{user.bandwidthMax}
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/black-market"
                className="group flex items-center justify-between gap-3 rounded-sm border border-fuchsia-500/30 bg-black/40 px-4 py-3 text-fuchsia-300 transition hover:border-fuchsia-400 hover:bg-fuchsia-500/10"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag size={14} aria-hidden className="text-fuchsia-300" />
                  &gt; OPEN BLACK MARKET
                </span>
                <span className="text-xs text-zinc-500">spend creds</span>
              </Link>
            </li>
          </ul>
        </Panel>

        <Panel title="// RECENT_OPS" accent="fuchsia">
          {recentLogs.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No recorded ops yet. Hit the grid, choomba.
            </p>
          ) : (
            <ul className="space-y-1 text-xs">
              {recentLogs.map((log) => {
                const visual = getActionVisual(log.action.slug);
                const Icon = visual.icon;
                return (
                  <li
                    key={log.id}
                    className="flex items-center justify-between gap-3 rounded-sm border border-zinc-800 bg-black/40 px-3 py-2"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon
                        size={12}
                        aria-hidden
                        className={
                          log.success ? "text-emerald-400" : "text-rose-400"
                        }
                      />
                      <span className="truncate text-zinc-300">
                        {log.action.targetName}
                      </span>
                    </span>
                    <span
                      className={[
                        "ml-3 flex shrink-0 items-center gap-1 tabular-nums",
                        log.success ? "text-emerald-400" : "text-rose-400",
                      ].join(" ")}
                    >
                      {log.success ? (
                        <>
                          <Banknote size={11} aria-hidden /> +{log.credsDelta}¢ / +
                          {log.repDelta}rep
                        </>
                      ) : (
                        <>
                          <Skull size={11} aria-hidden /> [FAIL] {log.roll}/{log.finalRate}
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </section>
  );
}

function rankFromRep(rep: number) {
  if (rep >= 200) return { tier: "KINGPIN", color: "text-fuchsia-300", level: 5 };
  if (rep >= 100) return { tier: "FIXER", color: "text-rose-300", level: 4 };
  if (rep >= 40) return { tier: "OPERATOR", color: "text-amber-300", level: 3 };
  if (rep >= 10) return { tier: "RUNNER", color: "text-emerald-300", level: 2 };
  return { tier: "GHOST", color: "text-cyan-300", level: 1 };
}

function HeroBanner({
  username,
  streetRep,
}: {
  username: string;
  streetRep: number;
}) {
  const rank = rankFromRep(streetRep);

  return (
    <section className="relative overflow-hidden rounded-md border border-cyan-500/30 bg-gradient-to-br from-fuchsia-500/10 via-black/60 to-cyan-500/10">
      {/* Cyberpunk skyline SVG */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(SKYLINE_SVG)}")`,
          backgroundSize: "cover",
          backgroundPosition: "bottom center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px)",
        }}
      />
      <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] tracking-[0.4em] text-cyan-300/80">
            {"// NEON_SYNDICATE // NIGHT_CITY GRID"}
          </p>
          <h2 className="neon-text mt-1 text-3xl font-bold tracking-widest text-cyan-300 md:text-4xl">
            JACK-IN COMPLETE
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Welcome back, <span className="text-cyan-300">@{username}</span>. Stay
            frosty.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-end">
          <div className="text-right">
            <p className="text-[9px] tracking-[0.3em] text-zinc-500">RANK</p>
            <p className={`text-lg font-bold tracking-widest ${rank.color}`}>
              {rank.tier}
            </p>
            <p className="text-[10px] tracking-widest text-zinc-500">
              TIER {rank.level} · {streetRep} REP
            </p>
          </div>
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-md border ${rank.color} border-current bg-black/60 text-xl font-bold ${rank.color} drop-shadow-[0_0_8px_currentColor]`}
          >
            {username.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "emerald" | "fuchsia" | "amber" | "cyan";
}) {
  const colors = {
    emerald: {
      ring: "border-emerald-500/40",
      text: "text-emerald-300",
      grad: "from-emerald-500/20",
      glow: "drop-shadow-[0_0_10px_rgba(16,185,129,0.45)]",
    },
    fuchsia: {
      ring: "border-fuchsia-500/40",
      text: "text-fuchsia-300",
      grad: "from-fuchsia-500/20",
      glow: "drop-shadow-[0_0_10px_rgba(217,70,239,0.45)]",
    },
    amber: {
      ring: "border-amber-500/40",
      text: "text-amber-300",
      grad: "from-amber-500/20",
      glow: "drop-shadow-[0_0_10px_rgba(245,158,11,0.45)]",
    },
    cyan: {
      ring: "border-cyan-500/40",
      text: "text-cyan-300",
      grad: "from-cyan-500/20",
      glow: "drop-shadow-[0_0_10px_rgba(34,211,238,0.45)]",
    },
  } as const;
  const c = colors[tone];
  return (
    <div
      className={`relative overflow-hidden rounded-md border bg-black/40 px-4 py-3 ${c.ring}`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${c.grad} via-transparent to-transparent opacity-60`}
      />
      <div className="relative flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-widest text-zinc-500">{label}</div>
          <div className={`mt-1 text-2xl font-bold tabular-nums ${c.text}`}>
            {value}
          </div>
        </div>
        <Icon size={28} strokeWidth={1.25} className={`${c.text} ${c.glow}`} aria-hidden />
      </div>
    </div>
  );
}

function Panel({
  title,
  accent,
  children,
}: {
  title: string;
  accent: "cyan" | "fuchsia";
  children: React.ReactNode;
}) {
  const border =
    accent === "cyan" ? "border-cyan-500/30" : "border-fuchsia-500/30";
  const text = accent === "cyan" ? "text-cyan-300" : "text-fuchsia-300";
  return (
    <section className={`rounded-md border bg-black/30 p-5 ${border}`}>
      <h3 className={`mb-3 text-sm font-bold tracking-widest ${text}`}>{title}</h3>
      {children}
    </section>
  );
}

const SKYLINE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 220' preserveAspectRatio='xMidYEnd slice'>
  <defs>
    <linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='#0b0b1a' stop-opacity='0'/>
      <stop offset='100%' stop-color='#0b0b1a' stop-opacity='0.9'/>
    </linearGradient>
    <linearGradient id='neonC' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='#22d3ee' stop-opacity='0.5'/>
      <stop offset='100%' stop-color='#22d3ee' stop-opacity='0'/>
    </linearGradient>
    <linearGradient id='neonF' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='#d946ef' stop-opacity='0.45'/>
      <stop offset='100%' stop-color='#d946ef' stop-opacity='0'/>
    </linearGradient>
  </defs>
  <rect width='800' height='220' fill='url(#sky)'/>
  <!-- distant towers -->
  <g fill='#0f172a' opacity='0.9'>
    <rect x='20' y='90' width='30' height='130'/>
    <rect x='60' y='110' width='40' height='110'/>
    <rect x='110' y='70' width='25' height='150'/>
    <rect x='150' y='100' width='50' height='120'/>
    <rect x='210' y='80' width='30' height='140'/>
    <rect x='250' y='115' width='35' height='105'/>
    <rect x='300' y='60' width='40' height='160'/>
    <rect x='350' y='95' width='28' height='125'/>
    <rect x='390' y='110' width='42' height='110'/>
    <rect x='445' y='75' width='30' height='145'/>
    <rect x='485' y='100' width='45' height='120'/>
    <rect x='540' y='85' width='30' height='135'/>
    <rect x='580' y='115' width='38' height='105'/>
    <rect x='625' y='95' width='30' height='125'/>
    <rect x='665' y='75' width='40' height='145'/>
    <rect x='715' y='105' width='32' height='115'/>
    <rect x='755' y='90' width='28' height='130'/>
  </g>
  <!-- neon glows behind buildings -->
  <rect x='110' y='40' width='25' height='30' fill='url(#neonC)'/>
  <rect x='300' y='30' width='40' height='30' fill='url(#neonF)'/>
  <rect x='445' y='45' width='30' height='30' fill='url(#neonC)'/>
  <rect x='665' y='45' width='40' height='30' fill='url(#neonF)'/>
  <!-- windows -->
  <g fill='#22d3ee' opacity='0.6'>
    <rect x='28' y='110' width='3' height='4'/>
    <rect x='36' y='130' width='3' height='4'/>
    <rect x='28' y='150' width='3' height='4'/>
    <rect x='118' y='90' width='3' height='4'/>
    <rect x='126' y='110' width='3' height='4'/>
    <rect x='118' y='140' width='3' height='4'/>
    <rect x='216' y='100' width='3' height='4'/>
    <rect x='224' y='130' width='3' height='4'/>
    <rect x='308' y='80' width='3' height='4'/>
    <rect x='316' y='110' width='3' height='4'/>
    <rect x='324' y='140' width='3' height='4'/>
    <rect x='452' y='90' width='3' height='4'/>
    <rect x='460' y='120' width='3' height='4'/>
    <rect x='548' y='100' width='3' height='4'/>
    <rect x='556' y='130' width='3' height='4'/>
    <rect x='672' y='90' width='3' height='4'/>
    <rect x='680' y='120' width='3' height='4'/>
    <rect x='688' y='150' width='3' height='4'/>
    <rect x='760' y='110' width='3' height='4'/>
  </g>
  <g fill='#d946ef' opacity='0.6'>
    <rect x='66' y='130' width='3' height='4'/>
    <rect x='160' y='120' width='3' height='4'/>
    <rect x='256' y='130' width='3' height='4'/>
    <rect x='358' y='110' width='3' height='4'/>
    <rect x='400' y='130' width='3' height='4'/>
    <rect x='495' y='115' width='3' height='4'/>
    <rect x='590' y='135' width='3' height='4'/>
    <rect x='635' y='110' width='3' height='4'/>
    <rect x='725' y='125' width='3' height='4'/>
  </g>
  <!-- antenna lights -->
  <circle cx='120' cy='65' r='1.5' fill='#22d3ee'/>
  <circle cx='318' cy='55' r='1.5' fill='#d946ef'/>
  <circle cx='460' cy='70' r='1.5' fill='#22d3ee'/>
  <circle cx='680' cy='70' r='1.5' fill='#d946ef'/>
</svg>`;
