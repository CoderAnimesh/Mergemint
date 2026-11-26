"use client";

import { CopyButton } from "./copy-button";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export function CodeBlock({ code, language = "bash", filename }: CodeBlockProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0D0D10]">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-violet-400/70" />
          <span className="font-mono text-xs text-zinc-400">
            {filename || language}
          </span>
        </div>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-zinc-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

