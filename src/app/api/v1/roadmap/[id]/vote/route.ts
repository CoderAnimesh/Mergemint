import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  let delta = 1;
  try {
    const body = (await req.json()) as { delta?: number };
    if (body.delta === -1) delta = -1;
  } catch {
    // default +1
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, id, delta });
  }

  try {
    const updated = await prisma.roadmapItem.update({
      where: { id },
      data: { votes: { increment: delta } },
    });
    return NextResponse.json({ ok: true, item: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Vote update failed" },
      { status: 404 }
    );
  }
}

