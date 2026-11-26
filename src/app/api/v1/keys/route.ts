import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateRawApiKey } from "@/lib/api-auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      keys: [
        {
          id: "key_1",
          name: "MacBook Pro CLI",
          prefix: "sl_live_9f8a...c21d",
          lastUsedAt: new Date().toISOString(),
        },
      ],
    });
  }

  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    include: {
      apiKeys: {
        select: { id: true, name: true, prefix: true, lastUsedAt: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({ ok: true, keys: user?.apiKeys ?? [] });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { name?: string };
  const name = body.name?.trim() || "CLI / IDE Token";
  const { rawToken, keyHash, prefix } = generateRawApiKey();

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        ok: true,
        key: { id: `key_${Date.now()}`, name, prefix },
        rawToken,
      },
      { status: 201 }
    );
  }

  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { email: sessionUser.email },
    update: {},
    create: { email: sessionUser.email, name: sessionUser.name || "Developer" },
  });

  const created = await prisma.apiKey.create({
    data: {
      name,
      keyHash,
      prefix,
      userId: user.id,
    },
    select: { id: true, name: true, prefix: true, createdAt: true },
  });

  return NextResponse.json(
    { ok: true, key: created, rawToken },
    { status: 201 }
  );
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, id });
  }

  await prisma.apiKey.delete({ where: { id } });
  return NextResponse.json({ ok: true, id });
}

