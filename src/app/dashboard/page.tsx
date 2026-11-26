"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import {
  FolderGit2,
  Sparkles,
  Map,
  KeyRound,
  Settings,
  BarChart3,
  Receipt,
  Github,
  Plus,
  CheckCircle2,
  ExternalLink,
  Send,
  LogOut,
  Rocket,
  CreditCard,
  ShieldCheck,
  Lock,
  Loader2,
  X,
  Calendar,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";

type DashboardTab =
  | "projects"
  | "drafts"
  | "roadmap"
  | "stats"
  | "billing"
  | "keys"
  | "settings";
type PlanCode = "HOBBY" | "PRO" | "TEAM";

interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  githubRepo: string | null;
  description: string | null;
  defaultBranch: string;
}

interface ChangelogItem {
  id: string;
  version: string;
  title: string;
  summary: string;
  status: "PUBLISHED" | "DRAFT";
  publishedAt: string | null;
}

interface RoadmapEntry {
  id: string;
  title: string;
  description: string;
  status: string;
  votes: number;
}

interface ApiKeyEntry {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
}

interface GitHubRepo {
  id: number;
  fullName: string;
  name: string;
  private: boolean;
  defaultBranch: string;
  description: string | null;
}

interface BillingTransaction {
  id: string;
  orderId: string;
  gokwikTxnId: string | null;
  plan: PlanCode;
  amountInr: number;
  amountUsd: number;
  paymentMethod: string;
  autoPay: boolean;
  status: string;
  createdAt: string;
}

interface BillingState {
  billingStatus: "ACTIVE" | "PAST_DUE" | "CANCELLED";
  autoPayEnabled: boolean;
  gokwikMandateId: string | null;
  paymentMethodBrand: string | null;
  paymentMethodLast4: string | null;
  purchasedAt: string | null;
  currentPeriodEnd: string | null;
  gracePeriodEndsAt: string | null;
  transactions: BillingTransaction[];
}

const PLAN_DETAILS: Record<
  PlanCode,
  { label: string; badge: string; priceInr: string; limit: number }
> = {
  HOBBY: { label: "Free", badge: "FREE", priceInr: "₹0/mo", limit: 1 },
  PRO: { label: "Pro", badge: "PRO", priceInr: "₹49/mo", limit: 10 },
  TEAM: {
    label: "Ultra",
    badge: "ULTRA",
    priceInr: "₹69/mo",
    limit: Number.POSITIVE_INFINITY,
  },
};

const SIDEBAR_ITEMS: { id: DashboardTab; label: string; icon: typeof FolderGit2 }[] = [
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "drafts", label: "AI Release Drafts", icon: Sparkles },
  { id: "roadmap", label: "Roadmap & Votes", icon: Map },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "billing", label: "Billing", icon: Receipt },
  { id: "keys", label: "API Keys & CLI", icon: KeyRound },
  { id: "settings", label: "Settings", icon: Settings },
];

