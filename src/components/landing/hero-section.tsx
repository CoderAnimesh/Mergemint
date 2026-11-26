"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  Terminal,
  LayoutDashboard,
  Code2,
  CheckCircle2,
  GitCommitHorizontal,
  ArrowUpRight,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";

type PreviewTab = "dashboard" | "cli" | "vscode";

const PREVIEW_TABS: { id: PreviewTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Web Dashboard", icon: LayoutDashboard },
  { id: "cli", label: "CLI Terminal", icon: Terminal },
  { id: "vscode", label: "VS Code Sidebar", icon: Code2 },
];

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<PreviewTab>("dashboard");

  return (
    <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-pattern bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="bg-gradient-to-b from-white via-emerald-50 to-zinc-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-6xl lg:text-[64px] lg:leading-[1.06]"
          >
            Mint Linear-grade changelogs
            <br />
            from every git merge.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: "easeOut" }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg"
          >
            MergeMint connects your GitHub webhooks, local CLI, and IDE sidebar to
            synthesize noisy commit history into structured release notes and a live
            public voting roadmap.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease: "easeOut" }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3.5"
          >
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-[0_0_32px_rgba(16,185,129,0.22)] transition hover:bg-emerald-50"
              >
                <span>Start Minting Free</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                <BookOpen className="h-4 w-4 text-zinc-400" />
                <span>Read the Docs</span>
              </Link>
            </motion.div>

            <div className="hidden items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0D0D10] px-3 py-1.5 font-mono text-xs text-zinc-400 sm:inline-flex">
              <span className="text-emerald-400">$</span>
              <span>npm i -g @mergemint/cli</span>
              <CopyButton text="npm i -g @mergemint/cli" className="border-0 bg-transparent px-1.5 py-0.5" />
            </div>
          </motion.div>
        </div>

        {/* Interactive Multi-Tab Product Preview */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32, ease: "easeOut" }}
          className="mx-auto mt-14 max-w-5xl"
        >
          <div className="mb-4 flex justify-center">
            <div className="inline-flex rounded-xl border border-white/[0.08] bg-[#111114] p-1">
              {PREVIEW_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition ${
                      active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="hero-preview-pill"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.08]"
                      />
                    )}
                    <Icon className="relative z-10 h-3.5 w-3.5" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0D0D10] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="ml-2 font-mono text-xs text-zinc-500">
                  {activeTab === "dashboard" && "app.mergemint.dev/dashboard — acme-cloud"}
                  {activeTab === "cli" && "zsh — ~/projects/acme-cloud"}
                  {activeTab === "vscode" && "Visual Studio Code — MergeMint Explorer"}
                </span>
              </div>
              <Link
                href="/acme-cloud/changelog"
                className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
              >
                <span>View live hub</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="min-h-[340px] p-6">
              <AnimatePresence mode="wait">
                {activeTab === "dashboard" && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-6 md:grid-cols-5"
                  >
                    <div className="space-y-2 md:col-span-2">
                      <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                        Incoming GitHub Commits (main)
                      </div>
                      {[
                        { sha: "8f3a19c", msg: "feat(edge): add streaming SSE fanout" },
                        { sha: "2d9b04e", msg: "perf(ai): cut gemini schema latency 42%" },
                        { sha: "c71e82a", msg: "fix(auth): prevent duplicate rebase push" },
                        { sha: "9a04f11", msg: "chore(deps): bump vitest to 2.1.4 (filtered)" },
                      ].map((c) => (
                        <div
                          key={c.sha}
                          className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 font-mono text-xs"
                        >
                          <GitCommitHorizontal className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                          <span className="text-violet-400">{c.sha}</span>
                          <span className="truncate text-zinc-300">{c.msg}</span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-5 md:col-span-3">
                      <div className="flex items-center justify-between">
                        <span className="rounded-md bg-violet-500/20 px-2 py-0.5 font-mono text-xs text-violet-300">
                          v2.4.0 • AI Draft Ready
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Synthesized in 412ms
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-white">
                        Edge Streaming & Zero-Config CLI Sync
                      </h3>
                      <div className="mt-4 space-y-2.5 text-xs text-zinc-300">
                        <div>
                          <span className="font-semibold text-emerald-400">Features:</span>{" "}
                          Real-time SSE fanout for multi-region release webhooks.
                        </div>
                        <div>
                          <span className="font-semibold text-sky-400">Improvements:</span>{" "}
                          Reduced Gemini structured output latency by 42%.
                        </div>
                        <div>
                          <span className="font-semibold text-amber-400">Bug Fixes:</span>{" "}
                          Eliminated duplicate commit ingestion on rebased branches.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "cli" && (
                  <motion.div
                    key="cli"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="font-mono text-xs leading-6 text-zinc-300"
                  >
                    <div>
                      <span className="text-emerald-400">➜</span>{" "}
                      <span className="text-sky-400">~/acme-cloud</span>{" "}
                      <span className="text-white">mergemint push --since v2.3.1</span>
                    </div>
                    <div className="mt-2 text-zinc-500">
                      ⠋ Reading 14 commits from origin/main...
                    </div>
                    <div className="text-zinc-500">
                      ⠙ Filtering 3 chore/merge commits & synthesizing with Gemini...
                    </div>
                    <div className="mt-2 text-emerald-400">
                      ✓ Created AI Release Draft v2.4.0 (3 Features, 2 Improvements, 2 Fixes)
                    </div>
                    <div className="mt-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 text-zinc-300">
                      <div>Draft URL: https://app.mergemint.dev/acme-cloud/changelog</div>
                      <div>Roadmap Top Request: Linear Two-Way Sync (142 votes)</div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "vscode" && (
                  <motion.div
                    key="vscode"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4 md:grid-cols-3"
                  >
                    <div className="rounded-xl border border-white/[0.08] bg-[#131317] p-4">
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                          MergeMint Explorer
                        </span>
                        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                          Connected
                        </span>
                      </div>
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="rounded-md bg-violet-500/15 px-2.5 py-2 text-violet-200">
                          <div className="font-medium">v2.5.0-rc.1 (Draft)</div>
                          <div className="text-[11px] text-violet-300/70">7 commits • Approve?</div>
                        </div>
                        <div className="rounded-md bg-white/[0.03] px-2.5 py-2 text-zinc-300">
                          <div className="font-medium">v2.4.0 (Published)</div>
                          <div className="text-[11px] text-zinc-500">Nov 24 • 14 commits</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#131317] p-4 md:col-span-2">
                      <div>
                        <div className="text-xs font-medium text-zinc-400">
                          Top Community Feature Requests
                        </div>
                        <div className="mt-3 space-y-2">
                          {[
                            { title: "Linear & Jira Two-Way Issue Sync", votes: 142 },
                            { title: "Slack & Discord Release Digest Webhooks", votes: 118 },
                            { title: "Custom CNAME Domains", votes: 96 },
                          ].map((item) => (
                            <div
                              key={item.title}
                              className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs"
                            >
                              <span className="text-zinc-200">{item.title}</span>
                              <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-violet-300">
                                ▲ {item.votes}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] text-zinc-500">
                        <span>Command: MergeMint: Generate Changelog from Recent Commits</span>
                        <span className="font-mono text-zinc-400">⌘⇧P</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

