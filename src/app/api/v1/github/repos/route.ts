import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export interface GitHubRepoSummary {
  id: number;
  fullName: string;
  name: string;
  private: boolean;
  defaultBranch: string;
  description: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || "mergemint-dev-fallback-secret-change-me",
    });

    const accessToken = token?.accessToken as string | undefined;
    if (!accessToken) {
      return NextResponse.json({
        ok: true,
        authenticated: false,
        repos: [] as GitHubRepoSummary[],
      });
    }

    const res = await fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub API returned ${res.status}` },
        { status: res.status }
      );
    }

    const rawRepos = (await res.json()) as Array<{
      id: number;
      full_name: string;
      name: string;
      private: boolean;
      default_branch: string;
      description: string | null;
    }>;

    const repos: GitHubRepoSummary[] = rawRepos.map((r) => ({
      id: r.id,
      fullName: r.full_name,
      name: r.name,
      private: r.private,
      defaultBranch: r.default_branch || "main",
      description: r.description,
    }));

    return NextResponse.json({
      ok: true,
      authenticated: true,
      repos,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch GitHub repos" },
      { status: 500 }
    );
  }
}

