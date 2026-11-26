"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import { Github, Sparkles, ArrowUpRight, LayoutDashboard, Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#demo", label: "Interactive Demo" },
  { href: "/#cli-setup", label: "CLI Setup" },
  { href: "/docs", label: "Docs" },
  { href: "/#pricing", label: "Pricing" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#09090B]/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 4 }}
            transition={{ type: "spring", stiffness: 450, damping: 22 }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/35 bg-gradient-to-br from-emerald-500/20 to-violet-500/15 shadow-[0_0_20px_rgba(16,185,129,0.22)]"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </motion.div>
          <span className="text-sm font-semibold tracking-tight text-white">
            MergeMint
          </span>
          <span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300 sm:inline-block">
            v2.4
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((item) => {
            const isActive = item.href === "/docs" && pathname?.startsWith("/docs");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition ${isActive
                    ? "font-medium text-white"
                    : "text-zinc-400 hover:text-white"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/acme-cloud/changelog"
            className="inline-flex items-center gap-1 text-sm text-zinc-400 transition hover:text-white"
          >
            <span>Public Hub</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-zinc-500" />
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            onClick={toggleTheme}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            aria-label="Toggle light and dark theme"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === "dark" ? (
                <motion.span
                  key="sun"
                  initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.18 }}
                >
                  <Sun className="h-3.5 w-3.5 text-amber-300" />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.18 }}
                >
                  <Moon className="h-3.5 w-3.5 text-violet-500" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {session?.user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/[0.1]"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-violet-400" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white text-zinc-950 px-3.5 py-2 text-xs font-semibold shadow-sm transition hover:bg-zinc-200"
            >
              <Github className="h-3.5 w-3.5" />
              <span>Sign in with GitHub</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

