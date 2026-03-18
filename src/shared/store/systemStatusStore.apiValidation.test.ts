import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSystemStatusStore } from "./systemStatusStore";

const jsonResponse = (body: unknown, init?: ResponseInit) => {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
};

describe("systemStatusStore startApiValidation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSystemStatusStore.setState((s) => ({ ...s, api: { status: "idle", url: s.api.url }, logs: [] } as any));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("tenta periodicamente até receber HTTP 200 e marca como ok", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn();
    fetchMock
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(jsonResponse([]));

    (globalThis as any).fetch = fetchMock;

    const p = useSystemStatusStore
      .getState()
      .startApiValidation({ intervalMs: 5000, requestTimeoutMs: 5000, maxDurationMs: 30_000 });

    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);
    await p;

    const api = useSystemStatusStore.getState().api;
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(api.status).toBe("ok");
  });

  it("encerra com timeout após duração máxima", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn((_: unknown, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Fetch is aborted", "AbortError"));
        });
      });
    });

    (globalThis as any).fetch = fetchMock;

    const p = useSystemStatusStore
      .getState()
      .startApiValidation({ intervalMs: 1000, requestTimeoutMs: 500, maxDurationMs: 3000 });

    await vi.advanceTimersByTimeAsync(10_000);
    await p;

    const api = useSystemStatusStore.getState().api;
    expect(api.status).toBe("timeout");
  });
});

