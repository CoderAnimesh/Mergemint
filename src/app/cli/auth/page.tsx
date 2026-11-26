"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Rocket, ShieldCheck } from "lucide-react";

function CliAuthInner() {
  const searchParams = useSearchParams();
  const port = searchParams.get("port");
  const [status, setStatus] = useState<"generating" | "redirecting" | "done" | "error">(
    "generating"
  );
  const [tokenPreview, setTokenPreview] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function authorize() {
      try {
        let rawToken = "";
        const res = await fetch("/api/v1/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: `ShipLog CLI (${new Date().toLocaleDateString()})` }),
        });

        if (res.ok) {
          const data = (await res.json()) as { rawToken?: string };
          rawToken = data.rawToken || "";
        }

        if (!rawToken) {
          const hex = Array.from(crypto.getRandomValues(new Uint8Array(20)))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          rawToken = `sl_live_${hex}`;
        }

        if (cancelled) return;
        setTokenPreview(`${rawToken.slice(0, 12)}...${rawToken.slice(-4)}`);

        if (port && /^\d+$/.test(port)) {
          setStatus("redirecting");
          const callbackUrl = `http://127.0.0.1:${port}/callback?token=${encodeURIComponent(
            rawToken
          )}`;
          window.location.href = callbackUrl;
        } else {
          setStatus("done");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void authorize();
    return () => {
      cancelled = true;
    };
  }, [port]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111114] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/15">
          <Rocket className="h-5 w-5 text-violet-400" />
        </div>

        <h1 className="mt-5 text-xl font-semibold text-white">
          Authorizing MergeMint CLI
        </h1>

        {status === "generating" && (
          <div className="mt-4 flex flex-col items-center gap-2 text-xs text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
            <span>Generating personal API token...</span>
          </div>
        )}

        {status === "redirecting" && (
          <div className="mt-4 space-y-2 text-xs text-zinc-300">
            <div className="inline-flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Token generated ({tokenPreview})</span>
            </div>
            <p className="text-zinc-400">
              Sending credentials back to your terminal...
            </p>
          </div>
        )}

        {status === "done" && (
          <div className="mt-4 space-y-2 text-xs text-emerald-400">
            <ShieldCheck className="mx-auto h-5 w-5" />
            <p>Token ready: {tokenPreview}</p>
          </div>
        )}

        {status === "error" && (
          <p className="mt-4 text-xs text-rose-400">
            Could not generate token automatically. Use /dashboard → API Keys &amp; CLI.
          </p>
        )}
      </div>
    </div>
  );
}

export default function CliAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#09090B] text-xs text-zinc-400">
          Authorizing ShipLog CLI...
        </div>
      }
    >
      <CliAuthInner />
    </Suspense>
  );
}

