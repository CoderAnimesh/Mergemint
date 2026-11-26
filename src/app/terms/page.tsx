import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/landing/footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <span className="font-mono text-xs uppercase tracking-wider text-emerald-400">
          Legal
        </span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-xs text-zinc-500">
          Last updated: November 26, 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-zinc-300">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
            <p className="text-zinc-400">
              By accessing MergeMint, installing <code className="font-mono text-xs">@mergemint/cli</code>,
              or using the MergeMint VS Code extension, you agree to be bound by these
              Terms &amp; Conditions and our{" "}
              <Link href="/privacy" className="text-emerald-400 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. Accounts &amp; API Tokens</h2>
            <p className="text-zinc-400">
              You are responsible for safeguarding your GitHub OAuth session and personal
              API tokens stored in <code className="font-mono text-xs">~/.mergemint/config.json</code>.
              Do not commit API tokens to public repositories.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">3. Acceptable Use</h2>
            <p className="text-zinc-400">
              You retain full ownership of all source repositories, changelogs, and roadmap
              content you publish. You agree not to abuse API rate limits, spoof webhook
              signatures, or upload malicious payloads.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">4. Subscriptions &amp; Termination</h2>
            <p className="text-zinc-400">
              Hobby plans are free. Paid Pro and Team subscriptions renew monthly or
              yearly and may be cancelled at any time before the next billing cycle.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

