import { GoogleGenAI, Type } from "@google/genai";

export interface RawCommitInput {
  sha?: string;
  message: string;
  author?: string;
  timestamp?: string;
  diff?: string;
}

export interface GeneratedReleaseNotes {
  title: string;
  summary: string;
  versionSuggestion: string;
  features: string[];
  improvements: string[];
  bugFixes: string[];
  source: "gemini" | "heuristic";
}

const NOISE_PREFIXES = [
  /^merge\s+(pull request|branch|remote-tracking)/i,
  /^chore\(deps\):/i,
  /^wip\b/i,
  /^lint\b/i,
  /^format\b/i,
];

export function filterMeaningfulCommits(commits: RawCommitInput[]): RawCommitInput[] {
  return commits.filter((commit) => {
    const msg = commit.message.trim();
    if (!msg) return false;
    return !NOISE_PREFIXES.some((pattern) => pattern.test(msg));
  });
}

function heuristicSummarize(commits: RawCommitInput[]): GeneratedReleaseNotes {
  const features: string[] = [];
  const improvements: string[] = [];
  const bugFixes: string[] = [];

  for (const commit of commits) {
    const firstLine = commit.message.split("\n")[0].trim();
    const cleaned = firstLine
      .replace(/^(feat|feature|fix|bugfix|perf|refactor|docs|chore)(\([^)]+\))?:\s*/i, "")
      .replace(/^\w/, (c) => c.toUpperCase());

    if (/^(feat|feature|add|new)/i.test(firstLine)) {
      features.push(cleaned);
    } else if (/^(fix|bug|hotfix|patch|resolve)/i.test(firstLine)) {
      bugFixes.push(cleaned);
    } else {
      improvements.push(cleaned);
    }
  }

  const total = features.length + improvements.length + bugFixes.length;
  const title =
    features.length > 0
      ? `${features[0].slice(0, 48)}${features[0].length > 48 ? "..." : ""}`
      : `Release Update (${total} changes)`;

  return {
    title,
    summary: `Automated release summary synthesized from ${commits.length} commit${
      commits.length === 1 ? "" : "s"
    }, highlighting ${features.length} new feature${features.length === 1 ? "" : "s"}, ${
      improvements.length
    } improvement${improvements.length === 1 ? "" : "s"}, and ${bugFixes.length} bug fix${
      bugFixes.length === 1 ? "" : "es"
    }.`,
    versionSuggestion: features.length > 0 ? "v1.4.0" : "v1.3.2",
    features,
    improvements,
    bugFixes,
    source: "heuristic",
  };
}

export async function generateChangelogFromCommits(
  commits: RawCommitInput[],
  projectName = "MergeMint Project",
  prDiffs?: string
): Promise<GeneratedReleaseNotes> {
  const meaningful = filterMeaningfulCommits(commits);
  const inputCommits = meaningful.length > 0 ? meaningful : commits;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_google_gemini_api_key") {
    return heuristicSummarize(inputCommits);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const commitText = inputCommits
      .map(
        (c, i) =>
          `${i + 1}. [${c.sha ? c.sha.slice(0, 7) : "local"}] ${c.message}${
            c.author ? ` (by ${c.author})` : ""
          }${c.diff ? `\nDiff snippet:\n${c.diff.slice(0, 600)}` : ""}`
      )
      .join("\n");

    const prompt = `You are a principal developer advocate writing crisp, user-facing release notes for "${projectName}" in the style of Linear, Vercel, and Raycast.

Analyze the following git commits${prDiffs ? " and PR diffs" : ""} and convert them into structured, polished release notes.
- Omit internal noise (typo fixes, dependency bumps, merge commits) unless user-impacting.
- Rewrite terse commit messages into clear, outcome-oriented bullet points.
- Categorize strictly into features, improvements, and bugFixes.

Commits:
${commitText}
${prDiffs ? `\nAdditional PR Diff Context:\n${prDiffs.slice(0, 3000)}` : ""}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Short, punchy release headline (3-7 words)",
            },
            summary: {
              type: Type.STRING,
              description: "1-2 sentence executive summary of this release",
            },
            versionSuggestion: {
              type: Type.STRING,
              description: "Semantic version suggestion such as v1.4.0",
            },
            features: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "User-facing new features",
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Performance, UX, or DX improvements",
            },
            bugFixes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Resolved bugs and edge cases",
            },
          },
          required: [
            "title",
            "summary",
            "versionSuggestion",
            "features",
            "improvements",
            "bugFixes",
          ],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      return heuristicSummarize(inputCommits);
    }

    const parsed = JSON.parse(rawText) as Omit<GeneratedReleaseNotes, "source">;
    return {
      title: parsed.title || "Product Release",
      summary: parsed.summary || "New updates and refinements.",
      versionSuggestion: parsed.versionSuggestion || "v1.4.0",
      features: Array.isArray(parsed.features) ? parsed.features : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      bugFixes: Array.isArray(parsed.bugFixes) ? parsed.bugFixes : [],
      source: "gemini",
    };
  } catch (error) {
    console.error("[MergeMint Gemini Error]", error);
    return heuristicSummarize(inputCommits);
  }
}

