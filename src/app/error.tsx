"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[MergeMint Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090B] px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
        <AlertTriangle className="h-5 w-5 text-amber-400" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-md text-sm text-zinc-400">
        An unexpected error occurred while rendering this view.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Try again</span>
      </button>
    </div>
  );
}

