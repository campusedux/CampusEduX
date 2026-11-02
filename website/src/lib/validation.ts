import { z } from "zod";

// Keep the website's displayed v3 messages while using the patched v4 parser.
// Pass per parse: do not change Zod's global configuration or SDK consumers.
export const validationError: z.core.$ZodErrorMap = (issue) => {
  switch (issue.code) {
    case "invalid_type": {
      if (issue.input === undefined) return "Required";
      const received = issue.input === null ? "null" : Array.isArray(issue.input) ? "array" : typeof issue.input;
      return `Expected ${issue.expected}, received ${received}`;
    }
    case "too_big":
      if (issue.origin === "string") return `String must contain at most ${issue.maximum} character(s)`;
      if (issue.origin === "array") return `Array must contain at most ${issue.maximum} element(s)`;
      if (issue.origin === "number") return `Number must be less than or equal to ${issue.maximum}`;
      return undefined;
    case "too_small":
      if (issue.origin === "string") return `String must contain at least ${issue.minimum} character(s)`;
      if (issue.origin === "array") return `Array must contain at least ${issue.minimum} element(s)`;
      if (issue.origin === "number") return `Number must be greater than or equal to ${issue.minimum}`;
      return undefined;
    case "invalid_value": {
      const options = issue.values.map((value) => typeof value === "string" ? `'${value}'` : String(value)).join(" | ");
      if (issue.input === undefined) return "Required";
      if (typeof issue.input !== "string") return `Expected ${options}, received ${issue.input === null ? "null" : Array.isArray(issue.input) ? "array" : typeof issue.input}`;
      return `Invalid enum value. Expected ${options}, received '${issue.input}'`;
    }
    case "unrecognized_keys":
      return `Unrecognized key(s) in object: ${issue.keys.map((key) => `'${key}'`).join(", ")}`;
    case "invalid_format":
      return issue.format === "regex" ? "Invalid" : `Invalid ${issue.format === "guid" ? "uuid" : issue.format}`;
    case "custom":
    case "invalid_union":
      return "Invalid input";
    default:
      return undefined;
  }
};

// Section names are extensible, so a new key-count cap would change the contract.
// Fail on the first invalid value before record parsing can accumulate issues.
// Server Actions retain Next's existing 1 MiB transport bound.
export function stringRecordSchema(maxLength?: number) {
  return z.custom<Record<string, string>>((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    for (const key in value) {
      const text = (value as Record<string, unknown>)[key];
      if (typeof text !== "string" || (maxLength !== undefined && text.length > maxLength)) return false;
    }
    return true;
  }, { error: "Invalid request." }).pipe(z.record(z.string(), maxLength === undefined ? z.string() : z.string().max(maxLength)));
}
