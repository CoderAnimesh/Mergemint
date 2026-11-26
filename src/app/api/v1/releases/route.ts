import { NextRequest, NextResponse } from "next/server";
import { authenticateBearerToken } from "@/lib/api-auth";
import { generateChangelogFromCommits } from "@/lib/gemini";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateBearerToken(req);
    if (!auth.valid) {
      return NextResponse.json(
        { error: "Unauthorized. Provide a valid Bearer API token." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as {
      projectSlug?: string;
      version?: string;
      publish?: boolean;
      commits: Array<{ sha?: string; message: string; author?: string; diff?: string }>;
    };

    if (!Array.isArray(body.commits) || body.commits.length === 0) {
      return NextResponse.json(
        { error: "Request body must include a non-empty commits array." },
        { status: 400 }
      );
    }

    const slug = body.projectSlug || "acme-cloud";
    const generated = await generateChangelogFromCommits(body.commits, slug);
    const version = body.version || generated.versionSuggestion;
    let id = `rel_${Date.now()}`;

    if (isDatabaseConfigured()) {
      const project = await prisma.project.findUnique({ where: { slug } });
      if (project) {
        const created = await prisma.changelog.create({
          data: {
            projectId: project.id,
            version,
            title: generated.title,
            summary: generated.summary,
            features: generated.features,
            improvements: generated.improvements,
            bugFixes: generated.bugFixes,
            rawCommits: body.commits as unknown as object,
            status: body.publish ? "PUBLISHED" : "DRAFT",
            publishedAt: body.publish ? new Date() : null,
          },
        });
        id = created.id;
      }
    }

    return NextResponse.json({
      ok: true,
      id,
      version,
      ...generated,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Release generation failed" },
      { status: 400 }
    );
  }
}
