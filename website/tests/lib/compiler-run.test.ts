import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { runCode } from "@/lib/compiler/run";

const ORIGINAL_ENV = { ...process.env };

const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

/** Single-impl fetch stub keyed off the request URL. */
function stubFetch(impl: (url: string, init: RequestInit) => unknown) {
  const fn = vi.fn(async (url: unknown, init: unknown) => impl(String(url), init as RequestInit));
  vi.stubGlobal("fetch", fn);
  return fn;
}

/** Route the Paiza create -> get_status -> get_details lifecycle. */
function stubPaiza(opts: { create: unknown; status?: unknown[]; details: unknown }) {
  let i = 0;
  return stubFetch((url) => {
    if (url.includes("/runners/create")) return jsonResponse(200, opts.create);
    if (url.includes("/runners/get_status")) {
      const seq = opts.status ?? [{ status: "completed" }];
      return jsonResponse(200, seq[Math.min(i++, seq.length - 1)]);
    }
    if (url.includes("/runners/get_details")) return jsonResponse(200, opts.details);
    throw new Error(`unexpected url: ${url}`);
  });
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  for (const k of ["COMPILER_PROVIDER", "JUDGE0_URL", "JUDGE0_KEY", "JUDGE0_AUTH_TOKEN", "PISTON_URL", "PAIZA_URL", "PAIZA_API_KEY"]) {
    delete process.env[k];
  }
});
afterEach(() => {
  vi.unstubAllGlobals();
  process.env = { ...ORIGINAL_ENV };
});

describe("runCode — Paiza (default provider)", () => {
  it("maps a completed run to stdout", async () => {
    stubPaiza({
      create: { id: "abc", status: "completed" },
      details: { stdout: "Hello, CampusEduX!\n", stderr: "", exit_code: "0", result: "success", build_result: "success" },
    });
    const out = await runCode({ language: "java", source: "class Main{}", stdin: "" });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.provider).toBe("paiza");
      expect(out.run.stdout).toBe("Hello, CampusEduX!\n");
      expect(out.run.status).toBe("success");
      expect(out.run.timedOut).toBe(false);
    }
  });

  it("maps a build failure to a compile error", async () => {
    stubPaiza({
      create: { id: "abc", status: "completed" },
      details: { build_result: "failure", build_stderr: "Main.java:1: error: ';' expected", stdout: null, stderr: null, exit_code: "1", result: "failure" },
    });
    const out = await runCode({ language: "java", source: "class Main{", stdin: "" });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.run.status).toBe("compile_error");
      expect(out.run.compileOutput).toContain("error");
    }
  });

  it("maps result=timeout to a timed-out run", async () => {
    stubPaiza({
      create: { id: "abc", status: "completed" },
      details: { result: "timeout", stdout: "", stderr: "", exit_code: null, build_result: "success" },
    });
    const out = await runCode({ language: "python", source: "while True: pass", stdin: "" });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.run.timedOut).toBe(true);
      expect(out.run.status).toBe("timeout");
    }
  });

  it("polls get_status until the run completes", async () => {
    const fn = stubPaiza({
      create: { id: "abc", status: "running" },
      status: [{ status: "running" }, { status: "completed" }],
      details: { stdout: "ok\n", stderr: "", exit_code: "0", result: "success", build_result: "success" },
    });
    const out = await runCode({ language: "c", source: "int main(){}", stdin: "" });
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.run.stdout).toBe("ok\n");
    expect(fn.mock.calls.filter((c) => String(c[0]).includes("get_status")).length).toBeGreaterThanOrEqual(1);
  });

  it("returns a friendly error when the guest sandbox rejects the request (401)", async () => {
    stubFetch((url) => (url.includes("/runners/create") ? jsonResponse(401, { error: "whitelist only" }) : jsonResponse(200, {})));
    const out = await runCode({ language: "java", source: "class Main{}", stdin: "" });
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.code).toBe("provider_error");
      expect(out.error).not.toMatch(/paiza|api_key|guest|http/i);
    }
  });

  it("returns a friendly error on a network failure", async () => {
    stubFetch(() => {
      throw new Error("ECONNREFUSED 1.2.3.4:443");
    });
    const out = await runCode({ language: "python", source: "print(1)", stdin: "" });
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.code).toBe("provider_error");
      expect(out.error).not.toMatch(/ECONNREFUSED|1\.2\.3\.4/);
    }
  });
});

describe("runCode — Judge0", () => {
  beforeEach(() => {
    process.env.COMPILER_PROVIDER = "judge0";
    process.env.JUDGE0_URL = "https://judge0.example.test";
  });

  it("base64-decodes stdout from a Judge0 submission", async () => {
    const fetchFn = stubFetch((url) => {
      expect(url).toContain("/submissions?base64_encoded=true&wait=true");
      return jsonResponse(200, {
        stdout: Buffer.from("Hello, CampusEduX!\n", "utf8").toString("base64"),
        stderr: null,
        compile_output: null,
        message: null,
        exit_code: 0,
        time: "0.12",
        status: { id: 3, description: "Accepted" },
      });
    });
    const out = await runCode({ language: "java", source: "class Main{}", stdin: "" });
    expect(fetchFn).toHaveBeenCalledOnce();
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.provider).toBe("judge0");
      expect(out.run.stdout).toBe("Hello, CampusEduX!\n");
      expect(out.run.status).toBe("success");
    }
  });

  it("maps status id 5 to a timeout", async () => {
    stubFetch(() =>
      jsonResponse(200, {
        stdout: null,
        stderr: null,
        compile_output: null,
        message: null,
        exit_code: null,
        time: null,
        status: { id: 5, description: "Time Limit Exceeded" },
      }),
    );
    const out = await runCode({ language: "cpp", source: "int main(){for(;;);}", stdin: "" });
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.run.status).toBe("timeout");
  });

  it("reports not_configured when judge0 is selected without a URL", async () => {
    delete process.env.JUDGE0_URL;
    const out = await runCode({ language: "java", source: "class Main{}", stdin: "" });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.code).toBe("not_configured");
  });
});

describe("runCode — Piston (self-hosted only)", () => {
  beforeEach(() => {
    process.env.COMPILER_PROVIDER = "piston";
    process.env.PISTON_URL = "https://piston.example.test";
  });

  it("maps a successful run", async () => {
    stubFetch(() => jsonResponse(200, { run: { stdout: "hi\n", stderr: "", code: 0, signal: null } }));
    const out = await runCode({ language: "python", source: "print('hi')", stdin: "" });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.provider).toBe("piston");
      expect(out.run.stdout).toBe("hi\n");
      expect(out.run.status).toBe("success");
    }
  });

  it("maps a compile error", async () => {
    stubFetch(() => jsonResponse(200, { compile: { code: 1, stderr: "main.c:1: error: bad", output: "" }, run: {} }));
    const out = await runCode({ language: "c", source: "int main(", stdin: "" });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.run.status).toBe("compile_error");
      expect(out.run.compileOutput).toContain("error");
    }
  });

  it("maps a killed process (SIGKILL) to a timeout", async () => {
    stubFetch(() => jsonResponse(200, { run: { stdout: "", stderr: "", code: null, signal: "SIGKILL" } }));
    const out = await runCode({ language: "java", source: "class Main{}", stdin: "" });
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.run.status).toBe("timeout");
  });

  it("treats a whitelist 401 as a configuration problem", async () => {
    stubFetch(() => jsonResponse(401, { message: "Public Piston API is now whitelist only" }));
    const out = await runCode({ language: "python", source: "print(1)", stdin: "" });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.code).toBe("not_configured");
  });
});
