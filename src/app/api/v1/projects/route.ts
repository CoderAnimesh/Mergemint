import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { enforceGracePeriodForWorkspace } from "@/lib/billing";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { DEMO_PROJECTS } from "@/lib/mock-data";

const PLAN_REPO_LIMITS: Record<string, number> = {
  HOBBY: 1,
  PRO: 10,
  TEAM: Number.POSITIVE_INFINITY,
};

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, projects: DEMO_PROJECTS, plan: "HOBBY" });
  }

  try {
    const sessionUser = await getSessionUser();
    const workspace = sessionUser?.email
      ? await prisma.workspace.findFirst({
          where: { owner: { email: sessionUser.email } },
          include: { projects: { orderBy: { createdAt: "desc" } } },
        })
      : null;

    if (workspace) {
      const updatedWs = await enforceGracePeriodForWorkspace(workspace.id);
      return NextResponse.json({
        ok: true,
        projects: workspace.projects,
        plan: updatedWs?.plan || workspace.plan,
      });
    }

    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, projects, plan: "HOBBY" });
  } catch {
    return NextResponse.json({
      ok: true,
      projects: [],
      plan: "HOBBY",
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      slug?: string;
      githubRepo?: string;
      description?: string;
      defaultBranch?: string;
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
          defaultBranch: body.defaultBranch || "main",
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
        name: sessionUser?.name || "MergeMint Developer",
      },
    });

    let workspace = await prisma.workspace.findFirst({
      where: { ownerId: user.id },
      include: { projects: true },
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: `${user.name || "My"} Workspace`,
          slug: `ws-${user.id.slice(0, 8)}`,
          ownerId: user.id,
          plan: "HOBBY",
        },
        include: { projects: true },
      });
    }

    const limit = PLAN_REPO_LIMITS[workspace.plan] ?? 1;
    const alreadyConnected = workspace.projects.some(
      (p) => p.githubRepo === body.githubRepo || p.slug === slug
    );

    if (!alreadyConnected && workspace.projects.length >= limit) {
      return NextResponse.json(
        {
          error: `Your ${workspace.plan === "HOBBY" ? "Free" : workspace.plan} plan allows up to ${limit} connected repository. Upgrade to Pro or Ultra in Settings to connect more.`,
          code: "PLAN_LIMIT_REACHED",
          plan: workspace.plan,
        },
        { status: 403 }
      );
    }

    const project = await prisma.project.upsert({
      where: { slug },
      update: {
        githubRepo: body.githubRepo,
        description: body.description,
        defaultBranch: body.defaultBranch || "main",
      },
      create: {
        name,
        slug,
        githubRepo: body.githubRepo,
        description: body.description || "Connected via MergeMint",
        defaultBranch: body.defaultBranch || "main",
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
