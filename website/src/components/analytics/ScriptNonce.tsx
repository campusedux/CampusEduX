"use client";

import { createContext, useContext, type ReactNode } from "react";

const ScriptNonceContext = createContext<string | undefined>(undefined);

/** Server layouts must reference a client component, rather than the context object. */
export function ScriptNonceProvider({ nonce, children }: { nonce?: string; children: ReactNode }) {
  return <ScriptNonceContext.Provider value={nonce}>{children}</ScriptNonceContext.Provider>;
}

export const useScriptNonce = () => useContext(ScriptNonceContext);

/** Dynamic third-party loaders must carry the initial document's nonce. */
export function documentScriptNonce(): string | undefined {
  return document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')?.content || undefined;
}
