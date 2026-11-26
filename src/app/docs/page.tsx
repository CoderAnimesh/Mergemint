"use client";

import { useState, useMemo } from "react";
import { Search, BookOpen, Webhook, Terminal, Code2, Server } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { CodeBlock } from "@/components/code-block";

interface DocSection {
  id: string;
  title: string;
  group: string;
  icon: typeof BookOpen;
  keywords: string[];
}

const SECTIONS: DocSection[] = [
  {
    id: "quickstart",
    title: "Quickstart",
    group: "Getting Started",
    icon: BookOpen,
    keywords: ["github", "oauth", "connect", "repository", "setup"],
  },
  {
    id: "github-webhooks",
    title: "GitHub Webhooks & Actions",
    group: "Automation",
    icon: Webhook,
    keywords: ["webhook", "actions", "workflow", "yml", "hmac", "secret"],
  },
  {
    id: "cli",
    title: "CLI Installation & Commands",
    group: "Developer Tools",
    icon: Terminal,
    keywords: ["cli", "npm", "login", "init", "draft", "push", "status"],
  },
  {
    id: "vscode",
    title: "VS Code & IDE Extension",
    group: "Developer Tools",
    icon: Code2,
    keywords: ["vscode", "extension", "sidebar", "token", "ide"],
  },
  {
    id: "api-reference",
    title: "REST API Reference",
    group: "Reference",
    icon: Server,
    keywords: ["api", "rest", "curl", "typescript", "releases", "changelogs"],
  },
];

const WORKFLOW_YAML = `name: MergeMint Release Sync

on:
  push:
    branches: [main]

jobs:
  mergemint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 10
      - name: Sync Commits to MergeMint
        run: |
          npx @mergemint/cli push --ci --branch \${{ github.ref_name }}
        env:
          MERGEMINT_TOKEN: \${{ secrets.MERGEMINT_TOKEN }}`;

const CURL_RELEASE = `curl -X POST https://app.mergemint.dev/api/v1/releases \\
  -H "Authorization: Bearer mm_live_9f8a2b4c..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectSlug": "acme-cloud",
    "version": "v2.4.1",
    "commits": [
      { "sha": "a41c9e2", "message": "feat(oauth): add PKCE flow for CLI login" },
      { "sha": "f801c3b", "message": "fix(webhook): constant-time HMAC verification" }
    ]
  }'`;

const TS_CHANGELOGS = `const res = await fetch("https://app.mergemint.dev/api/v1/changelogs?project=acme-cloud", {
  headers: {
    Authorization: \`Bearer \${process.env.MERGEMINT_TOKEN}\`,
  },
});

const { changelogs } = await res.json();
console.log(changelogs[0].version, changelogs[0].features);`;

