/** Propagates through the public loaders to app/error.tsx's retry boundary. */
export class PublicContentOverload extends Error {
  constructor(readonly reason: "queue-full" | "deadline") {
    super("Public content is temporarily busy; retry the request");
    this.name = "PublicContentOverload";
  }
}

interface WaitingFill {
  start: () => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  deadline: number;
}

/** Bounded process-local storage/admission. No stale-on-error fallback. */
export class RevisionCache {
  private entries = new Map<string, string>();
  private fills = new Map<string, Promise<string>>();
  private waiting = new Map<string, WaitingFill>();
  private active = 0;
  private bytes = 0;

  constructor(
    private maxEntries = 128,
    private maxBytes = 16 * 1024 * 1024,
    private maxFills = 32,
    private maxQueued = 64,
    private waitMs = 2000,
  ) {}

  async read<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.entries.get(key);
    if (hit !== undefined) {
      this.entries.delete(key);
      this.entries.set(key, hit);
      return JSON.parse(hit) as T;
    }
    let pending = this.fills.get(key);
    if (!pending) {
      if (this.active >= this.maxFills && this.waiting.size >= this.maxQueued)
        throw new PublicContentOverload("queue-full");
      let resolve!: (value: string) => void;
      let reject!: (error: Error) => void;
      pending = new Promise<string>((ok, fail) => { resolve = ok; reject = fail; });
      this.fills.set(key, pending);
      const start = () => {
        this.active++;
        // Both outcomes are handled on this chain; no detached rejected finally.
        void Promise.resolve().then(load).then(value => {
          const encoded = JSON.stringify(value);
          if (encoded === undefined) throw new Error("Invalid public content payload");
          const size = Buffer.byteLength(key) + Buffer.byteLength(encoded);
          if (size <= this.maxBytes) {
            while (this.entries.size >= this.maxEntries || this.bytes + size > this.maxBytes) {
              const oldest = this.entries.keys().next().value as string;
              this.bytes -= Buffer.byteLength(oldest) + Buffer.byteLength(this.entries.get(oldest)!);
              this.entries.delete(oldest);
            }
            this.entries.set(key, encoded);
            this.bytes += size;
          }
          return encoded;
        }).then(
          encoded => { this.finish(key); resolve(encoded); },
          error => { this.finish(key); reject(error); },
        );
      };
      if (this.active < this.maxFills) start();
      else {
        const timer = setTimeout(() => {
          this.waiting.delete(key);
          this.fills.delete(key);
          reject(new PublicContentOverload("deadline"));
        }, this.waitMs);
        this.waiting.set(key, { start, reject, timer, deadline: Date.now() + this.waitMs });
      }
    }
    return JSON.parse(await pending) as T;
  }

  private finish(key: string) {
    this.fills.delete(key);
    this.active--;
    while (this.active < this.maxFills && this.waiting.size) {
      const [nextKey, next] = this.waiting.entries().next().value!;
      this.waiting.delete(nextKey);
      clearTimeout(next.timer);
      // Timers can be delayed by a busy event loop; never admit expired work.
      if (Date.now() >= next.deadline) {
        this.fills.delete(nextKey);
        next.reject(new PublicContentOverload("deadline"));
      } else next.start();
    }
  }
}
