import { NextRequest, NextResponse } from "next/server";
import { DEMO_CHANGELOGS } from "@/lib/mock-data";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const projectSlug = req.nextUrl.searchParams.get("project") || "acme-cloud";
  const status = req.nextUrl.searchParams.get("status");

  if (isDatabaseConfigured()) {
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
      include: {
        changelogs: {
          where: status
            ? { status: status.toUpperCase() === "DRAFT" ? "DRAFT" : "PUBLISHED" }
            : undefined,
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (project) {
      return NextResponse.json({
        ok: true,
        project: projectSlug,
        projectName: project.name,
        projectDescription: project.description,
        count: project.changelogs.length,
        changelogs: project.changelogs,
      });
    }
    return NextResponse.json({
      ok: true,
      project: projectSlug,
      count: 0,
      changelogs: [],
    });
  }

  const filtered = status
    ? DEMO_CHANGELOGS.filter((c) => c.status === status.toUpperCase())
    : DEMO_CHANGELOGS;

  return NextResponse.json({
    ok: true,
    project: projectSlug,
    count: filtered.length,
    changelogs: filtered,
  });
}
