export class PublicReadTimeout extends Error {
  constructor(readonly deadlineMs: number) {
    super("Public content is temporarily unavailable; retry the request");
  }
}

/** Bound the complete read, including response decoding and transports that ignore abort. */
export async function publicReadDeadline<T>(read: () => PromiseLike<T>, ms = 10_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(read),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new PublicReadTimeout(ms)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
