"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Terminal,
  GitCommitHorizontal,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";

type EditorId = "vscode" | "antigravity" | "cursor" | "zed";

const EDITORS: { id: EditorId; name: string; shortcut: string; note: string }[] = [
  {
    id: "vscode",
    name: "VS Code",
    shortcut: "Ctrl + `",
    note: "Open the integrated terminal in VS Code (View → Terminal) in your project root.",
  },
  {
    id: "antigravity",
    name: "Antigravity",
    shortcut: "Ctrl + `",
    note: "Open the integrated terminal panel in Antigravity IDE inside your repository.",
  },
  {
    id: "cursor",
    name: "Cursor",
    shortcut: "Ctrl + `",
    note: "Open Cursor's built-in terminal or run commands directly from your workspace.",
  },
  {
    id: "zed",
    name: "Any Terminal",
    shortcut: "zsh / pwsh",
    note: "Works identically in Zed, JetBrains, iTerm2, Warp, or Windows Terminal.",
  },
];

const CLI_STEPS = [
  {
    step: "01",
    title: "Install the MergeMint CLI",
    cmd: "npm i -g @mergemint/cli",
    desc: "Install globally once to use across every repository.",
  },
  {
    step: "02",
    title: "Authenticate your terminal",
    cmd: "mergemint login",
    desc: "Opens browser auth and auto-writes ~/.mergemint/config.json.",
  },
  {
    step: "03",
    title: "One-time repo link + auto-commit hook",
    cmd: "mergemint init",
    desc: "Links .git origin and installs .git/hooks/post-commit so every commit auto-syncs.",
  },
  {
    step: "04",
    title: "Commit normally (auto-syncs in background)",
    cmd: 'git commit -m "feat: add edge caching"',
    desc: "Every commit automatically triggers MergeMint AI draft synthesis.",
  },
  {
    step: "05",
    title: "Inspect last commit stat & status",
    cmd: "mergemint status",
    desc: "Displays your last commit diff stat, releases, and top roadmap votes.",
  },
];

export function TerminalQuickstart() {
  const [editor, setEditor] = useState<EditorId>("antigravity");
  const activeEditor = EDITORS.find((e) => e.id === editor) || EDITORS[0];

  const fullSetupScript = `npm i -g @mergemint/cli
mergemint login
mergemint init
git commit -m "feat: initial sync"
mergemint status`;

  return (
    <section id="cli-setup" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
          className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end"
        >
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-violet-400">
              <Terminal className="h-3.5 w-3.5" />
              <span>Editor Terminal Setup</span>
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Set up in any code editor in 60 seconds
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Run these commands in the integrated terminal of VS Code, Antigravity,
              Cursor, or any shell—and inspect your last commit stat without leaving
              your editor.
            </p>
          </div>

          <div className="inline-flex flex-wrap rounded-xl border border-white/[0.08] bg-[#111114] p-1">
            {EDITORS.map((ed) => {
              const active = editor === ed.id;
              return (
                <button
                  key={ed.id}
                  type="button"
                  onClick={() => setEditor(ed.id)}
                  className={`relative rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                    active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="editor-quickstart-pill"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.08]"
                    />
                  )}
                  <span className="relative z-10">{ed.name}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: Step-by-step Copyable Commands */}
          <div className="space-y-3 lg:col-span-6">
            <div className="flex items-center justify-between rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-2.5 text-xs">
              <span className="text-violet-200">{activeEditor.note}</span>
              <span className="ml-3 shrink-0 rounded border border-violet-400/25 bg-violet-500/15 px-2 py-0.5 font-mono text-[11px] text-violet-300">
                {activeEditor.shortcut}
              </span>
            </div>

            {CLI_STEPS.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                whileHover={{ x: 3 }}
                className="group flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#111114]/80 px-4 py-3 transition hover:border-emerald-500/30"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-violet-400">
                      {item.step}
                    </span>
                    <span className="text-xs font-medium text-white">
                      {item.title}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 font-mono text-xs text-zinc-200">
                    <span className="text-emerald-400">$</span>
                    <span className="truncate">{item.cmd}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{item.desc}</p>
                </div>
                <CopyButton text={item.cmd} className="shrink-0" />
              </motion.div>
            ))}

            <div className="flex items-center justify-between pt-1">
              <CopyButton text={fullSetupScript} label="Copy all 5 commands" />
              <Link
                href="/docs#cli"
                className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
              >
                <span>Full CLI reference</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Right: Live Terminal Output Preview with Last Commit Stat */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0D0D10] shadow-[0_24px_80px_rgba(0,0,0,0.6)] lg:col-span-6">
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                <span className="ml-2 font-mono text-xs text-zinc-400">
                  {activeEditor.name} Terminal — ~/acme-cloud
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Synced
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={editor}
                initial={{ opacity: 0.6, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0.6 }}
                transition={{ duration: 0.18 }}
                className="flex-1 space-y-4 p-5 font-mono text-xs leading-relaxed"
              >
                <div>
                  <span className="text-emerald-400">➜</span>{" "}
                  <span className="text-sky-400">~/acme-cloud</span>{" "}
                  <span className="text-white">mergemint status</span>
                </div>

                <div className="text-zinc-200 font-semibold">
                  MergeMint Status — acme-cloud
                </div>

                {/* Last Local Commit Stat */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
                  <div className="mb-1.5 flex items-center gap-1.5 text-sky-400">
                    <GitCommitHorizontal className="h-3.5 w-3.5" />
                    <span>Last Local Commit:</span>
                  </div>
                  <div className="text-zinc-200">
                    <span className="text-amber-300">a41c9e2</span>{" "}
                    feat(oauth): add PKCE flow for CLI login{" "}
                    <span className="text-zinc-500">(alex, 12 mins ago)</span>
                  </div>
                  <div className="mt-2 space-y-0.5 text-[11px] text-zinc-400">
                    <div> src/lib/api-auth.ts        | 28 ++++++++++++++++++++++++----</div>
                    <div> src/app/api/v1/cli/sync.ts | 14 ++++++++++++--</div>
                    <div className="text-emerald-400">
                      {" "}
                      2 files changed, 36 insertions(+), 6 deletions(-)
                    </div>
                  </div>
                </div>

                {/* Latest Releases + Roadmap */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                    <div className="mb-1.5 flex items-center gap-1.5 text-emerald-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Latest Releases:</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-zinc-300">
                      <div>
                        <span className="text-emerald-400">v2.4.0</span> Edge Streaming
                      </div>
                      <div>
                        <span className="text-emerald-400">v2.3.1</span> VS Code Sidebar
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                    <div className="mb-1.5 text-violet-400">
                      Top Voted Roadmap:
                    </div>
                    <div className="space-y-1 text-[11px] text-zinc-300">
                      <div>
                        <span className="text-violet-300">▲ 142</span> Linear Two-Way Sync
                      </div>
                      <div>
                        <span className="text-violet-300">▲ 118</span> Slack Digest Hooks
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

