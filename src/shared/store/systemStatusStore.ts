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
  | { status: "checking"; url: string; startedAt: number }
  | { status: "ok"; url: string; checkedAt: number; latencyMs: number; httpStatus: number }
  | { status: "error"; url: string; checkedAt: number; latencyMs?: number; error: string };

type SystemStatusStore = {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;

  logs: AuditLogEntry[];
  addLog: (entry: Omit<AuditLogEntry, "id">) => void;
  clearLogs: () => void;

  api: ApiStatus;
  checkApi: (options?: { timeoutMs?: number }) => Promise<void>;
};

const apiUrlFromEnv = (import.meta.env.VITE_API_URL ?? "").trim();
const API_URL = apiUrlFromEnv
  ? apiUrlFromEnv
  : import.meta.env.DEV
    ? "http://localhost:3000/api/v1"
    : new URL("api/v1", new URL(import.meta.env.BASE_URL || "/", window.location.origin)).toString().replace(/\/$/, "");
const LOGS_MAX = 2000;

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
    set({ api: { status: "checking", url, startedAt } });

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
        },
      });
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const message =
        error instanceof Error ? error.message : typeof error === "string" ? error : "Erro desconhecido";
      set({
        api: {
          status: "error",
          url,
          checkedAt: Date.now(),
          latencyMs,
          error: message,
        },
      });
    } finally {
      window.clearTimeout(timeoutId);
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
