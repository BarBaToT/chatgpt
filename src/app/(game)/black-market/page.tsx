import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { ShopList } from "./ShopList";

export default async function BlackMarketPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [user, items] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        creds: true,
        bandwidth: true,
        bandwidthMax: true,
        hardwareLevel: true,
        softwareLevel: true,
      },
    }),
    prisma.shopItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { cost: "asc" }],
    }),
  ]);

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="neon-text-fuchsia text-3xl font-bold tracking-widest text-fuchsia-300">
          {"// BLACK_MARKET"}
        </h2>
        <p className="text-sm text-zinc-500">
          Stims for bandwidth. Hardware and software upgrades to break harder targets.
        </p>
      </header>

      <ShopList
        items={items.map((i) => ({
          id: i.id,
          slug: i.slug,
          name: i.name,
          description: i.description,
          category: i.category,
          cost: i.cost,
          bandwidthRestore: i.bandwidthRestore,
          hardwareDelta: i.hardwareDelta,
          softwareDelta: i.softwareDelta,
        }))}
        initialStats={user}
      />
    </section>
  );
}
