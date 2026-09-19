import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Editor draft saved right before a "Sign in" sign-out, so a session that expired
 * mid-problem doesn't cost the user their code. One key per problem slug plus a
 * separate one for the standalone Compiler, all scoped to the user id: a draft is only
 * ever read back for the user who saved it. Restored once, then cleared.
 */
export interface EditorDraft {
  language: string;
  codeByLang: Record<string, string>;
  stdin: string;
}

const problemKey = (userId: string, slug: string) => `practice:draft:${userId}:problem:${slug}`;
const compilerKey = (userId: string) => `practice:draft:${userId}:compiler`;

async function save(key: string, draft: EditorDraft): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Best effort — never block the sign-in on a storage failure.
  }
}

/** Reads the draft and removes it in the same step (restore-then-clear). */
async function take(key: string): Promise<EditorDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    await AsyncStorage.removeItem(key);
    const d = JSON.parse(raw) as Partial<EditorDraft>;
    if (typeof d.language !== "string" || typeof d.stdin !== "string" || !d.codeByLang || typeof d.codeByLang !== "object") {
      return null;
    }
    return d as EditorDraft;
  } catch {
    return null;
  }
}

export const draftStorage = {
  saveProblem: (userId: string, slug: string, draft: EditorDraft) => save(problemKey(userId, slug), draft),
  takeProblem: (userId: string, slug: string) => take(problemKey(userId, slug)),
  saveCompiler: (userId: string, draft: EditorDraft) => save(compilerKey(userId), draft),
  takeCompiler: (userId: string) => take(compilerKey(userId)),
};
