import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/landing/footer";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <span className="font-mono text-xs uppercase tracking-wider text-emerald-400">
          Legal
        </span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Cookie Policy
        </h1>
        <p className="mt-2 text-xs text-zinc-500">
          Last updated: November 26, 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-zinc-300">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">1. Essential Cookies</h2>
            <p className="text-zinc-400">
              MergeMint sets strictly necessary HTTP-only session cookies via NextAuth.js
              (<code className="font-mono text-xs">next-auth.session-token</code>) to keep
              you signed in securely with GitHub OAuth.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. Preference Storage</h2>
            <p className="text-zinc-400">
              We store your Light/Dark theme selection (<code className="font-mono text-xs">mergemint-theme</code>)
              and your cookie consent choice (<code className="font-mono text-xs">mergemint-consent</code>)
              locally in your browser so your preferences persist across visits.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">3. Managing Cookies</h2>
            <p className="text-zinc-400">
              You can clear browser cookies or local storage at any time. For questions,
              review our{" "}
              <Link href="/privacy" className="text-emerald-400 hover:underline">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/terms" className="text-emerald-400 hover:underline">
                Terms &amp; Conditions
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

