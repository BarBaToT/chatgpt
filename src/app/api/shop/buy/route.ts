import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export const runtime = "nodejs";

const Body = z.object({ itemId: z.string().min(1) });

class ShopError extends Error {
  constructor(
    public code: string,
    public status: number,
    public meta: Record<string, unknown> = {},
  ) {
    super(code);
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new ShopError("USER_NOT_FOUND", 404);

      const item = await tx.shopItem.findUnique({
        where: { id: parsed.data.itemId },
      });
      if (!item || !item.isActive) {
        throw new ShopError("ITEM_NOT_FOUND", 404);
      }

      if (user.creds < item.cost) {
        throw new ShopError("INSUFFICIENT_CREDS", 400, {
          required: item.cost,
          have: user.creds,
        });
      }

      const newBandwidth = Math.min(
        user.bandwidthMax,
        user.bandwidth + item.bandwidthRestore,
      );

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          creds: { decrement: item.cost },
          bandwidth: newBandwidth,
          hardwareLevel: { increment: item.hardwareDelta },
          softwareLevel: { increment: item.softwareDelta },
        },
        select: {
          creds: true,
          streetRep: true,
          bandwidth: true,
          bandwidthMax: true,
          hardwareLevel: true,
          softwareLevel: true,
        },
      });

      return { item, stats: updated };
    });

    return NextResponse.json({
      purchased: {
        slug: result.item.slug,
        name: result.item.name,
        cost: result.item.cost,
      },
      stats: result.stats,
    });
  } catch (err) {
    if (err instanceof ShopError) {
      return NextResponse.json(
        { error: err.code, ...err.meta },
        { status: err.status },
      );
    }
    console.error("shop/buy internal error", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
