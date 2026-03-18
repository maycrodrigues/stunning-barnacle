import { create } from "zustand";
import { ulid } from "ulid";

type LogLevel = "log" | "info" | "warn" | "error" | "debug";

export type AuditLogEntry = {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: "console" | "window.error" | "window.unhandledrejection";
  message: string;
};

type ApiStatus =
  | { status: "idle"; url: string }
  | {
      status: "checking";
      url: string;
      startedAt: number;
      attempt: number;
      maxAttempts: number;
      requestTimeoutMs: number;
      intervalMs: number;
      maxDurationMs: number;
      lastError?: string;
    }
  | { status: "ok"; url: string; checkedAt: number; latencyMs: number; httpStatus: number }
  | {
      status: "error";
      url: string;
      checkedAt: number;
      latencyMs?: number;
      error: string;
      errorKind?: "timeout" | "network" | "http" | "invalid_response" | "unknown";
    }
  | {
      status: "timeout";
      url: string;
      checkedAt: number;
      durationMs: number;
      attempts: number;
      lastError?: string;
    };

type SystemStatusStore = {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;

  logs: AuditLogEntry[];
  addLog: (entry: Omit<AuditLogEntry, "id">) => void;
  clearLogs: () => void;

  api: ApiStatus;
  checkApi: (options?: { timeoutMs?: number }) => Promise<void>;
  startApiValidation: (options?: {
    intervalMs?: number;
    requestTimeoutMs?: number;
    maxDurationMs?: number;
  }) => Promise<void>;
};

const apiUrlFromEnv = (import.meta.env.VITE_API_URL ?? "").trim();
const API_URL = apiUrlFromEnv
  ? apiUrlFromEnv
  : import.meta.env.DEV
    ? "http://localhost:3000/api/v1"
    : new URL("api/v1", new URL(import.meta.env.BASE_URL || "/", window.location.origin)).toString().replace(/\/$/, "");
const LOGS_MAX = 2000;
let activeApiValidationRunId: string | null = null;

