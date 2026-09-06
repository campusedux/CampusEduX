/**
 * Per-language source fix-ups applied server-side just before a run.
 *
 * The execution providers (Paiza / Judge0 / Piston) all compile Java from a
 * fixed `Main.java`, so a snippet whose public type is `HelloWorld` fails with
 * "class HelloWorld is public, should be declared in a file named
 * HelloWorld.java". Tutorial code uses all sorts of class names, so we rename
 * the public top-level type (and its own references) to `Main`. The rewrite
 * skips string / char / text-block literals and comments so it can't corrupt
 * program text.
 *
 * Other languages are filename-agnostic and pass through untouched.
 */
export function normalizeSource(languageId: string, source: string): string {
  if (languageId === "java") return renameJavaPublicTypeToMain(source);
  return source;
}

function renameJavaPublicTypeToMain(src: string): string {
  const decl =
    /\bpublic\s+(?:(?:final|abstract|sealed|non-sealed|strictfp)\s+)*(?:class|interface|enum|record)\s+([A-Za-z_$][\w$]*)/.exec(
      src,
    );
  if (!decl) return src;
  const name = decl[1];
  if (name === "Main") return src;

  const ident = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
  let out = "";
  let i = 0;
  const n = src.length;

  while (i < n) {
    const ch = src[i];
    const two = src.slice(i, i + 2);
    const three = src.slice(i, i + 3);

    // line comment
    if (two === "//") {
      const end = src.indexOf("\n", i);
      const stop = end === -1 ? n : end;
      out += src.slice(i, stop);
      i = stop;
      continue;
    }
    // block comment
    if (two === "/*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      out += src.slice(i, stop);
      i = stop;
      continue;
    }
    // text block """ ... """
    if (three === '"""') {
      const end = src.indexOf('"""', i + 3);
      const stop = end === -1 ? n : end + 3;
      out += src.slice(i, stop);
      i = stop;
      continue;
    }
    // string / char literal
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < n && src[j] !== ch) {
        if (src[j] === "\\") j += 2;
        else j += 1;
      }
      j = Math.min(j + 1, n);
      out += src.slice(i, j);
      i = j;
      continue;
    }
    // plain code — consume up to the next literal / comment start, rename there
    let j = i;
    while (j < n) {
      const t2 = src.slice(j, j + 2);
      if (src[j] === '"' || src[j] === "'" || t2 === "//" || t2 === "/*") break;
      j += 1;
    }
    out += src.slice(i, j).replace(ident, "Main");
    i = j;
  }

  return out;
}
