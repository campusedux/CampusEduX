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
      className="rounded-sm border border-navy px-3 py-1.5 text-xs text-navy hover:bg-navy hover:text-paper"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