const formatMessage = (args: unknown[]): string => {
  return args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack ?? ""}`.trim();
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(" ");
};

export const useSystemStatusStore = create<SystemStatusStore>((set) => ({
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  logs: [],
  addLog: (entry) =>
    set((state) => {
      const next = [...state.logs, { ...entry, id: ulid() }];
      if (next.length <= LOGS_MAX) return { logs: next };
      return { logs: next.slice(next.length - LOGS_MAX) };
    }),
  clearLogs: () => set({ logs: [] }),

  api: { status: "idle", url: API_URL },
  checkApi: async ({ timeoutMs = 5000 } = {}) => {
    const url = API_URL;
    const startedAt = Date.now();
    set({
      api: {
        status: "checking",
        url,
        startedAt,
        attempt: 1,
        maxAttempts: 1,
        requestTimeoutMs: timeoutMs,
        intervalMs: 0,
        maxDurationMs: timeoutMs,
      },
    });

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${url}/settings`, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });
      const latencyMs = Date.now() - startedAt;

      if (response.ok) {
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          try {
            await response.json();
          } catch {
            set({
              api: {
                status: "error",
                url,
                checkedAt: Date.now(),
                latencyMs,
                error: "Resposta inválida (JSON)",
                errorKind: "invalid_response",
              },
            });
            return;
          }
        }
        set({
          api: {
            status: "ok",
            url,
            checkedAt: Date.now(),
            latencyMs,
            httpStatus: response.status,
          },
        });
        return;
      }

      set({
        api: {
          status: "error",
          url,
          checkedAt: Date.now(),
          latencyMs,
          error: `HTTP ${response.status} ${response.statusText}`.trim(),
          errorKind: "http",
        },
      });
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const isAbort =
        error instanceof DOMException
          ? error.name === "AbortError"
          : error instanceof Error
            ? error.name === "AbortError" || /aborted/i.test(error.message)
            : false;
      const errorKind = isAbort ? "timeout" : error instanceof TypeError ? "network" : "unknown";
      const message = error instanceof Error ? error.message : typeof error === "string" ? error : "Erro desconhecido";
      set({
        api: {
          status: "error",
          url,
          checkedAt: Date.now(),
          latencyMs,
          error: message,
          errorKind,
        },
      });
    } finally {
      window.clearTimeout(timeoutId);
    }
  },
  startApiValidation: async ({ intervalMs = 5000, requestTimeoutMs = 5000, maxDurationMs = 30_000 } = {}) => {
    const url = API_URL;
    const runId = ulid();
    activeApiValidationRunId = runId;

    const startedAt = Date.now();
    const deadline = startedAt + maxDurationMs;
    const maxAttempts = Math.max(1, Math.ceil(maxDurationMs / Math.max(250, intervalMs)));

    let attempt = 0;
    let lastError: string | undefined;

    console.info("[API][Validation] start", { url, intervalMs, requestTimeoutMs, maxDurationMs, maxAttempts });

    while (Date.now() < deadline && activeApiValidationRunId === runId) {
      attempt += 1;
      set({
        api: {
          status: "checking",
          url,
          startedAt,
          attempt,
          maxAttempts,
          requestTimeoutMs,
          intervalMs,
          maxDurationMs,
          lastError,
        },
      });

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);
      const requestStartedAt = Date.now();

      try {
        console.info("[API][Validation] attempt", { attempt, url });
        const response = await fetch(`${url}/settings`, {
          method: "GET",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });
        const latencyMs = Date.now() - requestStartedAt;

        if (!response.ok) {
          lastError = `HTTP ${response.status} ${response.statusText}`.trim();
          set({
            api: {
              status: "error",
              url,
              checkedAt: Date.now(),
              latencyMs,
              error: lastError,
              errorKind: "http",
            },
          });
        } else {
          const contentType = response.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            try {
              await response.json();
            } catch {
              lastError = "Resposta inválida (JSON)";
              set({
                api: {
                  status: "error",
                  url,
                  checkedAt: Date.now(),
                  latencyMs,
                  error: lastError,
                  errorKind: "invalid_response",
                },
              });
              continue;
            }
          }

          console.info("[API][Validation] ok", { url, latencyMs, httpStatus: response.status, attempt });
          set({
            api: {
              status: "ok",
              url,
              checkedAt: Date.now(),
              latencyMs,
              httpStatus: response.status,
            },
          });
          activeApiValidationRunId = null;
          return;
        }
      } catch (error) {
        const latencyMs = Date.now() - requestStartedAt;
        const isAbort =
          error instanceof DOMException
            ? error.name === "AbortError"
            : error instanceof Error
              ? error.name === "AbortError" || /aborted/i.test(error.message)
              : false;
        const errorKind = isAbort ? "timeout" : error instanceof TypeError ? "network" : "unknown";
        lastError = error instanceof Error ? error.message : typeof error === "string" ? error : "Erro desconhecido";

        console.warn("[API][Validation] error", { attempt, url, errorKind, lastError });
        set({
          api: {
            status: "error",
            url,
            checkedAt: Date.now(),
            latencyMs,
            error: lastError,
            errorKind,
          },
        });
      } finally {
        window.clearTimeout(timeoutId);
      }

      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) break;
      const waitMs = Math.min(intervalMs, remainingMs);
      await new Promise<void>((resolve) => window.setTimeout(resolve, waitMs));
    }

    if (activeApiValidationRunId === runId) {
      console.error("[API][Validation] timeout", {
        url,
        attempts: attempt,
        durationMs: Date.now() - startedAt,
        lastError,
      });
      set({
        api: {
          status: "timeout",
          url,
          checkedAt: Date.now(),
          durationMs: Date.now() - startedAt,
          attempts: attempt,
          lastError,
        },
      });
      activeApiValidationRunId = null;
    }
  },
}));

let clientLoggingInitialized = false;

export const initClientAuditLogging = () => {
  if (clientLoggingInitialized) return;
  clientLoggingInitialized = true;

  const store = useSystemStatusStore;

  const patchConsole = (level: LogLevel) => {
    const original = console[level] as (...args: unknown[]) => void;
    console[level] = (...args: unknown[]) => {
      store.getState().addLog({
        timestamp: Date.now(),
        level,
        source: "console",
        message: formatMessage(args),
      });
      original(...args);
    };
  };

  patchConsole("log");
  patchConsole("info");
  patchConsole("warn");
  patchConsole("error");
  patchConsole("debug");

  window.addEventListener("error", (event) => {
    const message =
      event.error instanceof Error
        ? `${event.error.name}: ${event.error.message}\n${event.error.stack ?? ""}`.trim()
        : event.message;
    store.getState().addLog({
      timestamp: Date.now(),
      level: "error",
      source: "window.error",
      message,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? `${reason.name}: ${reason.message}\n${reason.stack ?? ""}`.trim()
        : formatMessage([reason]);
    store.getState().addLog({
      timestamp: Date.now(),
      level: "error",
      source: "window.unhandledrejection",
      message,
    });
  });
};
