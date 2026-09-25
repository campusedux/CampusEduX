import { reportError, setErrorReporter } from "@/lib/errorReporting";

describe("reportError", () => {
  afterEach(() => {
    setErrorReporter(null);
    jest.restoreAllMocks();
  });

  it("logs via console.error in dev", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    reportError(new Error("boom"), { source: "test" });
    expect(spy).toHaveBeenCalled();
  });

  it("forwards to the registered reporter with context", () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const reporter = jest.fn();
    setErrorReporter(reporter);
    const err = new Error("x");
    reportError(err, { source: "s", componentStack: "stack" });
    expect(reporter).toHaveBeenCalledWith(err, { source: "s", componentStack: "stack" });
  });

  it("never throws when the reporter itself throws", () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    setErrorReporter(() => {
      throw new Error("reporter down");
    });
    expect(() => reportError(new Error("x"))).not.toThrow();
  });
});