export default function DocsPage() {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState("quickstart");

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.group.toLowerCase().includes(q) ||
        s.keywords.some((k) => k.includes(q))
    );
  }, [query]);

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:px-8">
        {/* Sticky Left Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 space-y-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search docs..."
                className="w-full rounded-lg border border-white/[0.08] bg-[#111114] py-2 pl-9 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none"
              />
            </div>

            <nav className="space-y-1">
              {filteredSections.map((section) => {
                const Icon = section.icon;
                const active = activeId === section.id;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={() => setActiveId(section.id)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                      active
                        ? "bg-violet-500/15 text-violet-300"
                        : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{section.title}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 space-y-16 pb-24">
          <div className="border-b border-white/[0.08] pb-8">
            <span className="font-mono text-xs uppercase tracking-wider text-violet-400">
              Documentation
            </span>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              MergeMint Developer Documentation
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Configure automated GitHub release pipelines, sync local commits with the
              CLI, approve drafts inside VS Code, and query the MergeMint REST API.
            </p>
          </div>

          {/* 1. Quickstart */}
          <section id="quickstart" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-semibold text-white">1. Quickstart</h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Connect your GitHub account via OAuth in the{" "}
              <span className="text-zinc-200">MergeMint Dashboard</span>, choose the
              repositories you want to track, and MergeMint provisions a public changelog
              and voting roadmap at{" "}
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-violet-300">
                /{"{projectSlug}"}/changelog
              </code>
              .
            </p>
            <ol className="list-inside list-decimal space-y-2 rounded-xl border border-white/[0.08] bg-[#111114]/60 p-5 text-sm text-zinc-300">
              <li>Click <strong>Sign in with GitHub</strong> in the top navigation bar.</li>
              <li>Select a repository from the <strong>Projects</strong> tab in your dashboard.</li>
              <li>Generate a personal API token under <strong>API Keys &amp; CLI</strong>.</li>
            </ol>
          </section>

          {/* 2. GitHub Webhooks & Actions */}
          <section id="github-webhooks" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-semibold text-white">
              2. GitHub Webhooks &amp; Actions
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Point a GitHub repository webhook to{" "}
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-violet-300">
                POST /api/webhooks/github
              </code>{" "}
              with your{" "}
              <code className="font-mono text-xs text-zinc-300">
                GITHUB_WEBHOOK_SECRET
              </code>{" "}
              to verify HMAC-SHA256 signatures automatically, or drop the workflow below
              into <code className="font-mono text-xs text-zinc-300">.github/workflows/mergemint.yml</code>:
            </p>
            <CodeBlock
              filename=".github/workflows/mergemint.yml"
              language="yaml"
              code={WORKFLOW_YAML}
            />
          </section>

          {/* 3. CLI Installation & Commands */}
          <section id="cli" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-semibold text-white">
              3. CLI Installation &amp; Editor Terminal Setup
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Open the integrated terminal in{" "}
              <strong className="text-zinc-200">VS Code</strong>,{" "}
              <strong className="text-zinc-200">Antigravity</strong>,{" "}
              <strong className="text-zinc-200">Cursor</strong>, or any shell inside
              your project root (<code className="font-mono text-xs">Ctrl + `</code>)
              and run:
            </p>
            <CodeBlock
              filename="editor-terminal"
              language="bash"
              code={`# 1. Install globally (one-time)\nnpm i -g @mergemint/cli\n\n# 2. Authenticate via browser — auto-saves ~/.mergemint/config.json\nmergemint login\n\n# 3. Link repo & auto-install .git/hooks/post-commit (one-time per repo)\nmergemint init\n\n# 4. Commit normally — every git commit auto-syncs in the background!\ngit commit -m "feat: add streaming edge support"\n\n# 5. Inspect your last commit diff stat, releases & top roadmap votes\nmergemint status`}
            />
            <p className="text-xs text-zinc-400">
              Running <code className="font-mono text-emerald-300">mergemint status</code>{" "}
              prints your most recent local commit&apos;s{" "}
              <code className="font-mono text-zinc-300">git log -1 --stat</code>{" "}
              summary (files changed, insertions, deletions) alongside live releases
              and top-voted roadmap requests.
            </p>
          </section>

          {/* 4. VS Code & IDE Extension */}
          <section id="vscode" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-semibold text-white">
              4. VS Code &amp; IDE Extension Setup
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Install <strong>MergeMint Explorer</strong> from the VS Code Marketplace (or
              package <code className="font-mono text-xs text-zinc-300">packages/vscode-extension</code>{" "}
              locally). Open the Command Palette (<code className="font-mono text-xs">⌘⇧P</code>) and run:
            </p>
            <CodeBlock
              filename="vscode-settings.json"
              language="json"
              code={`{\n  "mergemint.apiUrl": "https://app.mergemint.dev",\n  "mergemint.apiToken": "sl_live_your_personal_token",\n  "mergemint.projectSlug": "acme-cloud"\n}`}
            />
          </section>

          {/* 5. API Reference */}
          <section id="api-reference" className="scroll-mt-24 space-y-6">
            <h2 className="text-xl font-semibold text-white">5. REST API Reference</h2>
            <div className="space-y-3">
              <h3 className="font-mono text-sm font-semibold text-violet-300">
                POST /api/v1/releases
              </h3>
              <p className="text-sm text-zinc-400">
                Accepts an array of raw commits, filters noise, and generates a
                structured AI changelog draft via Gemini 2.5 Flash.
              </p>
              <CodeBlock filename="curl" language="bash" code={CURL_RELEASE} />
            </div>

            <div className="space-y-3">
              <h3 className="font-mono text-sm font-semibold text-violet-300">
                GET /api/v1/changelogs
              </h3>
              <p className="text-sm text-zinc-400">
                Fetches published changelog entries for a project slug.
              </p>
              <CodeBlock
                filename="fetch-changelogs.ts"
                language="typescript"
                code={TS_CHANGELOGS}
              />
            </div>
          </section>
        </main>

        {/* Right-Hand Table of Contents */}
        <aside className="hidden w-52 shrink-0 xl:block">
          <div className="sticky top-24 space-y-3 border-l border-white/[0.08] pl-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              On this page
            </div>
            <ul className="space-y-2 text-xs">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={() => setActiveId(s.id)}
                    className={`block transition ${
                      activeId === s.id
                        ? "font-medium text-violet-400"
                        : "text-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

