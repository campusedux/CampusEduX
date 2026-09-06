import { z } from "zod";
import { resolveLanguage } from "./languages";
import { MAX_CODE_BYTES, MAX_STDIN_BYTES, byteLength } from "./limits";

/**
 * Request contract for `POST /api/compiler/run`. Mirrors the Zod-first pattern
 * in `src/lib/actions/contact.ts`: a friendly first-line check before anything
 * touches the execution provider. Treat every field as untrusted.
 */
export const runRequestSchema = z.object({
  language: z
    .string()
    .trim()
    .min(1, "Pick a language.")
    .refine((v) => resolveLanguage(v) !== null, "That language isn't supported."),
  source: z
    .string()
    .min(1, "Write some code first.")
    .refine((v) => byteLength(v) <= MAX_CODE_BYTES, `Your code is too long (max ${MAX_CODE_BYTES.toLocaleString()} bytes).`),
  stdin: z
    .string()
    .refine((v) => byteLength(v) <= MAX_STDIN_BYTES, `Your input is too long (max ${MAX_STDIN_BYTES.toLocaleString()} bytes).`)
    .optional()
    .default(""),
});

export type RunRequest = z.infer<typeof runRequestSchema>;
