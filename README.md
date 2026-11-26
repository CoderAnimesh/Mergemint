# MergeMint

**MergeMint** is an Automated Changelog, Public Voting Roadmap, CLI, and VS Code Extension ecosystem powered by **Next.js 16 (App Router)**, **Prisma + PostgreSQL (Neon)**, **NextAuth.js (GitHub OAuth)**, and **Google Gemini AI (`@google/genai`)**.

---

## Features

- **Automated GitHub Webhooks (`POST /api/webhooks/github`):** HMAC-SHA256 signature verification, noise commit filtering, and Gemini AI release note synthesis (*Features*, *Improvements*, *Bug Fixes*).
- **Developer Dashboard (`/dashboard`):** Connect GitHub repositories, inspect webhook delivery logs, edit & publish AI-generated release drafts, and generate SHA-256 hashed personal API tokens.
- **Public Project Hub (`/[projectSlug]/changelog` & `/[projectSlug]/roadmap`):** Branded changelog timeline with category filters & RSS feed (`/api/v1/rss`), plus an interactive feature-request & upvoting board (*Planned*, *In Progress*, *Shipped*).
- **Comprehensive Docs (`/docs`):** Quickstart, GitHub Actions workflow, CLI setup for VS Code / Antigravity / Cursor, IDE extension setup, and REST API reference.
- **Light & Dark Theme + Legal Pages:** Animated theme switcher, cookie/terms consent banner, `/privacy`, `/terms`, and `/cookies`.

---

## Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables
cp .env.example .env

# 3. Generate Prisma Client, push schema to Neon, and seed demo data
pnpm db:generate
pnpm db:push
pnpm db:seed

# 4. Run development server
pnpm dev
```

Open **http://localhost:3000**.

---

## Deploy to Vercel

1. Import your **MergeMint** repository in [Vercel](https://vercel.com/new).
2. Keep **Root Directory** as `./` and **Build Command** as:
   ```bash
   pnpm db:generate && pnpm build
   ```
3. Add the following Environment Variables in **Vercel → Project Settings → Environment Variables**:
   - `DATABASE_URL` — Neon PostgreSQL connection string
   - `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET` — GitHub OAuth App credentials
   - `GITHUB_WEBHOOK_SECRET` — Webhook signing secret
   - `NEXTAUTH_SECRET` — Random secret (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` — Your live deployment URL (e.g. `https://mergemint.vercel.app`)
   - `NEXT_PUBLIC_APP_URL` — Your live deployment URL
   - `GEMINI_API_KEY` — Google AI Studio API key
4. Set your GitHub OAuth App callback URL to:
   ```text
   https://your-domain.vercel.app/api/auth/callback/github
   ```

---

## REST API & Webhook Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Service, PostgreSQL, and Gemini AI status check |
| `/api/webhooks/github` | `POST` | HMAC-SHA256 verified GitHub push/PR webhook handler |
| `/api/v1/cli/sync` | `GET`, `POST` | Bearer-authenticated CLI & VS Code sync endpoint |
| `/api/v1/releases` | `POST` | Synthesize structured release notes from raw commits |
| `/api/v1/changelogs` | `GET` | Fetch changelog entries (`?project=acme-cloud`) |
| `/api/v1/projects` | `GET`, `POST` | List or connect GitHub repositories |
| `/api/v1/roadmap` | `GET`, `POST` | List or submit public roadmap feature requests |
| `/api/v1/roadmap/[id]/vote` | `POST` | Atomically increment/decrement roadmap votes |
| `/api/v1/keys` | `GET`, `POST`, `DELETE` | Manage SHA-256 hashed personal API tokens |
| `/api/v1/rss` | `GET` | RSS 2.0 XML changelog feed (`?project=acme-cloud`) |
