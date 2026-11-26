import { NextRequest, NextResponse } from "next/server";
import { authenticateBearerToken } from "@/lib/api-auth";
import { generateChangelogFromCommits } from "@/lib/gemini";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { DEMO_CHANGELOGS, DEMO_ROADMAP_ITEMS } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  const projectSlug = req.nextUrl.searchParams.get("project") || "acme-cloud";

  if (isDatabaseConfigured()) {
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
      include: {
        changelogs: { orderBy: { createdAt: "desc" }, take: 20 },
        roadmapItems: { orderBy: { votes: "desc" }, take: 20 },
      },
    });
    if (project) {
      return NextResponse.json({
        ok: true,
        projectSlug,
        changelogs: project.changelogs,
        roadmap: project.roadmapItems,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    projectSlug,
    changelogs: DEMO_CHANGELOGS,
    roadmap: DEMO_ROADMAP_ITEMS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateBearerToken(req);
    if (!auth.valid) {
      return NextResponse.json(
        { error: "Invalid or missing Bearer token. Run `mergemint login` first." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as {
      action: "init" | "push" | "status" | "approve";
      projectSlug?: string;
      repoRemote?: string;
      branch?: string;
      draftId?: string;
      commits?: Array<{ sha?: string; message: string; author?: string }>;
    };

    const slug =
      body.projectSlug ||
      body.repoRemote?.split("/").pop()?.replace(/\.git$/, "") ||
      "acme-cloud";

    if (body.action === "init") {
      return NextResponse.json({
        ok: true,
        project: {
          slug,
          repoRemote: body.repoRemote || `github.com/acme-corp/${slug}`,
          branch: body.branch || "main",
          hubUrl: `/${slug}/changelog`,
        },
      });
    }

    if (body.action === "push") {
      const commits = body.commits || [];
      if (commits.length === 0) {
        return NextResponse.json(
          { error: "No commits provided in payload." },
          { status: 400 }
        );
      }

      const generated = await generateChangelogFromCommits(commits, slug);
      let draftId = `draft_${Date.now()}`;

      if (isDatabaseConfigured()) {
        const project = await prisma.project.findUnique({ where: { slug } });
        if (project) {
          const created = await prisma.changelog.create({
            data: {
              projectId: project.id,
              version: generated.versionSuggestion,
              title: generated.title,
              summary: generated.summary,
              features: generated.features,
              improvements: generated.improvements,
              bugFixes: generated.bugFixes,
              rawCommits: commits as unknown as object,
              status: "DRAFT",
            },
          });
          draftId = created.id;
        }
      }

      return NextResponse.json({
        ok: true,
        draftId,
        projectSlug: slug,
        changelog: generated,
      });
    }

    if (body.action === "approve") {
      const draftId = body.draftId || "chg_241_draft";
      if (isDatabaseConfigured() && body.draftId) {
        await prisma.changelog.update({
          where: { id: body.draftId },
          data: { status: "PUBLISHED", publishedAt: new Date() },
        });
      }
      return NextResponse.json({
        ok: true,
        draftId,
        status: "PUBLISHED",
      });
    }

    return NextResponse.json({
      ok: true,
      projectSlug: slug,
      changelogs: DEMO_CHANGELOGS,
      roadmap: DEMO_ROADMAP_ITEMS,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 400 }
    );
  }
}
