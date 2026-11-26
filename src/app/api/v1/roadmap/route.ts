import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { DEMO_ROADMAP_ITEMS } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  const projectSlug = req.nextUrl.searchParams.get("project") || "acme-cloud";

  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      projectSlug,
      items: DEMO_ROADMAP_ITEMS,
    });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
      include: {
        roadmapItems: {
          orderBy: [{ votes: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    return NextResponse.json({
      ok: true,
      projectSlug,
      items: project?.roadmapItems ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load roadmap" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      projectSlug?: string;
      title?: string;
      description?: string;
      category?: string;
      authorName?: string;
    };

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const projectSlug = body.projectSlug || "acme-cloud";

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          ok: true,
          item: {
            id: `rm_${Date.now()}`,
            title: body.title.trim(),
            description: body.description?.trim() || "Submitted from roadmap.",
            status: "PLANNED",
            category: body.category || "Feature",
            votes: 1,
            authorName: body.authorName || "community",
            createdAt: new Date().toISOString().slice(0, 10),
          },
        },
        { status: 201 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const item = await prisma.roadmapItem.create({
      data: {
        projectId: project.id,
        title: body.title.trim(),
        description: body.description?.trim() || "Submitted from roadmap.",
        category: body.category || "Feature",
        authorName: body.authorName || "Community",
        status: "PLANNED",
        votes: 1,
      },
    });

    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create item" },
      { status: 400 }
    );
  }
}

