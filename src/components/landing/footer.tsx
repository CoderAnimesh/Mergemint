import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#09090B] py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-white">MergeMint</span>
          <span className="text-xs text-zinc-500">
            • Automated Changelogs &amp; Developer Roadmaps
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-400">
          <Link href="/docs" className="hover:text-white">
            Documentation
          </Link>
          <Link href="/acme-cloud/changelog" className="hover:text-white">
            Demo Changelog
          </Link>
          <Link href="/acme-cloud/roadmap" className="hover:text-white">
            Demo Roadmap
          </Link>
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms &amp; Conditions
          </Link>
          <Link href="/cookies" className="hover:text-white">
            Cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}