function DashboardInner() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const checkoutStartedRef = useRef(false);

  const [activeTab, setActiveTab] = useState<DashboardTab>("projects");
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [plan, setPlan] = useState<PlanCode>("HOBBY");
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const [changelogs, setChangelogs] = useState<ChangelogItem[]>([]);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapEntry[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);

  const [billing, setBilling] = useState<BillingState>({
    billingStatus: "ACTIVE",
    autoPayEnabled: true,
    gokwikMandateId: null,
    paymentMethodBrand: null,
    paymentMethodLast4: null,
    purchasedAt: null,
    currentPeriodEnd: null,
    gracePeriodEndsAt: null,
    transactions: [],
  });

  const [gokwikModal, setGokwikModal] = useState<{
    open: boolean;
    targetPlan: PlanCode;
    orderId: string;
    amountInr: number;
    method: "upi" | "card" | "netbanking";
    last4: string;
    processing: boolean;
  } | null>(null);

  const loadBilling = async () => {
    try {
      const res = await fetch("/api/v1/billing/gokwik");
      if (res.ok) {
        const data = (await res.json()) as BillingState & { plan?: PlanCode };
        if (data.plan) setPlan(data.plan);
        setBilling({
          billingStatus: data.billingStatus || "ACTIVE",
          autoPayEnabled: data.autoPayEnabled ?? true,
          gokwikMandateId: data.gokwikMandateId || null,
          paymentMethodBrand: data.paymentMethodBrand || null,
          paymentMethodLast4: data.paymentMethodLast4 || null,
          purchasedAt: data.purchasedAt || null,
          currentPeriodEnd: data.currentPeriodEnd || null,
          gracePeriodEndsAt: data.gracePeriodEndsAt || null,
          transactions: Array.isArray(data.transactions) ? data.transactions : [],
        });
      }
    } catch {
      // ignore transient errors
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;

    async function loadWorkspaceData() {
      try {
        const projRes = await fetch("/api/v1/projects");
        if (projRes.ok) {
          const data = (await projRes.json()) as {
            projects?: ProjectItem[];
            plan?: PlanCode;
          };
          const loadedProjects = Array.isArray(data.projects) ? data.projects : [];
          setProjects(loadedProjects);
          if (data.plan) setPlan(data.plan);

          if (loadedProjects.length > 0) {
            const firstSlug = loadedProjects[0].slug;
            const [chgRes, rmRes] = await Promise.all([
              fetch(`/api/v1/changelogs?project=${encodeURIComponent(firstSlug)}`),
              fetch(`/api/v1/roadmap?project=${encodeURIComponent(firstSlug)}`),
            ]);
            if (chgRes.ok) {
              const chgData = (await chgRes.json()) as { changelogs?: ChangelogItem[] };
              setChangelogs(Array.isArray(chgData.changelogs) ? chgData.changelogs : []);
            }
            if (rmRes.ok) {
              const rmData = (await rmRes.json()) as { items?: RoadmapEntry[] };
              setRoadmapItems(Array.isArray(rmData.items) ? rmData.items : []);
            }
          }
        }

        const keysRes = await fetch("/api/v1/keys");
        if (keysRes.ok) {
          const kData = (await keysRes.json()) as { keys?: ApiKeyEntry[] };
          setApiKeys(Array.isArray(kData.keys) ? kData.keys : []);
        }
      } catch {
        // ignore transient fetch errors
      }
    }

    async function loadGitHubRepos() {
      setLoadingRepos(true);
      try {
        const res = await fetch("/api/v1/github/repos");
        if (res.ok) {
          const data = (await res.json()) as { repos?: GitHubRepo[] };
          const list = Array.isArray(data.repos) ? data.repos : [];
          setGithubRepos(list);
          if (list.length > 0) setSelectedRepo(list[0].fullName);
        }
      } finally {
        setLoadingRepos(false);
      }
    }

    void loadWorkspaceData();
    void loadGitHubRepos();
    void loadBilling();
  }, [status]);

  const handleStartGokwikCheckout = async (targetPlan: PlanCode) => {
    if (targetPlan === "HOBBY") return;
    const res = await fetch("/api/v1/billing/gokwik", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_order", plan: targetPlan }),
    });
    const data = (await res.json()) as {
      checkoutUrl?: string | null;
      orderId: string;
      amountInr: number;
    };

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }

    setGokwikModal({
      open: true,
      targetPlan,
      orderId: data.orderId,
      amountInr: data.amountInr,
      method: "upi",
      last4: "okicici",
      processing: false,
    });
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    const requestedTab = searchParams.get("tab") as DashboardTab | null;
    if (
      requestedTab &&
      ["projects", "drafts", "roadmap", "stats", "billing", "keys", "settings"].includes(
        requestedTab
      )
    ) {
      setActiveTab(requestedTab);
    }

    const checkoutPlan = searchParams.get("checkout") as PlanCode | null;
    if (
      !checkoutStartedRef.current &&
      (checkoutPlan === "PRO" || checkoutPlan === "TEAM")
    ) {
      checkoutStartedRef.current = true;
      setActiveTab("settings");
      void handleStartGokwikCheckout(checkoutPlan);
    }
  }, [status, searchParams]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090B] text-xs text-zinc-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-400" />
        <span>Loading MergeMint workspace...</span>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111114] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15">
            <Rocket className="h-5 w-5 text-emerald-400" />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-white">
            Sign in to MergeMint
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            Connect your GitHub account to manage repositories, view billing &amp; stats,
            or complete your GoKwik subscription checkout.
          </p>
          <button
            type="button"
            onClick={() => signIn("github")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            <Github className="h-4 w-4" />
            <span>Sign in with GitHub</span>
          </button>
        </div>
      </div>
    );
  }

  const currentPlanInfo = PLAN_DETAILS[plan];
  const repoLimitReached = projects.length >= currentPlanInfo.limit;
  const publishedCount = changelogs.filter((c) => c.status === "PUBLISHED").length;
  const draftCount = changelogs.filter((c) => c.status === "DRAFT").length;
  const totalVotes = roadmapItems.reduce((sum, item) => sum + item.votes, 0);
  const totalPaidInr = billing.transactions
    .filter((t) => t.status === "SUCCESS")
    .reduce((sum, t) => sum + t.amountInr, 0);

  const handleConnectRepo = async () => {
    setConnectError(null);
    if (!selectedRepo.trim()) return;
    if (projects.some((p) => p.githubRepo === selectedRepo)) {
      setConnectError("This repository is already connected.");
      return;
    }
    if (repoLimitReached) {
      setConnectError(
        `Your ${currentPlanInfo.label} plan allows ${currentPlanInfo.limit} repository. Upgrade to Pro (₹49/mo) or Ultra (₹69/mo) in Settings.`
      );
      return;
    }

    setConnecting(true);
    try {
      const repoMeta = githubRepos.find((r) => r.fullName === selectedRepo);
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubRepo: selectedRepo,
          description: repoMeta?.description || "Connected via GitHub OAuth",
          defaultBranch: repoMeta?.defaultBranch || "main",
        }),
      });

      const data = (await res.json()) as { project?: ProjectItem; error?: string };
      if (!res.ok) {
        setConnectError(data.error || "Failed to connect repository.");
        return;
      }
      if (data.project) {
        setProjects((prev) => [data.project!, ...prev]);
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleConfirmGokwikPayment = async () => {
    if (!gokwikModal) return;
    setGokwikModal((prev) => (prev ? { ...prev, processing: true } : null));

    const res = await fetch("/api/v1/billing/gokwik", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "confirm_payment",
        plan: gokwikModal.targetPlan,
        orderId: gokwikModal.orderId,
        paymentMethod: gokwikModal.method,
        paymentLast4: gokwikModal.last4,
      }),
    });

    if (res.ok) {
      setPlan(gokwikModal.targetPlan);
      setConnectError(null);
      await loadBilling();
    }
    setGokwikModal(null);
  };

  const handleToggleAutoPay = async () => {
    const next = !billing.autoPayEnabled;
    setBilling((prev) => ({ ...prev, autoPayEnabled: next }));
    await fetch("/api/v1/billing/gokwik", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_autopay", autoPayEnabled: next }),
    });
  };

  const handlePublishDraft = async (id: string) => {
    setChangelogs((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: "PUBLISHED", publishedAt: new Date().toISOString().slice(0, 10) }
          : c
      )
    );
    await fetch("/api/v1/cli/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer dashboard_session",
      },
      body: JSON.stringify({ action: "approve", draftId: id }),
    });
  };

  const handleGenerateKey = async () => {
    const label = newKeyName.trim() || "CLI / IDE Token";
    const res = await fetch("/api/v1/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: label }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        key: { id: string; name: string; prefix: string };
        rawToken: string;
      };
      setApiKeys((prev) => [
        {
          id: data.key.id,
          name: data.key.name,
          prefix: data.key.prefix,
          lastUsedAt: null,
        },
        ...prev,
      ]);
      setNewlyCreatedToken(data.rawToken);
      setNewKeyName("");
    }
  };

  const activeProjectSlug = projects[0]?.slug || "acme-cloud";

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
            <span className="ml-auto rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
              {currentPlanInfo.badge}
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
                  <Icon className="relative z-10 h-4 w-4 text-emerald-400" />
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-white">
                {session?.user?.name || "Developer"}
              </div>
              <div className="truncate text-[11px] text-zinc-500">
                {session?.user?.email}
              </div>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign out"
              className="rounded-md p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-10">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                {SIDEBAR_ITEMS.find((i) => i.id === activeTab)?.label}
              </h1>
              <p className="mt-1 text-xs text-zinc-400">
                Plan:{" "}
                <span className="font-medium text-emerald-400">
                  {currentPlanInfo.label} ({currentPlanInfo.priceInr})
                </span>{" "}
                • {projects.length} /{" "}
                {currentPlanInfo.limit === Number.POSITIVE_INFINITY
                  ? "∞"
                  : currentPlanInfo.limit}{" "}
                repositories connected
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                href={`/${activeProjectSlug}/changelog`}
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
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-white/[0.04] text-zinc-400"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* PROJECTS TAB */}
          {activeTab === "projects" && (
            <div className="space-y-8">
              <div className="rounded-2xl border border-white/[0.08] bg-[#111114]/80 p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Connect GitHub Repository
                    </h2>
                    <p className="mt-1 text-xs text-zinc-400">
                      {loadingRepos
                        ? "Loading your GitHub repositories..."
                        : githubRepos.length > 0
                          ? `Showing ${githubRepos.length} repositories from your GitHub account.`
                          : "No repositories found on your GitHub account."}
                    </p>
                  </div>
                  {repoLimitReached && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20"
                    >
                      Upgrade Plan
                    </button>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    disabled={loadingRepos || githubRepos.length === 0}
                    className="flex-1 rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500/50 focus:outline-none"
                  >
                    {githubRepos.length === 0 ? (
                      <option value="">No repositories loaded</option>
                    ) : (
                      githubRepos.map((repo) => (
                        <option key={repo.id} value={repo.fullName}>
                          {repo.fullName} {repo.private ? "(Private)" : "(Public)"}
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={handleConnectRepo}
                    disabled={connecting || loadingRepos || !selectedRepo}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-60"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{connecting ? "Connecting..." : "Connect Repository"}</span>
                  </button>
                </div>

                {connectError && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
                    <span>{connectError}</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className="font-semibold text-amber-300 underline"
                    >
                      Upgrade via GoKwik →
                    </button>
                  </div>
                )}
              </div>

              {projects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-[#111114]/40 p-10 text-center text-xs text-zinc-400">
                  No repositories connected yet. Select a repository above and click{" "}
                  <strong className="text-zinc-200">Connect Repository</strong> to start
                  minting changelogs.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="rounded-2xl border border-white/[0.08] bg-[#111114]/80 p-5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-white">
                            {proj.name}
                          </h3>
                          <p className="font-mono text-xs text-zinc-400">
                            {proj.githubRepo || proj.slug}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Connected
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-zinc-400">
                        {proj.description || "Connected GitHub repository."}
                      </p>
                      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs">
                        <span className="text-zinc-500">
                          Branch: {proj.defaultBranch || "main"}
                        </span>
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/${proj.slug}/changelog`}
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            Changelog
                          </Link>
                          <Link
                            href={`/${proj.slug}/roadmap`}
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            Roadmap
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI RELEASE DRAFTS TAB */}
          {activeTab === "drafts" && (
            <div className="space-y-4">
              {changelogs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-[#111114]/40 p-10 text-center text-xs text-zinc-400">
                  No AI release drafts yet. Connect a repository and run{" "}
                  <code className="font-mono text-emerald-300">mergemint init</code> or
                  push commits via GitHub webhook.
                </div>
              ) : (
                changelogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-white/[0.08] bg-[#111114]/80 p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 font-mono text-xs text-emerald-300">
                          {entry.version}
                        </span>
                        <h3 className="text-base font-semibold text-white">
                          {entry.title}
                        </h3>
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
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Publish Release</span>
                        </button>
                      )}
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                      {entry.summary}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ROADMAP & VOTES TAB */}
          {activeTab === "roadmap" && (
            <div className="space-y-3">
              {roadmapItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-[#111114]/40 p-10 text-center text-xs text-zinc-400">
                  No roadmap items yet for your connected projects.
                </div>
              ) : (
                roadmapItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#111114]/80 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {item.title}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-400">
                          {item.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
                    </div>
                    <div className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-emerald-300">
                      ▲ {item.votes}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* STATS TAB */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Connected Repos",
                    value: `${projects.length} / ${
                      currentPlanInfo.limit === Number.POSITIVE_INFINITY
                        ? "∞"
                        : currentPlanInfo.limit
                    }`,
                    sub: `${currentPlanInfo.label} Plan`,
                  },
                  {
                    label: "Published Releases",
                    value: String(publishedCount),
                    sub: `${draftCount} pending AI draft(s)`,
                  },
                  {
                    label: "Roadmap Votes",
                    value: String(totalVotes),
                    sub: `${roadmapItems.length} feature requests`,
                  },
                  {
                    label: "Total Billed (INR)",
                    value: `₹${totalPaidInr}`,
                    sub: `${billing.transactions.length} GoKwik transaction(s)`,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/[0.08] bg-[#111114]/80 p-5"
                  >
                    <div className="text-xs text-zinc-400">{stat.label}</div>
                    <div className="mt-2 text-2xl font-semibold text-white">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-[11px] text-emerald-400">{stat.sub}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-[#111114]/80 p-6 text-xs">
                <h2 className="text-sm font-semibold text-white">
                  Account &amp; Workspace Overview
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <div className="text-zinc-500">Account Owner</div>
                    <div className="mt-1 font-medium text-white">
                      {session?.user?.name || "GitHub User"}
                    </div>
                    <div className="text-zinc-400">{session?.user?.email}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500">Subscription Status</div>
                    <div className="mt-1 font-medium text-emerald-400">
                      {currentPlanInfo.label} ({billing.billingStatus})
                    </div>
                    <div className="text-zinc-400">
                      AutoPay: {billing.autoPayEnabled ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500">Personal API Keys</div>
                    <div className="mt-1 font-medium text-white">
                      {apiKeys.length} active token(s)
                    </div>
                    <div className="text-zinc-400">CLI &amp; VS Code ready</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BILLING TAB (All Previous Paid Bills for this Account) */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/[0.08] bg-[#111114]/80 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Billing History &amp; Previous Paid Bills
                    </h2>
                    <p className="mt-1 text-xs text-zinc-400">
                      All GoKwik invoices and AutoPay renewals for{" "}
                      <span className="text-zinc-200">{session?.user?.email}</span>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
                  >
                    Manage Plan
                  </button>
                </div>

                {billing.transactions.length === 0 ? (
                  <div className="py-10 text-center text-xs text-zinc-400">
                    No previous paid bills found for this account yet.
                  </div>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-zinc-500">
                          <th className="pb-2">Date</th>
                          <th className="pb-2">Order ID</th>
                          <th className="pb-2">GoKwik Txn</th>
                          <th className="pb-2">Plan</th>
                          <th className="pb-2">Amount</th>
                          <th className="pb-2">Method</th>
                          <th className="pb-2">AutoPay</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                        {billing.transactions.map((t) => (
                          <tr key={t.id}>
                            <td className="py-2.5 text-zinc-400">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 text-emerald-300">{t.orderId}</td>
                            <td className="py-2.5 text-zinc-400">
                              {t.gokwikTxnId || "—"}
                            </td>
                            <td className="py-2.5">
                              {PLAN_DETAILS[t.plan]?.label || t.plan}
                            </td>
                            <td className="py-2.5">₹{t.amountInr}</td>
                            <td className="py-2.5 uppercase">{t.paymentMethod}</td>
                            <td className="py-2.5">{t.autoPay ? "Yes" : "No"}</td>
                            <td
                              className={`py-2.5 ${
                                t.status === "SUCCESS"
                                  ? "text-emerald-400"
                                  : t.status === "FAILED"
                                    ? "text-rose-400"
                                    : "text-amber-300"
                              }`}
                            >
                              {t.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* API KEYS & CLI TAB */}
          {activeTab === "keys" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/[0.08] bg-[#111114]/80 p-5">
                <h2 className="text-sm font-semibold text-white">
                  Generate Personal API Token
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Use this token with{" "}
                  <code className="font-mono text-zinc-200">mergemint login</code> or in
                  the VS Code MergeMint Explorer extension settings.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Token name (e.g. Work Laptop CLI)"
                    className="flex-1 rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-emerald-500/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateKey}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
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

              {apiKeys.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-[#111114]/40 p-8 text-center text-xs text-zinc-400">
                  No API keys generated yet. Generate one above or run{" "}
                  <code className="font-mono text-emerald-300">mergemint login</code>.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {apiKeys.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#111114]/80 px-4 py-3 text-xs"
                    >
                      <div>
                        <div className="font-medium text-white">{k.name}</div>
                        <div className="mt-0.5 font-mono text-zinc-400">
                          {k.prefix} •{" "}
                          {k.lastUsedAt
                            ? `Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`
                            : "Never used"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB (Subscription Dates, Upgrade Options & Saved Payment Details) */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Current Subscription Summary & Dates */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#111114]/80 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-400" />
                    <h2 className="text-sm font-semibold text-white">
                      Subscription, Renewal Dates &amp; GoKwik Payment
                    </h2>
                  </div>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-300">
                    {currentPlanInfo.label} • {billing.billingStatus}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 rounded-xl border border-white/[0.06] bg-[#09090B] p-4 text-xs sm:grid-cols-4">
                  <div>
                    <div className="flex items-center gap-1 text-zinc-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Purchase Date</span>
                    </div>
                    <div className="mt-1 font-medium text-white">
                      {billing.purchasedAt
                        ? new Date(billing.purchasedAt).toLocaleDateString()
                        : "Free Tier (No charge)"}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-zinc-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Next Renewal Date</span>
                    </div>
                    <div className="mt-1 font-medium text-white">
                      {billing.currentPeriodEnd
                        ? new Date(billing.currentPeriodEnd).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500">Saved Payment Method</div>
                    <div className="mt-1 font-medium text-white">
                      {billing.paymentMethodBrand
                        ? `${billing.paymentMethodBrand} (${billing.paymentMethodLast4})`
                        : "Not added"}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end">
                    <button
                      type="button"
                      onClick={handleToggleAutoPay}
                      className={`rounded-lg border px-3 py-1.5 font-semibold transition ${
                        billing.autoPayEnabled
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                          : "border-white/10 bg-white/[0.04] text-zinc-400"
                      }`}
                    >
                      AutoPay: {billing.autoPayEnabled ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>

                {billing.billingStatus === "PAST_DUE" && billing.gracePeriodEndsAt && (
                  <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    AutoPay renewal failed. Your plan will automatically cancel on{" "}
                    <strong>
                      {new Date(billing.gracePeriodEndsAt).toLocaleDateString()}
                    </strong>{" "}
                    (within 3 days of expiry) unless payment succeeds.
                  </div>
                )}

                {/* Upgrade Options */}
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {(["HOBBY", "PRO", "TEAM"] as PlanCode[]).map((tier) => {
                    const info = PLAN_DETAILS[tier];
                    const isCurrent = plan === tier;
                    return (
                      <div
                        key={tier}
                        className={`flex flex-col justify-between rounded-xl border p-5 ${
                          isCurrent
                            ? "border-emerald-500/40 bg-emerald-500/[0.06]"
                            : "border-white/[0.08] bg-[#09090B]"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-white">
                              {info.label}
                            </span>
                            {isCurrent && (
                              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="mt-3 text-2xl font-semibold text-white">
                            {info.priceInr}
                          </div>
                          <p className="mt-2 text-xs text-zinc-400">
                            {info.limit === Number.POSITIVE_INFINITY
                              ? "Unlimited connected GitHub repositories"
                              : `Up to ${info.limit} connected GitHub ${
                                  info.limit === 1 ? "repository" : "repositories"
                                }`}
                          </p>
                          {tier !== "HOBBY" && (
                            <p className="mt-1.5 text-[11px] text-emerald-400/90">
                              AutoPay via GoKwik • 3-day grace on failed renewal
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={isCurrent || tier === "HOBBY"}
                          onClick={() => handleStartGokwikCheckout(tier)}
                          className={`mt-5 w-full rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            isCurrent || tier === "HOBBY"
                              ? "border border-white/10 bg-white/[0.04] text-zinc-500"
                              : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                          }`}
                        >
                          {isCurrent
                            ? "Active Plan"
                            : tier === "HOBBY"
                              ? "Included"
                              : `Upgrade & Pay ${info.priceInr} (GoKwik)`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* GoKwik Checkout Modal */}
      <AnimatePresence>
        {gokwikModal?.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111114] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      GoKwik Secure Checkout
                    </h3>
                    <p className="font-mono text-[11px] text-zinc-500">
                      Order {gokwikModal.orderId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGokwikModal(null)}
                  className="rounded-md p-1 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#09090B] p-3.5">
                  <div>
                    <div className="text-zinc-300">
                      MergeMint {PLAN_DETAILS[gokwikModal.targetPlan].label} Plan
                    </div>
                    <div className="text-[11px] text-emerald-400">
                      AutoPay Mandate • Cancels in 3 days if renewal fails
                    </div>
                  </div>
                  <span className="text-base font-semibold text-white">
                    ₹{gokwikModal.amountInr}/mo
                  </span>
                </div>

                <div>
                  <label className="mb-1.5 block text-zinc-400">
                    UPI ID / Card Last 4 (saved for AutoPay)
                  </label>
                  <input
                    type="text"
                    value={gokwikModal.last4}
                    onChange={(e) =>
                      setGokwikModal((prev) =>
                        prev ? { ...prev, last4: e.target.value } : null
                      )
                    }
                    placeholder="name@okicici or 4242"
                    className="w-full rounded-xl border border-white/10 bg-[#09090B] px-3 py-2 font-mono text-xs text-zinc-200 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-zinc-400">Select Payment Method</div>
                  {(
                    [
                      { id: "upi", label: "UPI (GPay / PhonePe / Paytm)" },
                      { id: "card", label: "Credit / Debit Card" },
                      { id: "netbanking", label: "NetBanking" },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setGokwikModal((prev) =>
                          prev ? { ...prev, method: m.id } : null
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition ${
                        gokwikModal.method === m.id
                          ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                          : "border-white/[0.08] bg-[#09090B] text-zinc-400 hover:border-white/20"
                      }`}
                    >
                      <span>{m.label}</span>
                      <span className="h-2.5 w-2.5 rounded-full border border-emerald-400 bg-emerald-400/80" />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={gokwikModal.processing}
                  onClick={handleConfirmGokwikPayment}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  {gokwikModal.processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying with GoKwik...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      <span>Pay ₹{gokwikModal.amountInr} Now</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#09090B] text-xs text-zinc-400">
          Loading MergeMint workspace...
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
