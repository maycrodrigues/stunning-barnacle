import { type FC, useMemo } from "react";
import { useSystemStatusStore } from "../../store/systemStatusStore";

export const ApiValidationBanner: FC = () => {
  const api = useSystemStatusStore((s) => s.api);
  const startApiValidation = useSystemStatusStore((s) => s.startApiValidation);
  const openModal = useSystemStatusStore((s) => s.openModal);

  const view = useMemo(() => {
    if (api.status === "checking") {
      const progressText = `${api.attempt}/${api.maxAttempts}`;
      return {
        tone: "info" as const,
        title: "Verificando conexão com a API",
        subtitle: api.lastError ? `Último erro: ${api.lastError}` : `Tentativa ${progressText}`,
        showSpinner: true,
      };
    }
    if (api.status === "error") {
      return {
        tone: "error" as const,
        title: "API indisponível",
        subtitle: api.error,
        showSpinner: false,
      };
    }
    if (api.status === "timeout") {
      return {
        tone: "error" as const,
        title: "Validação da API excedeu o tempo máximo",
        subtitle: api.lastError ?? "Sem resposta de sucesso dentro do tempo limite.",
        showSpinner: false,
      };
    }
    return null;
  }, [api]);

  if (!view) return null;

  const toneClasses =
    view.tone === "info"
      ? "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-100"
      : "border-red-200 bg-red-50 text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100";

  const actionButtonClasses =
    "inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900";

  return (
    <div className={`border-b ${toneClasses}`}>
      <div className="mx-auto flex max-w-(--breakpoint-2xl) flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex min-w-0 items-start gap-3">
          {view.showSpinner ? (
            <span
              className="mt-0.5 inline-flex h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
          ) : (
            <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 rounded-full bg-current/25" aria-hidden="true" />
          )}

          <div className="min-w-0">
            <div className="text-sm font-semibold">{view.title}</div>
            <div className="text-xs opacity-80 truncate max-w-[85vw] md:max-w-[60vw]">{view.subtitle}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => openModal()}
            className={`${actionButtonClasses} border-current/25 bg-transparent text-current hover:bg-current/10`}
          >
            Detalhes
          </button>
          <button
            type="button"
            onClick={() => startApiValidation().catch(() => undefined)}
            disabled={api.status === "checking"}
            className={`${actionButtonClasses} border-current/25 bg-transparent text-current hover:bg-current/10 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {api.status === "checking" ? "Checando..." : "Revalidar"}
          </button>
        </div>
      </div>
    </div>
  );
};
