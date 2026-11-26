import { NextRequest, NextResponse } from "next/server";
import { DEMO_CHANGELOGS } from "@/lib/mock-data";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(req: NextRequest) {
  const projectSlug = req.nextUrl.searchParams.get("project") || "acme-cloud";
  const baseUrl = process.env.NEXT_APP_URL || "http://localhost:3000";

  let entries = DEMO_CHANGELOGS.filter((c) => c.status === "PUBLISHED").map((c) => ({
    id: c.id,
    version: c.version,
    title: c.title,
    summary: c.summary,
    publishedAt: c.publishedAt,
  }));

  if (isDatabaseConfigured()) {
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
      include: {
        changelogs: {
          where: { status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          take: 25,
        },
      },
    });
    if (project) {
      entries = project.changelogs.map((c) => ({
        id: c.id,
        version: c.version,
        title: c.title,
        summary: c.summary,
        publishedAt: (c.publishedAt || c.createdAt).toUTCString(),
      }));
    }
  }

  const itemsXml = entries
    .map(
      (entry) => `
    <item>
      <title>${escapeXml(`${entry.version} — ${entry.title}`)}</title>
      <link>${escapeXml(`${baseUrl}/${projectSlug}/changelog`)}</link>
      <guid isPermaLink="false">${escapeXml(entry.id)}</guid>
      <description>${escapeXml(entry.summary)}</description>
      <pubDate>${escapeXml(entry.publishedAt)}</pubDate>
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${projectSlug} Changelog — MergeMint`)}</title>
    <link>${escapeXml(`${baseUrl}/${projectSlug}/changelog`)}</link>
    <description>Automated product changelog powered by MergeMint</description>
    ${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=300, stale-while-revalidate",
    },
  });
}

