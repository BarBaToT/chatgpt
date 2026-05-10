import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export const runtime = "nodejs";

const Body = z.object({ actionId: z.string().min(1) });

class HackError extends Error {
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

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new HackError("USER_NOT_FOUND", 404);

      const now = new Date();
      if (user.lockedUntil && user.lockedUntil > now) {
        throw new HackError("SYSTEM_LOCKOUT", 423, {
          lockedUntil: user.lockedUntil.toISOString(),
        });
      }

      const action = await tx.action.findUnique({
        where: { id: parsed.data.actionId },
      });
      if (!action || !action.isActive) {
        throw new HackError("ACTION_NOT_FOUND", 404);
      }

      if (user.softwareLevel < action.requiredSoftwareReq) {
        throw new HackError("SOFTWARE_TOO_LOW", 403, {
          required: action.requiredSoftwareReq,
          have: user.softwareLevel,
        });
      }
      if (user.bandwidth < action.energyCost) {
        throw new HackError("INSUFFICIENT_BANDWIDTH", 400, {
          required: action.energyCost,
          have: user.bandwidth,
        });
      }

      // Success rate scales with software over-leveling, clamped to [5, 95].
      const overLevel = Math.max(0, user.softwareLevel - action.requiredSoftwareReq);
      const bonus = Math.min(40, overLevel * 5);
      const finalRate = Math.max(5, Math.min(95, action.successRateBase + bonus));

      const roll = Math.floor(Math.random() * 100) + 1; // 1..100
      const success = roll <= finalRate;

      let credsDelta = 0;
      let repDelta = 0;
      let lockedUntil: Date | null = null;

      if (success) {
        const span = action.rewardCredsMax - action.rewardCredsMin + 1;
        credsDelta = action.rewardCredsMin + Math.floor(Math.random() * span);
        repDelta = action.rewardRep;
      } else {
        lockedUntil = new Date(now.getTime() + action.lockoutMinutes * 60_000);
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          bandwidth: { decrement: action.energyCost },
          creds: { increment: credsDelta },
          streetRep: { increment: repDelta },
          lockedUntil,
        },
        select: {
          creds: true,
          streetRep: true,
          bandwidth: true,
          bandwidthMax: true,
          lockedUntil: true,
        },
      });

      await tx.hackLog.create({
        data: {
          userId,
          actionId: action.id,
          success,
          roll,
          finalRate,
          credsDelta,
          repDelta,
        },
      });

      return {
        success,
        roll,
        finalRate,
        credsDelta,
        repDelta,
        lockedUntil,
        stats: updated,
      };
    });

    return NextResponse.json({
      success: result.success,
      roll: result.roll,
      successRate: result.finalRate,
      credsGained: result.credsDelta,
      repGained: result.repDelta,
      lockedUntil: result.lockedUntil ? result.lockedUntil.toISOString() : null,
      stats: {
        creds: result.stats.creds,
        streetRep: result.stats.streetRep,
        bandwidth: result.stats.bandwidth,
        bandwidthMax: result.stats.bandwidthMax,
      },
    });
  } catch (err) {
    if (err instanceof HackError) {
      return NextResponse.json({ error: err.code, ...err.meta }, { status: err.status });
    }
    console.error("hack/execute internal error", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
