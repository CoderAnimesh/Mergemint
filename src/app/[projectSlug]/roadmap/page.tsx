"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, ChevronUp, Plus } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { DEMO_ROADMAP_ITEMS, type MockRoadmapItem } from "@/lib/mock-data";

type StatusFilter = "ALL" | "PLANNED" | "IN_PROGRESS" | "SHIPPED";

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "PLANNED", label: "Planned" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "SHIPPED", label: "Shipped" },
];

export default function PublicRoadmapPage() {
  const params = useParams<{ projectSlug: string }>();
  const slug = params?.projectSlug || "acme-cloud";

  const [items, setItems] = useState<MockRoadmapItem[]>(DEMO_ROADMAP_ITEMS);
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const toggleVote = (id: string) => {
    const alreadyVoted = Boolean(votedIds[id]);
    setVotedIds((prev) => ({ ...prev, [id]: !alreadyVoted }));
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, votes: item.votes + (alreadyVoted ? -1 : 1) }
          : item
      )
    );
  };

  const handleRequestFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created: MockRoadmapItem = {
      id: `rm_${Date.now()}`,
      title: newTitle.trim(),
      description:
        newDesc.trim() || "Submitted from the public ShipLog roadmap board.",
      status: "PLANNED",
      category: "Feature",
      votes: 1,
      authorName: "you@community",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setItems((prev) => [created, ...prev]);
    setVotedIds((prev) => ({ ...prev, [created.id]: true }));
    setNewTitle("");
    setNewDesc("");
  };

  const columns: { status: "PLANNED" | "IN_PROGRESS" | "SHIPPED"; title: string; dot: string }[] =
    useMemo(() => {
      const all: {
        status: "PLANNED" | "IN_PROGRESS" | "SHIPPED";
        title: string;
        dot: string;
      }[] = [
        { status: "PLANNED", title: "Planned", dot: "bg-zinc-400" },
        { status: "IN_PROGRESS", title: "In Progress", dot: "bg-violet-400" },
        { status: "SHIPPED", title: "Shipped", dot: "bg-emerald-400" },
      ];
      return statusFilter === "ALL"
        ? all
        : all.filter((c) => c.status === statusFilter);
    }, [statusFilter]);

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
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
              Public Roadmap
            </h1>
            <p className="mt-1.5 text-sm text-zinc-400">
              Vote on upcoming capabilities or submit a new feature request.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111114] p-1">
            <Link
              href={`/${slug}/changelog`}
              className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white"
            >
              Changelog
            </Link>
            <Link
              href={`/${slug}/roadmap`}
              className="rounded-lg bg-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-white"
            >
              Roadmap
            </Link>
          </div>
        </div>

        {/* Submit Feature Request + Filter */}
        <div className="mt-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="inline-flex w-fit rounded-xl border border-white/[0.08] bg-[#111114] p-1">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`relative rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                    active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="roadmap-status-pill"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.08]"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <form
            onSubmit={handleRequestFeature}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Request a feature..."
              className="rounded-lg border border-white/10 bg-[#111114] px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none sm:w-56"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Short details (optional)"
              className="rounded-lg border border-white/10 bg-[#111114] px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none sm:w-56"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-violet-400"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Submit Idea</span>
            </button>
          </form>
        </div>

        {/* Columns */}
        <div
          className={`mt-8 grid gap-6 ${
            columns.length === 1 ? "grid-cols-1" : "lg:grid-cols-3"
          }`}
        >
          {columns.map((col) => {
            const colItems = items
              .filter((i) => i.status === col.status)
              .sort((a, b) => b.votes - a.votes);
            return (
              <div
                key={col.status}
                className="rounded-2xl border border-white/[0.08] bg-[#111114]/60 p-4"
              >
                <div className="mb-4 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      {col.title}
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-zinc-500">
                    {colItems.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colItems.map((item) => {
                    const voted = Boolean(votedIds[item.id]);
                    return (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#0D0D10] p-4 transition hover:border-white/15"
                      >
                        <div className="min-w-0">
                          <span className="inline-block rounded bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                            {item.category}
                          </span>
                          <h3 className="mt-2 text-sm font-medium text-white">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                            {item.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleVote(item.id)}
                          className={`flex shrink-0 flex-col items-center rounded-lg border px-2.5 py-1.5 font-mono text-xs transition ${
                            voted
                              ? "border-violet-500/50 bg-violet-500/20 text-violet-300"
                              : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20"
                          }`}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                          <span>{item.votes}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

