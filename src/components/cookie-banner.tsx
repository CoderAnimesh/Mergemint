"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Cookie, Check } from "lucide-react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("mergemint-consent");
    if (!saved) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (level: "all" | "essential") => {
    window.localStorage.setItem("mergemint-consent", level);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="fixed bottom-4 right-4 z-50 max-w-md rounded-2xl border border-white/[0.1] bg-[#111114]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:bottom-6 sm:right-6"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15">
              <Cookie className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-white">
                Cookies, Privacy &amp; Terms
              </div>
              <p className="leading-relaxed text-zinc-400">
                MergeMint uses essential cookies for GitHub OAuth &amp; theme state. By
                continuing, you agree to our{" "}
                <Link href="/terms" className="text-emerald-400 hover:underline">
                  Terms &amp; Conditions
                </Link>
                ,{" "}
                <Link href="/privacy" className="text-emerald-400 hover:underline">
                  Privacy Policy
                </Link>
                , and{" "}
                <Link href="/cookies" className="text-emerald-400 hover:underline">
                  Cookie Policy
                </Link>
                .
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => accept("all")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Accept &amp; Agree</span>
                </button>
                <button
                  type="button"
                  onClick={() => accept("essential")}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08]"
                >
                  Essential Only
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

