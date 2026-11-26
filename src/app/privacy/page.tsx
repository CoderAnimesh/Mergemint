import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/landing/footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <span className="font-mono text-xs uppercase tracking-wider text-emerald-400">
          Legal
        </span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs text-zinc-500">
          Last updated: November 26, 2026 • Effective immediately
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-zinc-300">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">1. Information We Collect</h2>
            <p className="text-zinc-400">
              When you sign in to MergeMint with GitHub OAuth or use the MergeMint CLI /
              IDE extension, we collect only the information required to operate the
              service:
            </p>
            <ul className="list-inside list-disc space-y-1 text-zinc-400">
              <li>Account profile details (name, email address, GitHub username, avatar).</li>
              <li>Connected repository metadata, commit messages, and PR summaries you choose to sync.</li>
              <li>SHA-256 hashed personal API tokens and webhook delivery timestamps.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. AI Processing (Google Gemini)</h2>
            <p className="text-zinc-400">
              Commit messages and diff snippets submitted via GitHub webhooks, the CLI, or
              the VS Code extension are processed through the Google Gemini API solely to
              generate structured release notes (Features, Improvements, Bug Fixes). We do
              not sell your repository data or use private code to train public models.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">3. Security &amp; Data Retention</h2>
            <p className="text-zinc-400">
              Personal API tokens are stored exclusively as one-way SHA-256 hashes, and
              GitHub webhooks are verified using constant-time HMAC-SHA256 signatures. You
              may revoke tokens or delete your workspace data at any time from the{" "}
              <Link href="/dashboard" className="text-emerald-400 hover:underline">
                Developer Dashboard
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">4. Cookies &amp; Preferences</h2>
            <p className="text-zinc-400">
              We use strictly necessary cookies for authentication and local storage for
              your Light/Dark theme preference. See our{" "}
              <Link href="/cookies" className="text-emerald-400 hover:underline">
                Cookie Policy
              </Link>{" "}
              for full details.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

