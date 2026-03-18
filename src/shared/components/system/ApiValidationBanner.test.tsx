import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiValidationBanner } from "./ApiValidationBanner";
import { useSystemStatusStore } from "../../store/systemStatusStore";

describe("ApiValidationBanner", () => {
  it("exibe indicador durante checagem e esconde quando API está ok", async () => {
    const startApiValidation = vi.fn().mockResolvedValue(undefined);
    const openModal = vi.fn();

    useSystemStatusStore.setState({
      openModal,
      startApiValidation,
      api: {
        status: "checking",
        url: "http://example.com/api/v1",
        startedAt: Date.now(),
        attempt: 1,
        maxAttempts: 6,
        requestTimeoutMs: 5000,
        intervalMs: 5000,
        maxDurationMs: 30_000,
      },
    } as any);

    render(<ApiValidationBanner />);

    expect(screen.getByText("Verificando conexão com a API")).toBeInTheDocument();
    expect(screen.getByText(/Tentativa 1\/6/)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Detalhes" }));
    expect(openModal).toHaveBeenCalledTimes(1);

    useSystemStatusStore.setState({
      api: {
        status: "error",
        url: "http://example.com/api/v1",
        checkedAt: Date.now(),
        latencyMs: 5000,
        error: "Fetch is aborted",
        errorKind: "timeout",
      },
    } as any);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Revalidar" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Revalidar" }));
    expect(startApiValidation).toHaveBeenCalledTimes(1);

    useSystemStatusStore.setState({
      api: {
        status: "ok",
        url: "http://example.com/api/v1",
        checkedAt: Date.now(),
        latencyMs: 10,
        httpStatus: 200,
      },
    } as any);

    await waitFor(() => {
      expect(screen.queryByText("Verificando conexão com a API")).not.toBeInTheDocument();
    });
  });
});
