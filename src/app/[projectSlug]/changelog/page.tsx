"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  Rss,
  Mail,
  CheckCircle2,
  Zap,
  Wrench,
  Bug,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/navbar";

type CategoryFilter = "all" | "features" | "improvements" | "bugFixes";

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  summary: string;
  status: "PUBLISHED" | "DRAFT";
  publishedAt: string | null;
  createdAt: string;
  features: string[];
  improvements: string[];
  bugFixes: string[];
}

const FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All Updates" },
  { id: "features", label: "Features" },
  { id: "improvements", label: "Improvements" },
  { id: "bugFixes", label: "Bug Fixes" },
];

export default function PublicChangelogPage() {
  const params = useParams<{ projectSlug: string }>();
  const slug = params?.projectSlug || "acme-cloud";
  const fallbackName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const [projectName, setProjectName] = useState(fallbackName);
  const [projectDesc, setProjectDesc] = useState(
    "Automated product changelog and release timeline."
  );
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/v1/changelogs?project=${encodeURIComponent(slug)}`
        );
        if (res.ok) {
          const data = (await res.json()) as {
            projectName?: string;
            projectDescription?: string | null;
            changelogs?: ChangelogEntry[];
          };
          if (data.projectName) setProjectName(data.projectName);
          if (data.projectDescription) setProjectDesc(data.projectDescription);
          setEntries(Array.isArray(data.changelogs) ? data.changelogs : []);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [slug]);

  const visibleEntries = useMemo(() => {
    const published = entries.filter((c) => c.status === "PUBLISHED");
    return published.length > 0 ? published : entries;
  }, [entries]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to MergeMint</span>
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {projectName} Changelog
            </h1>
            <p className="mt-1.5 text-sm text-zinc-400">{projectDesc}</p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111114] p-1">
            <Link
              href={`/${slug}/changelog`}
              className="rounded-lg bg-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-white"
            >
              Changelog
            </Link>
            <Link
              href={`/${slug}/roadmap`}
              className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white"
            >
              Roadmap
            </Link>
          </div>
        </div>

        {/* Subscribe & Filter Bar */}
        <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="inline-flex flex-wrap rounded-xl border border-white/[0.08] bg-[#111114] p-1">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="changelog-filter-pill"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.08]"
                    />
                  )}
                  <span className="relative z-10">{f.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubscribe} className="flex items-center gap-2">
            {subscribed ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Subscribed to releases
              </span>
            ) : (
              <>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-48 rounded-lg border border-white/10 bg-[#111114] py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-200"
                >
                  Subscribe
                </button>
              </>
            )}
            <a
              href={`/api/v1/rss?project=${slug}`}
              title="RSS Feed"
              className="rounded-lg border border-white/10 bg-[#111114] p-1.5 text-zinc-400 hover:text-white"
            >
              <Rss className="h-3.5 w-3.5" />
            </a>
          </form>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="mt-16 flex items-center justify-center gap-2 text-xs text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            <span>Loading generated changelogs...</span>
          </div>
        ) : visibleEntries.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-white/10 bg-[#111114]/40 p-12 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-emerald-400" />
            <h2 className="mt-3 text-base font-semibold text-white">
              No AI changelogs generated yet for {projectName}
            </h2>
            <p className="mt-1.5 text-xs text-zinc-400">
              Commit changes in your repository or run{" "}
              <code className="font-mono text-emerald-300">mergemint push</code> to
              generate your first Gemini AI changelog.
            </p>
          </div>
        ) : (
          <div className="mt-12 space-y-12 border-l border-white/[0.08] pl-6">
            {visibleEntries.map((entry) => (
              <article key={entry.id} className="relative space-y-4">
                <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full border border-emerald-400 bg-[#09090B]" />
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 font-mono text-xs text-emerald-300">
                    {entry.version}
                  </span>
                  {entry.status === "DRAFT" && (
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
                      AI Draft
                    </span>
                  )}
                  <time className="font-mono text-xs text-zinc-500">
                    {(entry.publishedAt || entry.createdAt).slice(0, 10)}
                  </time>
                </div>
                <h2 className="text-xl font-semibold text-white">{entry.title}</h2>
                <p className="text-sm leading-relaxed text-zinc-400">{entry.summary}</p>

                <div className="space-y-3 pt-1">
                  {(filter === "all" || filter === "features") &&
                    entry.features.length > 0 && (
                      <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                          <Zap className="h-3.5 w-3.5" />
                          <span>Features</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-zinc-300">
                          {entry.features.map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {(filter === "all" || filter === "improvements") &&
                    entry.improvements.length > 0 && (
                      <div className="rounded-xl border border-sky-500/15 bg-sky-500/[0.04] p-4">
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                          <Wrench className="h-3.5 w-3.5" />
                          <span>Improvements</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-zinc-300">
                          {entry.improvements.map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {(filter === "all" || filter === "bugFixes") &&
                    entry.bugFixes.length > 0 && (
                      <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-4">
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                          <Bug className="h-3.5 w-3.5" />
                          <span>Bug Fixes</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-zinc-300">
                          {entry.bugFixes.map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
