import { redirect } from "next/navigation";
import { Crosshair } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { GridList } from "./GridList";

export default async function GridPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [user, actions] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        bandwidth: true,
        bandwidthMax: true,
        softwareLevel: true,
        lockedUntil: true,
      },
    }),
    prisma.action.findMany({
      where: { isActive: true },
      orderBy: [{ requiredSoftwareReq: "asc" }, { energyCost: "asc" }],
    }),
  ]);

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-md border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-black/40 to-fuchsia-500/10 p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)",
          }}
        />
        <div className="relative flex items-start gap-3">
          <Crosshair
            size={28}
            strokeWidth={1.25}
            aria-hidden
            className="mt-1 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
          />
          <div>
            <p className="text-[10px] tracking-[0.4em] text-cyan-300/80">
              {"// TARGET_LIST"}
            </p>
            <h2 className="neon-text mt-1 text-3xl font-bold tracking-widest text-cyan-300">
              THE GRID
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Pick a target. Burn bandwidth. Walk away rich, or get traced into
              system lockout.
            </p>
          </div>
        </div>
      </header>

      <GridList
        actions={actions.map((a) => ({
          id: a.id,
          slug: a.slug,
          targetName: a.targetName,
          description: a.description,
          energyCost: a.energyCost,
          requiredSoftwareReq: a.requiredSoftwareReq,
          successRateBase: a.successRateBase,
          rewardCredsMin: a.rewardCredsMin,
          rewardCredsMax: a.rewardCredsMax,
          rewardRep: a.rewardRep,
        }))}
        initialBandwidth={user.bandwidth}
        softwareLevel={user.softwareLevel}
        initialLockedUntil={user.lockedUntil ? user.lockedUntil.toISOString() : null}
      />
    </section>
  );
}
