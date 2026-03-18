import { useEffect, useMemo, useState, type FC } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { useOfflineStatus } from "../../hooks/useOfflineStatus";
import { syncService } from "../../services/sync";
import { useSystemStatusStore } from "../../store/systemStatusStore";

type LevelFilter = "all" | "log" | "info" | "warn" | "error" | "debug";

const formatTimestamp = (ts: number) => new Date(ts).toLocaleString();

const serializeLogs = (
  logs: Array<{ timestamp: number; level: string; source: string; message: string }>,
) => {
  return logs
    .map((l) => `[${formatTimestamp(l.timestamp)}] [${l.level}] [${l.source}] ${l.message}`)
    .join("\n");
};

export const SystemStatusModal: FC = () => {
  const isOpen = useSystemStatusStore((s) => s.isModalOpen);
  const closeModal = useSystemStatusStore((s) => s.closeModal);
  const logs = useSystemStatusStore((s) => s.logs);
  const clearLogs = useSystemStatusStore((s) => s.clearLogs);
  const api = useSystemStatusStore((s) => s.api);
  const startApiValidation = useSystemStatusStore((s) => s.startApiValidation);

  const isOffline = useOfflineStatus();
  const [unsyncedCount, setUnsyncedCount] = useState<number | null>(null);

  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (!isOpen) return;
    if (api.status !== "ok" && api.status !== "checking") {
      startApiValidation().catch(() => undefined);
    }
  }, [api.status, isOpen, startApiValidation]);

  useEffect(() => {
    if (!isOpen) return;
    syncService
      .getUnsyncedCount()
      .then((count) => setUnsyncedCount(count))
      .catch(() => setUnsyncedCount(null));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setCopyStatus("idle");
  }, [isOpen]);

  const filteredLogs = useMemo(() => {
    if (levelFilter === "all") return logs;
    return logs.filter((l) => l.level === levelFilter);
  }, [levelFilter, logs]);

  const apiBadge = useMemo(() => {
    if (api.status === "ok") return { text: "OK", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" };
    if (api.status === "checking") return { text: "Checando...", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" };
    if (api.status === "timeout") return { text: "Timeout", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
    if (api.status === "error") return { text: "Erro", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
    return { text: "N/A", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" };
  }, [api.status]);

  const handleCopy = async () => {
    try {
      const text = serializeLogs(filteredLogs);
      await navigator.clipboard.writeText(text);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1500);
    } catch {
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus("idle"), 1500);
    }
  };

  const handleDownload = () => {
    const text = serializeLogs(filteredLogs);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} className="w-[min(1000px,calc(100vw-24px))] p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Status do sistema</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Conexão, sincronização e logs para auditoria.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Sistema</h4>
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                isOffline
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              }`}
            >
              {isOffline ? "Offline" : "Online"}
            </span>
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-gray-500 dark:text-gray-400">Ambiente</dt>
              <dd className="text-right text-gray-900 dark:text-white">{import.meta.env.MODE}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-gray-500 dark:text-gray-400">Base URL</dt>
              <dd className="text-right text-gray-900 dark:text-white">{import.meta.env.BASE_URL}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-gray-500 dark:text-gray-400">Pendências p/ sync</dt>
              <dd className="text-right text-gray-900 dark:text-white">
                {typeof unsyncedCount === "number" ? unsyncedCount : "N/A"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">API</h4>
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${apiBadge.className}`}>
              {apiBadge.text}
            </span>
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-gray-500 dark:text-gray-400">URL</dt>
              <dd className="text-right text-gray-900 dark:text-white break-all">{api.url}</dd>
            </div>
            {api.status === "ok" && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-gray-500 dark:text-gray-400">HTTP</dt>
                  <dd className="text-right text-gray-900 dark:text-white">{api.httpStatus}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-gray-500 dark:text-gray-400">Latência</dt>
                  <dd className="text-right text-gray-900 dark:text-white">{api.latencyMs}ms</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-gray-500 dark:text-gray-400">Última checagem</dt>
                  <dd className="text-right text-gray-900 dark:text-white">{formatTimestamp(api.checkedAt)}</dd>
                </div>
              </>
            )}
            {api.status === "error" && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-gray-500 dark:text-gray-400">Erro</dt>
                  <dd className="text-right text-gray-900 dark:text-white break-all">{api.error}</dd>
                </div>
                {"latencyMs" in api && typeof api.latencyMs === "number" && (
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-gray-500 dark:text-gray-400">Latência</dt>
                    <dd className="text-right text-gray-900 dark:text-white">{api.latencyMs}ms</dd>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-gray-500 dark:text-gray-400">Última checagem</dt>
                  <dd className="text-right text-gray-900 dark:text-white">{formatTimestamp(api.checkedAt)}</dd>
                </div>
              </>
            )}
            {api.status === "timeout" && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-gray-500 dark:text-gray-400">Erro</dt>
                  <dd className="text-right text-gray-900 dark:text-white break-all">
                    {api.lastError ?? "Tempo máximo atingido"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-gray-500 dark:text-gray-400">Tentativas</dt>
                  <dd className="text-right text-gray-900 dark:text-white">{api.attempts}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-gray-500 dark:text-gray-400">Duração</dt>
                  <dd className="text-right text-gray-900 dark:text-white">{api.durationMs}ms</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-gray-500 dark:text-gray-400">Última checagem</dt>
                  <dd className="text-right text-gray-900 dark:text-white">{formatTimestamp(api.checkedAt)}</dd>
                </div>
              </>
            )}
          </dl>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => startApiValidation().catch(() => undefined)}
              disabled={api.status === "checking"}
            >
              {api.status === "checking" ? "Checando..." : "Revalidar"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Logs</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {filteredLogs.length} / {logs.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="all">Todos</option>
              <option value="error">Erro</option>
              <option value="warn">Warn</option>
              <option value="info">Info</option>
              <option value="log">Log</option>
              <option value="debug">Debug</option>
            </select>

            <Button variant="outline" onClick={handleCopy} disabled={filteredLogs.length === 0}>
              {copyStatus === "copied" ? "Copiado" : copyStatus === "error" ? "Falhou" : "Copiar"}
            </Button>
            <Button variant="outline" onClick={handleDownload} disabled={filteredLogs.length === 0}>
              Baixar
            </Button>
            <Button variant="outline" onClick={clearLogs} disabled={logs.length === 0}>
              Limpar
            </Button>
          </div>
        </div>

        <div className="max-h-[50vh] overflow-auto p-4">
          {filteredLogs.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Nenhum log para exibir.</div>
          ) : (
            <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-gray-900 dark:text-gray-100">
              {serializeLogs(filteredLogs)}
            </pre>
          )}
        </div>
      </div>
    </Modal>
  );
};
