import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { DEMO_PROJECTS } from "@/lib/mock-data";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, projects: DEMO_PROJECTS });
  }

  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, projects });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      slug?: string;
      githubRepo?: string;
      description?: string;
    };

    if (!body.githubRepo && !body.slug) {
      return NextResponse.json(
        { error: "githubRepo or slug is required" },
        { status: 400 }
      );
    }

    const slug = (
      body.slug ||
      body.githubRepo?.split("/").pop() ||
      "new-project"
    )
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");

    const name =
      body.name ||
      slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        project: {
          id: `proj_${Date.now()}`,
          name,
          slug,
          githubRepo: body.githubRepo || `acme-corp/${slug}`,
          description: body.description || "Connected repository",
          defaultBranch: "main",
          webhookStatus: "active",
          lastSync: "Just now",
        },
      });
    }

    const sessionUser = await getSessionUser();
    const user = await prisma.user.upsert({
      where: { email: sessionUser?.email || "founder@acme.dev" },
      update: {},
      create: {
        email: sessionUser?.email || "founder@acme.dev",
        name: sessionUser?.name || "ShipLog Developer",
      },
    });

    const workspace = await prisma.workspace.upsert({
      where: { slug: "default-workspace" },
      update: {},
      create: {
        name: "Default Workspace",
        slug: "default-workspace",
        ownerId: user.id,
      },
    });

    const project = await prisma.project.upsert({
      where: { slug },
      update: {
        githubRepo: body.githubRepo,
        description: body.description,
      },
      create: {
        name,
        slug,
        githubRepo: body.githubRepo,
        description: body.description || "Connected via ShipLog",
        workspaceId: workspace.id,
      },
    });

    return NextResponse.json({ ok: true, project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create project" },
      { status: 400 }
    );
  }
}

