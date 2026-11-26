import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { generateChangelogFromCommits, filterMeaningfulCommits } from "@/lib/gemini";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

function verifyGithubSignature(payload: string, signatureHeader: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || secret === "whsec_your_github_webhook_secret") {
    return true; // Allow local unsigned simulation when secret is not configured
  }
  if (!signatureHeader) return false;
  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;
  const sigBuf = Buffer.from(signatureHeader);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event") || "push";

  if (!verifyGithubSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody) as {
      repository?: { full_name?: string; name?: string };
      commits?: Array<{ id?: string; message: string; author?: { name?: string }; timestamp?: string }>;
      pull_request?: { title?: string; body?: string; merged?: boolean; merge_commit_sha?: string };
    };

    const repoFullName = body.repository?.full_name || "acme-corp/acme-cloud";
    const rawCommits =
      body.commits?.map((c) => ({
        sha: c.id,
        message: c.message,
        author: c.author?.name,
        timestamp: c.timestamp,
      })) ||
      (body.pull_request?.title
        ? [
            {
              sha: body.pull_request.merge_commit_sha,
              message: body.pull_request.title,
              diff: body.pull_request.body || "",
            },
          ]
        : []);

    const filtered = filterMeaningfulCommits(rawCommits);
    if (filtered.length === 0) {
      return NextResponse.json({
        ok: true,
        event,
        skipped: true,
        reason: "No user-facing commits after noise filtering.",
      });
    }

    const generated = await generateChangelogFromCommits(
      filtered,
      body.repository?.name || repoFullName
    );

    let savedId: string | null = null;
    if (isDatabaseConfigured()) {
      const project = await prisma.project.findFirst({
        where: { githubRepo: repoFullName },
      });
      if (project) {
        const draft = await prisma.changelog.create({
          data: {
            projectId: project.id,
            version: generated.versionSuggestion,
            title: generated.title,
            summary: generated.summary,
            features: generated.features,
            improvements: generated.improvements,
            bugFixes: generated.bugFixes,
            rawCommits: filtered as unknown as object,
            status: "DRAFT",
          },
        });
        savedId = draft.id;
      }
    }

    return NextResponse.json({
      ok: true,
      event,
      repository: repoFullName,
      draftId: savedId || `draft_${Date.now()}`,
      changelog: generated,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
  }
}

