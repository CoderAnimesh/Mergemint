export interface MockChangelog {
  id: string;
  version: string;
  title: string;
  summary: string;
  publishedAt: string;
  status: "PUBLISHED" | "DRAFT";
  features: string[];
  improvements: string[];
  bugFixes: string[];
  commitCount: number;
}

export interface MockRoadmapItem {
  id: string;
  title: string;
  description: string;
  status: "PLANNED" | "IN_PROGRESS" | "SHIPPED";
  category: "Feature" | "Integration" | "Performance" | "DX";
  votes: number;
  authorName: string;
  createdAt: string;
}

export interface MockProject {
  id: string;
  name: string;
  slug: string;
  githubRepo: string;
  description: string;
  defaultBranch: string;
  webhookStatus: "active" | "pending";
  lastSync: string;
}

export interface MockWebhookDelivery {
  id: string;
  event: string;
  repo: string;
  branch: string;
  commits: number;
  status: "200 OK" | "202 Accepted";
  durationMs: number;
  timestamp: string;
}

export const DEMO_PROJECTS: MockProject[] = [
  {
    id: "proj_acme_cloud",
    name: "Acme Cloud",
    slug: "acme-cloud",
    githubRepo: "acme-corp/acme-cloud",
    description: "Edge compute runtime, observability pipeline, and developer CLI.",
    defaultBranch: "main",
    webhookStatus: "active",
    lastSync: "12 mins ago",
  },
  {
    id: "proj_nexus_sdk",
    name: "Nexus TypeScript SDK",
    slug: "nexus-sdk",
    githubRepo: "acme-corp/nexus-ts",
    description: "Zero-dependency streaming SDK with edge-compatible primitives.",
    defaultBranch: "main",
    webhookStatus: "active",
    lastSync: "3 hours ago",
  },
];

export const DEMO_CHANGELOGS: MockChangelog[] = [
  {
    id: "chg_240",
    version: "v2.4.0",
    title: "Edge Streaming & Zero-Config CLI Sync",
    summary:
      "Introduced sub-50ms edge streaming for release webhooks alongside one-command local commit synchronization from @mergemint/cli.",
    publishedAt: "2026-11-24",
    status: "PUBLISHED",
    commitCount: 14,
    features: [
      "Added real-time Edge Streaming support for multi-region webhook fanout",
      "Introduced `mergemint push --draft` to stage AI-summarized releases straight from local git history",
      "Launched Public Roadmap RSS & JSON Feed endpoints at `/[slug]/rss.xml`",
    ],
    improvements: [
      "Reduced Gemini AI release synthesis latency by 42% using structured JSON schema output",
      "Improved keyboard navigation across the dashboard draft editor with Cmd+Enter publish shortcut",
    ],
    bugFixes: [
      "Fixed duplicate commit ingestion when force-pushing rebased feature branches",
      "Resolved dark-mode border contrast flicker in Safari 18",
    ],
  },
  {
    id: "chg_231",
    version: "v2.3.1",
    title: "VS Code Sidebar & Optimistic Roadmap Votes",
    summary:
      "Shipped the official MergeMint Explorer extension for VS Code and instant optimistic upvoting on public roadmap boards.",
    publishedAt: "2026-11-14",
    status: "PUBLISHED",
    commitCount: 9,
    features: [
      "Published VS Code extension with live Activity Bar explorer and one-click draft approval",
      "Added optimistic upvote counters with instant rollback protection on public roadmaps",
    ],
    improvements: [
      "Upgraded webhook signature verification to constant-time HMAC-SHA256 comparison",
    ],
    bugFixes: [
      "Fixed missing PR diff context when squash-merging multi-author pull requests",
      "Corrected timezone offset formatting on scheduled release timestamps",
    ],
  },
  {
    id: "chg_241_draft",
    version: "v2.5.0-rc.1",
    title: "Linear Two-Way Issue Sync & Custom Domains",
    summary:
      "AI-generated draft from 7 recent commits on `main`. Links merged PRs directly to Linear cycle issues and supports CNAME custom domains.",
    publishedAt: "Draft",
    status: "DRAFT",
    commitCount: 7,
    features: [
      "Two-way status sync between MergeMint Roadmap items and Linear issues",
      "Custom CNAME domain provisioning with automatic TLS certificates",
    ],
    improvements: [
      "Batch-filter dependabot and chore commits before Gemini summarization",
    ],
    bugFixes: [
      "Fixed pagination cursor reset when filtering changelogs by Bug Fixes",
    ],
  },
];

export const DEMO_ROADMAP_ITEMS: MockRoadmapItem[] = [
  {
    id: "rm_1",
    title: "Linear & Jira Two-Way Issue Sync",
    description:
      "Automatically move MergeMint roadmap items to In Progress or Shipped when linked Linear issues change state.",
    status: "IN_PROGRESS",
    category: "Integration",
    votes: 142,
    authorName: "elena@vercel-fan.dev",
    createdAt: "2026-11-02",
  },
  {
    id: "rm_2",
    title: "Slack & Discord Release Digest Webhooks",
    description:
      "Post formatted release cards with changelog highlights to #product-updates whenever a draft is published.",
    status: "IN_PROGRESS",
    category: "Integration",
    votes: 118,
    authorName: "marcus@acme.io",
    createdAt: "2026-11-05",
  },
  {
    id: "rm_3",
    title: "Custom CNAME Domains (changelog.yourapp.com)",
    description:
      "Serve your public changelog and roadmap on a custom subdomain with automated SSL.",
    status: "PLANNED",
    category: "Feature",
    votes: 96,
    authorName: "kai@linear-labs.co",
    createdAt: "2026-11-10",
  },
  {
    id: "rm_4",
    title: "Embeddable In-App 'What's New' Widget",
    description:
      "Lightweight 4KB React/WebComponent badge showing unread release notes inside your SaaS navbar.",
    status: "PLANNED",
    category: "DX",
    votes: 84,
    authorName: "priya@devtools.sh",
    createdAt: "2026-11-12",
  },
  {
    id: "rm_5",
    title: "VS Code Sidebar Extension & CLI Sync",
    description:
      "Generate and approve AI release drafts without leaving your editor or terminal.",
    status: "SHIPPED",
    category: "DX",
    votes: 204,
    authorName: "alex@mergemint.dev",
    createdAt: "2026-10-18",
  },
  {
    id: "rm_6",
    title: "Gemini 2.5 Flash Structured Release Notes",
    description:
      "Convert messy git commit logs and PR diffs into categorized Features, Improvements, and Bug Fixes.",
    status: "SHIPPED",
    category: "Performance",
    votes: 179,
    authorName: "sarah@raycast-user.io",
    createdAt: "2026-10-11",
  },
];

export const DEMO_WEBHOOK_DELIVERIES: MockWebhookDelivery[] = [
  {
    id: "del_9f81a",
    event: "push",
    repo: "acme-corp/acme-cloud",
    branch: "main",
    commits: 7,
    status: "200 OK",
    durationMs: 412,
    timestamp: "12 mins ago",
  },
  {
    id: "del_7c20b",
    event: "pull_request.closed",
    repo: "acme-corp/acme-cloud",
    branch: "feat/linear-sync",
    commits: 4,
    status: "200 OK",
    durationMs: 389,
    timestamp: "2 hours ago",
  },
  {
    id: "del_5a11c",
    event: "push",
    repo: "acme-corp/nexus-ts",
    branch: "main",
    commits: 3,
    status: "202 Accepted",
    durationMs: 295,
    timestamp: "3 hours ago",
  },
];

