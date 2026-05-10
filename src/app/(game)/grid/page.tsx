import { redirect } from "next/navigation";
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
      <header className="space-y-1">
        <h2 className="neon-text text-3xl font-bold tracking-widest text-cyan-300">
          {"// THE_GRID"}
        </h2>
        <p className="text-sm text-zinc-500">
          Pick a target. Burn bandwidth. Walk away rich, or get traced into system
          lockout.
        </p>
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
