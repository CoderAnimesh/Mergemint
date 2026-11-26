"use client";

import { motion } from "motion/react";
import {
  Webhook,
  Sparkles,
  Vote,
  Terminal,
  Code2,
  ShieldCheck,
} from "lucide-react";

const BENTO_ITEMS = [
  {
    title: "Automated GitHub Webhooks",
    description:
      "HMAC-verified push & PR merge listeners automatically filter dependabot and chore noise before drafting releases.",
    icon: Webhook,
    span: "md:col-span-2",
    accent: "from-violet-500/20 to-transparent",
    tag: "Real-time",
  },
  {
    title: "Gemini AI Summarization",
    description:
      "Structured JSON schema synthesis transforms raw diffs into crisp Features, Improvements, and Bug Fixes.",
    icon: Sparkles,
    span: "md:col-span-1",
    accent: "from-indigo-500/20 to-transparent",
    tag: "@google/genai",
  },
  {
    title: "Public Voting Roadmaps",
    description:
      "Give users a branded `/roadmap` board with Planned, In Progress, and Shipped columns plus optimistic upvote counters.",
    icon: Vote,
    span: "md:col-span-1",
    accent: "from-emerald-500/20 to-transparent",
    tag: "Community",
  },
  {
    title: "First-Class CLI Sync",
    description:
      "Run `mergemint init`, `mergemint push`, and `mergemint status` from any editor terminal to auto-sync every commit.",
    icon: Terminal,
    span: "md:col-span-1",
    accent: "from-sky-500/20 to-transparent",
    tag: "@mergemint/cli",
  },
  {
    title: "VS Code Explorer Sidebar",
    description:
      "Review AI release drafts, approve changelogs, and inspect top-voted user requests without leaving your IDE.",
    icon: Code2,
    span: "md:col-span-1",
    accent: "from-amber-500/20 to-transparent",
    tag: "IDE Native",
  },
  {
    title: "Enterprise-Ready Security",
    description:
      "Scoped personal API tokens, constant-time webhook signatures, and PostgreSQL + Prisma data isolation per workspace.",
    icon: ShieldCheck,
    span: "md:col-span-3",
    accent: "from-zinc-500/15 to-transparent",
    tag: "SOC2-ready Architecture",
  },
];

export function BentoGrid() {
  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="font-mono text-xs uppercase tracking-wider text-violet-400">
            Ecosystem
          </span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Built for teams that ship every day
          </h2>
          <p className="mt-3 text-sm text-zinc-400 sm:text-base">
            Every surface—web dashboard, public changelog, CLI, and IDE—stays
            synchronized from a single source of truth.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {BENTO_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111114]/80 p-6 transition hover:border-emerald-500/30 hover:shadow-[0_12px_40px_rgba(16,185,129,0.08)] ${item.span}`}
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${item.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                />
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <Icon className="h-5 w-5 text-violet-400" />
                  </div>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 font-mono text-[11px] text-zinc-400">
                    {item.tag}
                  </span>
                </div>
                <h3 className="relative z-10 mt-5 text-base font-semibold text-white">
                  {item.title}
                </h3>
                <p className="relative z-10 mt-2 text-sm leading-relaxed text-zinc-400">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

