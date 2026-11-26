"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Hobby",
    monthly: 0,
    yearly: 0,
    description: "For solo developers and open-source maintainers.",
    features: [
      "1 connected GitHub repository",
      "Unlimited public changelog entries",
      "Public roadmap & upvoting board",
      "CLI & VS Code extension access",
    ],
    cta: "Start for Free",
    highlighted: false,
  },
  {
    name: "Pro",
    monthly: 19,
    yearly: 15,
    description: "For fast-moving startups shipping weekly releases.",
    features: [
      "Up to 10 GitHub repositories",
      "Gemini 2.5 Flash PR diff synthesis",
      "Custom CNAME domain & RSS feeds",
      "Slack & Discord release webhooks",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Team",
    monthly: 49,
    yearly: 39,
    description: "For engineering orgs with multi-product roadmaps.",
    features: [
      "Unlimited repositories & workspaces",
      "Linear & Jira two-way issue sync",
      "Role-based access & audit logs",
      "Priority webhook SLA & support",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-violet-400">
            Pricing
          </span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Transparent pricing for every stage
          </h2>
          <p className="mt-3 text-sm text-zinc-400">
            Start free with full CLI and VS Code support. Scale when your team grows.
          </p>

          <div className="mt-7 inline-flex items-center rounded-xl border border-white/[0.08] bg-[#111114] p-1">
            {(["monthly", "yearly"] as const).map((cycle) => {
              const active = billing === cycle;
              return (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBilling(cycle)}
                  className={`relative rounded-lg px-4 py-1.5 text-xs font-medium transition ${
                    active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="pricing-cycle-pill"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.08]"
                    />
                  )}
                  <span className="relative z-10 capitalize">
                    {cycle}
                    {cycle === "yearly" ? " (Save 20%)" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const price = billing === "monthly" ? plan.monthly : plan.yearly;
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col justify-between rounded-2xl border p-7 ${
                  plan.highlighted
                    ? "border-violet-500/40 bg-gradient-to-b from-violet-500/[0.08] to-[#111114] shadow-[0_0_50px_rgba(139,92,246,0.12)]"
                    : "border-white/[0.08] bg-[#111114]/70"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                    {plan.highlighted && (
                      <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[11px] font-medium text-violet-300">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">{plan.description}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${plan.name}-${billing}`}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18 }}
                        className="text-4xl font-semibold tracking-tight text-white"
                      >
                        ${price}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-xs text-zinc-500">/month</span>
                  </div>

                  <ul className="mt-6 space-y-3 border-t border-white/[0.06] pt-6 text-xs text-zinc-300">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 shrink-0 text-violet-400" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/dashboard"
                  className={`mt-8 block rounded-lg px-4 py-2.5 text-center text-xs font-semibold transition ${
                    plan.highlighted
                      ? "bg-white text-zinc-950 hover:bg-zinc-200"
                      : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

