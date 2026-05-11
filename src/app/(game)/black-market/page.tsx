import { redirect } from "next/navigation";
import { ShoppingBag } from "lucide-react";
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
      <header className="relative overflow-hidden rounded-md border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-500/10 via-black/40 to-cyan-500/10 p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)",
          }}
        />
        <div className="relative flex items-start gap-3">
          <ShoppingBag
            size={28}
            strokeWidth={1.25}
            aria-hidden
            className="mt-1 text-fuchsia-300 drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]"
          />
          <div>
            <p className="text-[10px] tracking-[0.4em] text-fuchsia-300/80">
              {"// UNDERGROUND_BAZAAR"}
            </p>
            <h2 className="neon-text-fuchsia mt-1 text-3xl font-bold tracking-widest text-fuchsia-300">
              BLACK MARKET
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Stims for bandwidth. Hardware and software upgrades to break harder
              targets.
            </p>
          </div>
        </div>
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
