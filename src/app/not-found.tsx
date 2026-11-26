import Link from "next/link";
import { ArrowLeft, Rocket } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090B] px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10">
        <Rocket className="h-5 w-5 text-violet-400" />
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">
        404 — Page not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-zinc-400">
        The changelog, roadmap, or workspace you&apos;re looking for doesn&apos;t exist or
        was moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to MergeMint</span>
      </Link>
    </div>
  );
}

