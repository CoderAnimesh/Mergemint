"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { motion } from "motion/react";
import {
  FolderGit2,
  Sparkles,
  Map,
  KeyRound,
  Settings,
  Github,
  Plus,
  CheckCircle2,
  ExternalLink,
  Webhook,
  Send,
  LogOut,
  Rocket,
} from "lucide-react";
import {
  DEMO_PROJECTS,
  DEMO_CHANGELOGS,
  DEMO_ROADMAP_ITEMS,
  DEMO_WEBHOOK_DELIVERIES,
  type MockChangelog,
} from "@/lib/mock-data";
import { CopyButton } from "@/components/copy-button";

type DashboardTab = "projects" | "drafts" | "roadmap" | "keys" | "settings";

const SIDEBAR_ITEMS: { id: DashboardTab; label: string; icon: typeof FolderGit2 }[] = [
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "drafts", label: "AI Release Drafts", icon: Sparkles },
  { id: "roadmap", label: "Roadmap & Votes", icon: Map },
  { id: "keys", label: "API Keys & CLI", icon: KeyRound },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<DashboardTab>("projects");
  const [projects, setProjects] = useState(DEMO_PROJECTS);
  const [selectedRepo, setSelectedRepo] = useState("acme-corp/design-system");
  const [changelogs, setChangelogs] = useState<MockChangelog[]>(DEMO_CHANGELOGS);
  const [apiKeys, setApiKeys] = useState([
    {
      id: "key_1",
      name: "MacBook Pro CLI",
      prefix: "sl_live_9f8a...c21d",
      token: "sl_live_9f8a2b4c7e1d0f3a8b5c21d",
      lastUsed: "12 mins ago",
    },
    {
      id: "key_2",
      name: "VS Code Extension",
      prefix: "sl_live_3c11...88a0",
      token: "sl_live_3c114e9a2b7f1c0d9e88a0",
      lastUsed: "2 hours ago",
    },
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);

  const handleConnectRepo = () => {
    if (!selectedRepo.trim()) return;
    const slug = selectedRepo.split("/").pop()?.toLowerCase().replace(/[^a-z0-9-]/g, "-") || "new-project";
    if (projects.some((p) => p.githubRepo === selectedRepo)) return;
    setProjects((prev) => [
      {
        id: `proj_${Date.now()}`,
        name: slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        slug,
        githubRepo: selectedRepo,
        description: "Connected via GitHub OAuth repository selector.",
        defaultBranch: "main",
        webhookStatus: "active",
        lastSync: "Just now",
      },
      ...prev,
    ]);
  };

  const handlePublishDraft = (id: string) => {
    setChangelogs((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: "PUBLISHED", publishedAt: new Date().toISOString().slice(0, 10) }
          : c
      )
    );
  };

  const handleGenerateKey = () => {
    const label = newKeyName.trim() || "CLI / IDE Token";
    const randomHex = Array.from({ length: 24 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const fullToken = `sl_live_${randomHex}`;
    setApiKeys((prev) => [
      {
        id: `key_${Date.now()}`,
        name: label,
        prefix: `${fullToken.slice(0, 12)}...${fullToken.slice(-4)}`,
        token: fullToken,
        lastUsed: "Never",
      },
      ...prev,
    ]);
    setNewlyCreatedToken(fullToken);
    setNewKeyName("");
  };

  return (
    <div className="flex min-h-screen bg-[#09090B] text-zinc-100">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-white/[0.08] bg-[#0B0B0E] p-4 md:flex">
        <div>
          <Link href="/" className="mb-8 flex items-center gap-2.5 px-2 pt-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15">
              <Rocket className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-white">MergeMint</span>
            <span className="ml-auto rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
              PRO
            </span>
          </Link>

          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="dashboard-sidebar-pill"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.07]"
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4 text-violet-400" />
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
          {session?.user ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-white">
                  {session.user.name || "Developer"}
                </div>
                <div className="truncate text-[11px] text-zinc-500">
                  {session.user.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                title="Sign out"
                className="rounded-md p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => signIn("github")}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              <Github className="h-3.5 w-3.5" />
              <span>Connect GitHub</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-10">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                {SIDEBAR_ITEMS.find((i) => i.id === activeTab)?.label}
              </h1>
              <p className="mt-1 text-xs text-zinc-400">
                Manage connected repositories, AI-synthesized release drafts, and CLI/IDE tokens.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                href="/acme-cloud/changelog"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.08]"
              >
                <span>Public Hub</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.08]"
              >
                <span>Docs</span>
              </Link>
            </div>
          </div>

          {/* Mobile Tab Bar */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:hidden">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  activeTab === item.id
                    ? "bg-violet-500/20 text-violet-300"
                    : "bg-white/[0.04] text-zinc-400"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {activeTab === "projects" && (
            <div className="space-y-8">
              {/* Repo Selector */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#111114]/80 p-5">
                <h2 className="text-sm font-semibold text-white">
                  Connect GitHub Repository
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Select a repository to automatically attach push &amp; PR merge webhooks.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="flex-1 rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-xs text-zinc-200 focus:border-violet-500/50 focus:outline-none"
                  >
                    <option value="acme-corp/design-system">acme-corp/design-system</option>
                    <option value="acme-corp/edge-gateway">acme-corp/edge-gateway</option>
                    <option value="acme-corp/billing-worker">acme-corp/billing-worker</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleConnectRepo}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Connect Repository</span>
                  </button>
                </div>
              </div>

              {/* Project Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="rounded-2xl border border-white/[0.08] bg-[#111114]/80 p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-white">{proj.name}</h3>
                        <p className="font-mono text-xs text-zinc-400">{proj.githubRepo}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Webhook Active
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-zinc-400">{proj.description}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs">
                      <span className="text-zinc-500">Last sync: {proj.lastSync}</span>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/${proj.slug}/changelog`}
                          className="text-violet-400 hover:text-violet-300"
                        >
                          Changelog
                        </Link>
                        <Link
                          href={`/${proj.slug}/roadmap`}
                          className="text-violet-400 hover:text-violet-300"
                        >
                          Roadmap
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Webhook Delivery Logs */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#111114]/80 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-violet-400" />
                  <h2 className="text-sm font-semibold text-white">
                    Recent Webhook Deliveries
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-zinc-500">
                        <th className="pb-2 font-medium">Delivery ID</th>
                        <th className="pb-2 font-medium">Event</th>
                        <th className="pb-2 font-medium">Repository</th>
                        <th className="pb-2 font-medium">Commits</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                      {DEMO_WEBHOOK_DELIVERIES.map((d) => (
                        <tr key={d.id}>
                          <td className="py-2.5 text-violet-300">{d.id}</td>
                          <td className="py-2.5">{d.event}</td>
                          <td className="py-2.5">{d.repo}</td>
                          <td className="py-2.5">{d.commits}</td>
                          <td className="py-2.5 text-emerald-400">{d.status}</td>
                          <td className="py-2.5 text-zinc-500">{d.durationMs}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "drafts" && (
            <div className="space-y-4">
              {changelogs.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#111114]/80 p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-md bg-violet-500/20 px-2.5 py-0.5 font-mono text-xs text-violet-300">
                        {entry.version}
                      </span>
                      <h3 className="text-base font-semibold text-white">{entry.title}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          entry.status === "PUBLISHED"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>
                    {entry.status === "DRAFT" && (
                      <button
                        type="button"
                        onClick={() => handlePublishDraft(entry.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-400"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Publish Release</span>
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                    {entry.summary}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs">
                      <div className="mb-1.5 font-semibold text-emerald-400">
                        Features ({entry.features.length})
                      </div>
                      <ul className="space-y-1 text-zinc-300">
                        {entry.features.map((f) => (
                          <li key={f}>• {f}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs">
                      <div className="mb-1.5 font-semibold text-sky-400">
                        Improvements ({entry.improvements.length})
                      </div>
                      <ul className="space-y-1 text-zinc-300">
                        {entry.improvements.map((imp) => (
                          <li key={imp}>• {imp}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs">
                      <div className="mb-1.5 font-semibold text-amber-400">
                        Bug Fixes ({entry.bugFixes.length})
                      </div>
                      <ul className="space-y-1 text-zinc-300">
                        {entry.bugFixes.map((bug) => (
                          <li key={bug}>• {bug}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "roadmap" && (
            <div className="space-y-3">
              {DEMO_ROADMAP_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#111114]/80 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{item.title}</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-400">
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
                  </div>
                  <div className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-violet-300">
                    ▲ {item.votes}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "keys" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/[0.08] bg-[#111114]/80 p-5">
                <h2 className="text-sm font-semibold text-white">
                  Generate Personal API Token
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Use this token with <code className="font-mono text-zinc-200">mergemint login</code>{" "}
                  or in the VS Code MergeMint Explorer extension settings.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Token name (e.g. Work Laptop CLI)"
                    className="flex-1 rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateKey}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-400"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Generate Token</span>
                  </button>
                </div>

                {newlyCreatedToken && (
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 font-mono text-xs text-emerald-300">
                    <span className="truncate">{newlyCreatedToken}</span>
                    <CopyButton text={newlyCreatedToken} />
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                {apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#111114]/80 px-4 py-3 text-xs"
                  >
                    <div>
                      <div className="font-medium text-white">{k.name}</div>
                      <div className="mt-0.5 font-mono text-zinc-400">
                        {k.prefix} • Last used {k.lastUsed}
                      </div>
                    </div>
                    <CopyButton text={k.token} label="Copy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#111114]/80 p-6 text-xs text-zinc-300">
              <h2 className="text-sm font-semibold text-white">Workspace Settings</h2>
              <p className="mt-1 text-zinc-400">
                Configure default Gemini AI tone, RSS feed visibility, and webhook signing secrets.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-zinc-400">Workspace Slug</label>
                  <input
                    type="text"
                    defaultValue="acme-cloud"
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 font-mono text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400">AI Release Tone</label>
                  <select className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-zinc-200">
                    <option>Linear / Concise Developer</option>
                    <option>Vercel / Product Marketing</option>
                    <option>Raycast / Crisp &amp; Playful</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

