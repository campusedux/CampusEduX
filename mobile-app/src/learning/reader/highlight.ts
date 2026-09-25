/**
 * Tiny, dependency-free syntax highlighter for SQL, Python, Java and
 * JavaScript/TypeScript. It is a scanner, not a parser: good enough to colour
 * keywords / strings / numbers / comments / functions / types in tutorials.
 *
 * INVARIANT (tested): concatenating every token's text gives back the input
 * exactly — highlighting can never alter, drop or reorder code.
 */
export type TokenKind = "plain" | "keyword" | "string" | "number" | "comment" | "fn" | "type" | "operator";
export interface Token {
  text: string;
  kind: TokenKind;
}
export type LangId = "sql" | "python" | "java" | "js";

const ALIASES: Record<string, LangId> = {
  sql: "sql", mysql: "sql", postgres: "sql", postgresql: "sql", plsql: "sql", sqlite: "sql", tsql: "sql",
  python: "python", py: "python", python3: "python",
  java: "java",
  js: "js", javascript: "js", jsx: "js", ts: "js", typescript: "js", tsx: "js", node: "js", nodejs: "js",
};

export function normalizeLang(lang: string | null | undefined): LangId | null {
  return ALIASES[(lang ?? "").toLowerCase().trim()] ?? null;
}

const words = (s: string) => new Set(s.split(/\s+/).filter(Boolean));

interface Spec {
  keywords: Set<string>;
  types?: Set<string>;
  caseInsensitive?: boolean;
  line: string[];
  block?: [string, string];
  quotes: string[];
  tripleQuotes?: boolean;
  /** Capitalised identifiers are class/type names. */
  capitalizedTypes: boolean;
}

const SPECS: Record<LangId, Spec> = {
  sql: {
    keywords: words(`select from where insert into values update set delete create table alter drop add column index view database schema primary key foreign references unique not null default check constraint and or in is like between exists join inner left right full outer cross on group by order having limit offset distinct as union all case when then else end asc desc begin commit rollback grant revoke truncate use show describe explain with if trigger procedure function returns return declare cursor open fetch close loop while for do call to top natural using any some savepoint transaction rename modify after before each row engine`),
    types: words(`int integer smallint bigint tinyint decimal numeric float double real varchar char nvarchar text date datetime timestamp time year boolean bool blob json serial money bit`),
    caseInsensitive: true,
    line: ["--", "#"],
    block: ["/*", "*/"],
    quotes: ["'", '"', "`"],
    capitalizedTypes: false,
  },
  python: {
    keywords: words(`False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case self cls`),
    line: ["#"],
    quotes: ["'", '"'],
    tripleQuotes: true,
    capitalizedTypes: true,
  },
  java: {
    keywords: words(`abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while var record sealed permits yield true false null`),
    line: ["//"],
    block: ["/*", "*/"],
    quotes: ["'", '"'],
    capitalizedTypes: true,
  },
  js: {
    keywords: words(`break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield async await of static get set true false null undefined interface type enum implements public private protected readonly declare namespace from as`),
    line: ["//"],
    block: ["/*", "*/"],
    quotes: ["'", '"', "`"],
    capitalizedTypes: true,
  },
};

const IDENT = /[A-Za-z_$][\w$]*/y;
const NUMBER = /(?:0[xX][\da-fA-F_]+|\d[\d_]*\.?\d*(?:[eE][+-]?\d+)?)[lLfFdDuU]?/y;
const OPERATOR_CHARS = new Set("+-*/%=<>!&|^~?:".split(""));

/** Merge neighbouring tokens of the same kind to keep the rendered span count low. */
function push(out: Token[], text: string, kind: TokenKind) {
  if (!text) return;
  const last = out[out.length - 1];
  if (last && last.kind === kind) last.text += text;
  else out.push({ text, kind });
}

export function tokenize(code: string, lang: string | null | undefined): Token[] {
  const id = normalizeLang(lang);
  if (!id) return [{ text: code, kind: "plain" }];
  const spec = SPECS[id];
  const out: Token[] = [];
  const n = code.length;
  let i = 0;

  while (i < n) {
    const ch = code[i];

    // whitespace
    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < n && /\s/.test(code[j])) j += 1;
      push(out, code.slice(i, j), "plain");
      i = j;
      continue;
    }

    // block comment
    if (spec.block && code.startsWith(spec.block[0], i)) {
      const end = code.indexOf(spec.block[1], i + spec.block[0].length);
      const j = end < 0 ? n : end + spec.block[1].length;
      push(out, code.slice(i, j), "comment");
      i = j;
      continue;
    }

    // line comment
    const lc = spec.line.find((p) => code.startsWith(p, i));
    if (lc) {
      let j = code.indexOf("\n", i);
      if (j < 0) j = n;
      push(out, code.slice(i, j), "comment");
      i = j;
      continue;
    }

    // python triple-quoted string
    if (spec.tripleQuotes && (code.startsWith('"""', i) || code.startsWith("'''", i))) {
      const q = code.slice(i, i + 3);
      const end = code.indexOf(q, i + 3);
      const j = end < 0 ? n : end + 3;
      push(out, code.slice(i, j), "string");
      i = j;
      continue;
    }

    // string
    if (spec.quotes.includes(ch)) {
      let j = i + 1;
      while (j < n) {
        if (code[j] === "\\" && ch !== "`" ? true : code[j] === "\\") {
          j += 2;
          continue;
        }
        if (code[j] === ch) {
          j += 1;
          break;
        }
        if (code[j] === "\n" && ch !== "`") break; // unterminated: stop at end of line
        j += 1;
      }
      j = Math.min(j, n);
      push(out, code.slice(i, j), "string");
      i = j;
      continue;
    }

    // number (not glued to an identifier)
    if (/\d/.test(ch) && !/[\w$]/.test(code[i - 1] ?? "")) {
      NUMBER.lastIndex = i;
      const m = NUMBER.exec(code);
      if (m && m[0]) {
        push(out, m[0], "number");
        i += m[0].length;
        continue;
      }
    }

    // identifier / keyword
    if (/[A-Za-z_$]/.test(ch)) {
      IDENT.lastIndex = i;
      const m = IDENT.exec(code)!;
      const word = m[0];
      const key = spec.caseInsensitive ? word.toLowerCase() : word;
      let k = i + word.length;
      while (k < n && (code[k] === " " || code[k] === "\t")) k += 1;
      const callLike = code[k] === "(";
      let kind: TokenKind = "plain";
      if (spec.keywords.has(key)) kind = "keyword";
      else if (spec.types?.has(key)) kind = "type";
      else if (callLike) kind = "fn";
      else if (spec.capitalizedTypes && /^[A-Z]/.test(word)) kind = "type";
      push(out, word, kind);
      i += word.length;
      continue;
    }

    // operators / punctuation
    push(out, ch, OPERATOR_CHARS.has(ch) ? "operator" : "plain");
    i += 1;
  }
  return out;
}
