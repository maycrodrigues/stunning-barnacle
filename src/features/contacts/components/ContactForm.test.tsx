import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAppStore } from "../../../shared/store/appStore";

afterEach(() => {
  cleanup();
});

vi.mock("leaflet/dist/images/marker-icon.png", () => ({ default: "" }));
vi.mock("leaflet/dist/images/marker-shadow.png", () => ({ default: "" }));

vi.mock("leaflet", () => {
  const Marker = { prototype: { options: {} as Record<string, unknown> } };
  return {
    default: {
      icon: (options: unknown) => options,
      Marker,
    },
  };
});

vi.mock("react-leaflet", async () => {
  const React = await import("react");
  const passthrough = (testId: string) =>
    function Component({ children }: { children?: React.ReactNode }) {
      return React.createElement("div", { "data-testid": testId }, children);
    };

  return {
    LayersControl: Object.assign(passthrough("layers-control"), {
      BaseLayer: passthrough("base-layer"),
    }),
    MapContainer: passthrough("map-container"),
    Marker: passthrough("marker"),
    TileLayer: passthrough("tile-layer"),
    useMap: () => ({
      getZoom: () => 13,
      setView: () => undefined,
    }),
    useMapEvents: () => undefined,
  };
});

import { ContactForm } from "./ContactForm";

describe("ContactForm", () => {
  it("submete e fecha a modal quando salvar com sucesso", async () => {
    useAppStore.setState({
      politicalSpectrumOptions: [{ value: "esquerda", label: "Esquerda" }],
    });

    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <ContactForm
        isOpen
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    await user.type(screen.getByLabelText(/Nome Completo/i), "João da Silva");

    const selectTrigger = screen.getByText("Selecione...").closest("button");
    expect(selectTrigger).toBeTruthy();
    await user.click(selectTrigger!);
    await user.click(screen.getByText("Esquerda"));

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "João da Silva",
          politicalSpectrum: "esquerda",
        })
      )
    );

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("não fecha a modal quando salvar falha e exibe erro", async () => {
    useAppStore.setState({
      politicalSpectrumOptions: [{ value: "esquerda", label: "Esquerda" }],
    });

    const onClose = vi.fn();
    const onSubmit = vi.fn().mockRejectedValue(new Error("Falha ao persistir no backend"));
    const user = userEvent.setup();

    render(
      <ContactForm
        isOpen
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    await user.type(screen.getByLabelText(/Nome Completo/i), "João da Silva");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onClose).not.toHaveBeenCalled();
    expect(await screen.findByText("Erro ao salvar")).toBeInTheDocument();
    expect(screen.getByText("Falha ao persistir no backend")).toBeInTheDocument();
  });
});
