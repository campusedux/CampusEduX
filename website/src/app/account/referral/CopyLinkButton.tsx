"use client";

import { useState } from "react";

export default function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
