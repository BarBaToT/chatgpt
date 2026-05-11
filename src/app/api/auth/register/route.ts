import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

const Body = z.object({
  username: z
    .string()
    .min(3, "Min 3 chars")
    .max(24, "Max 24 chars")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, digits, underscore only"),
  password: z.string().min(8, "Min 8 chars").max(128, "Max 128 chars"),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_BODY", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { username, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash: await hashPassword(password),
    },
    select: { id: true, username: true },
  });

  await createSession(user.id);
  return NextResponse.json({ user });
}
