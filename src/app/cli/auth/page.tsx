"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { CheckCircle2, Github, Loader2, Rocket, ShieldCheck } from "lucide-react";

function CliAuthInner() {
  const searchParams = useSearchParams();
  const { status: sessionStatus } = useSession();
  const port = searchParams.get("port");
  const [status, setStatus] = useState<
    "checking" | "needs_login" | "generating" | "redirecting" | "done" | "error"
  >("checking");
  const [tokenPreview, setTokenPreview] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (sessionStatus === "loading") {
      setStatus("checking");
      return;
    }

    if (sessionStatus === "unauthenticated") {
      setStatus("needs_login");
      return;
    }

    let cancelled = false;
    setStatus("generating");

    async function authorize() {
      try {
        const res = await fetch("/api/v1/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `MergeMint CLI (${new Date().toLocaleDateString()})`,
          }),
        });

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const data = (await res.json()) as { rawToken?: string };
        const rawToken = data.rawToken || "";
        if (!rawToken) {
          throw new Error("Server did not return a token");
        }

        if (cancelled) return;
        setTokenPreview(`${rawToken.slice(0, 12)}...${rawToken.slice(-4)}`);

        if (port && /^\d+$/.test(port)) {
          setStatus("redirecting");
          const callbackUrl = `http://127.0.0.1:${port}/callback?token=${encodeURIComponent(
            rawToken
          )}`;
          try {
            await fetch(callbackUrl, { mode: "no-cors" });
            setStatus("done");
          } catch {
            window.location.href = callbackUrl;
          }
        } else {
          setStatus("done");
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : "Failed to generate token");
          setStatus("error");
        }
      }
    }

    void authorize();
    return () => {
      cancelled = true;
    };
  }, [port, sessionStatus]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111114] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15">
          <Rocket className="h-5 w-5 text-emerald-400" />
        </div>

        <h1 className="mt-5 text-xl font-semibold text-white">
          Authorizing MergeMint CLI
        </h1>

        {status === "checking" && (
          <div className="mt-4 flex flex-col items-center gap-2 text-xs text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            <span>Checking your GitHub session...</span>
          </div>
        )}

        {status === "needs_login" && (
          <div className="mt-4 space-y-4 text-xs text-zinc-400">
            <p>Sign in with GitHub so MergeMint can save a verified CLI token to your account.</p>
            <button
              type="button"
              onClick={() => signIn("github", { callbackUrl: window.location.href })}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              <Github className="h-4 w-4" />
              <span>Sign in with GitHub</span>
            </button>
          </div>
        )}

        {status === "generating" && (
          <div className="mt-4 flex flex-col items-center gap-2 text-xs text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            <span>Generating &amp; saving personal API token...</span>
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
            {errorMsg || "Could not generate token. Use /dashboard → API Keys & CLI."}
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
          Authorizing MergeMint CLI...
        </div>
      }
    >
      <CliAuthInner />
    </Suspense>
  );
}

