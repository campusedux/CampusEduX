import { createContext, useContext } from "react";
import type { AccentTokens } from "@/theme";

/** Registry of heading views so the outline can scroll to them. */
export class AnchorRegistry {
  private nodes = new Map<string, unknown>();
  register = (id: string, node: unknown) => {
    if (node) this.nodes.set(id, node);
    else this.nodes.delete(id);
  };
  get(id: string): any {
    return this.nodes.get(id);
  }
}

export interface ReaderCtxValue {
  accent: AccentTokens;
  anchors: AnchorRegistry;
  /** Show "Run on CampusEduX Compiler" under runnable code (web compiler link-out). */
  enableRun: boolean;
}

export const ReaderCtx = createContext<ReaderCtxValue | null>(null);

export function useReaderCtx(): ReaderCtxValue {
  const v = useContext(ReaderCtx);
  if (!v) throw new Error("useReaderCtx must be used inside <ReaderCtx.Provider>");
  return v;
}
