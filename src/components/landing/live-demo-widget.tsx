"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GitBranch,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Zap,
  Wrench,
  Bug,
} from "lucide-react";

const SAMPLE_COMMITS = [
  { sha: "a41c9e2", msg: "feat(oauth): add PKCE flow for CLI login", author: "alex" },
  { sha: "9b22d10", msg: "feat(roadmap): optimistic upvote counter with rollback", author: "maya" },
  { sha: "3e7f01a", msg: "perf(db): index projectSlug + status composite key", author: "alex" },
  { sha: "f801c3b", msg: "fix(webhook): constant-time HMAC signature verification", author: "liam" },
  { sha: "1c04a88", msg: "chore(deps): update @types/node to 22.15.0", author: "dependabot" },
];

export function LiveDemoWidget() {
  const [stage, setStage] = useState<"idle" | "synthesizing" | "complete">("idle");

  const runSimulation = () => {
    setStage("synthesizing");
    setTimeout(() => {
      setStage("complete");
    }, 900);
  };

  const reset = () => setStage("idle");

  return (
    <section id="demo" className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
        >
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-violet-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Interactive Pipeline</span>
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Watch messy commits morph into release notes
            </h2>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              Trigger a simulated GitHub push event to see how MergeMint filters noise
              and categorizes changes with Gemini AI.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {stage === "complete" && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
            <button
              type="button"
              onClick={runSimulation}
              disabled={stage === "synthesizing"}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] transition hover:bg-violet-400 disabled:opacity-60"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>
                {stage === "synthesizing" ? "Synthesizing..." : "Simulate Git Push"}
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Raw Commits */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0D0D10] p-5">
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <GitBranch className="h-4 w-4 text-zinc-500" />
                <span>origin/main • 5 commits pushed</span>
              </div>
              <span className="font-mono text-[11px] text-zinc-500">
                POST /api/webhooks/github
              </span>
            </div>

            <div className="space-y-2.5">
              {SAMPLE_COMMITS.map((commit, idx) => {
                const isNoise = commit.msg.startsWith("chore(");
                return (
                  <motion.div
                    key={commit.sha}
                    initial={{ opacity: 0.9 }}
                    animate={{
                      opacity: stage === "complete" && isNoise ? 0.35 : 1,
                      x: stage === "synthesizing" ? [0, 3, 0] : 0,
                    }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 font-mono text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="text-violet-400">{commit.sha}</span>
                      <span
                        className={`truncate ${
                          stage === "complete" && isNoise
                            ? "line-through text-zinc-500"
                            : "text-zinc-200"
                        }`}
                      >
                        {commit.msg}
                      </span>
                    </div>
                    <span className="shrink-0 text-[11px] text-zinc-500">
                      {stage === "complete" && isNoise ? "filtered" : commit.author}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right: Structured Changelog Output */}
          <div className="relative flex min-h-[300px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0D0D10] p-5">
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span>Generated Changelog Entry</span>
              </div>
              {stage === "complete" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Ready to Publish
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
              {stage === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-1 flex-col items-center justify-center py-10 text-center"
                >
                  <div className="rounded-full border border-white/10 bg-white/[0.03] p-3">
                    <Play className="h-5 w-5 text-zinc-400" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-zinc-300">
                    Waiting for git push event
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Click &ldquo;Simulate Git Push&rdquo; above to run the AI pipeline.
                  </p>
                </motion.div>
              )}

              {stage === "synthesizing" && (
                <motion.div
                  key="synthesizing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-1 flex-col items-center justify-center py-10 text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    className="h-8 w-8 rounded-full border-2 border-violet-500/30 border-t-violet-400"
                  />
                  <p className="mt-4 font-mono text-xs text-violet-300">
                    Gemini 2.5 Flash summarizing 4 meaningful commits...
                  </p>
                </motion.div>
              )}

              {stage === "complete" && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-md bg-violet-500/20 px-2 py-0.5 font-mono text-xs text-violet-300">
                      v2.4.1
                    </span>
                    <h3 className="text-base font-semibold text-white">
                      PKCE CLI Auth & Faster Roadmap Queries
                    </h3>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05, type: "spring", stiffness: 320, damping: 24 }}
                      className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-3"
                    >
                      <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-emerald-400">
                        <Zap className="h-3.5 w-3.5" />
                        <span>Features</span>
                      </div>
                      <ul className="space-y-1 text-zinc-300">
                        <li>• Added secure PKCE browser authentication for `@mergemint/cli`</li>
                        <li>• Instant optimistic upvoting with automatic rollback on public roadmaps</li>
                      </ul>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.14, type: "spring", stiffness: 320, damping: 24 }}
                      className="rounded-lg border border-sky-500/20 bg-sky-500/[0.06] p-3"
                    >
                      <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-sky-400">
                        <Wrench className="h-3.5 w-3.5" />
                        <span>Improvements</span>
                      </div>
                      <p className="text-zinc-300">
                        • Added composite PostgreSQL index on project slug &amp; status for 3x faster board loads
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.22, type: "spring", stiffness: 320, damping: 24 }}
                      className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3"
                    >
                      <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-amber-400">
                        <Bug className="h-3.5 w-3.5" />
                        <span>Bug Fixes</span>
                      </div>
                      <p className="text-zinc-300">
                        • Enforced constant-time HMAC-SHA256 verification on incoming GitHub webhooks
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

