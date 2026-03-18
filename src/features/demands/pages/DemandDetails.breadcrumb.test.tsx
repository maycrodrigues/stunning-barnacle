import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Outlet, Route, Routes } from "react-router";
import { useAppStore } from "../../../shared/store/appStore";
import { useMemberStore } from "../../members/store/memberStore";

vi.mock("../../../shared/components/common/PageMeta", () => ({
  default: () => null,
}));

vi.mock("../components/DemandTimeline", () => ({
  DemandTimeline: () => null,
}));

vi.mock("../components/DemandMap", () => ({
  DemandMap: () => null,
}));

vi.mock("../components/DemandTratativas", () => ({
  DemandTratativas: () => null,
}));

vi.mock("../components/DeadlineModal", () => ({
  DeadlineModal: () => null,
}));

vi.mock("../components/StatusChangeModal", () => ({
  StatusChangeModal: () => null,
}));

const mockGetDemandById = vi.fn();

vi.mock("../../../shared/services/db", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("../../../shared/services/db");
  return {
    ...actual,
    getDemandById: (id: string) => mockGetDemandById(id),
  };
});

import { DemandDetails } from "./DemandDetails";

const Layout: React.FC = () => {
  return (
    <div>
      <Link to="/demands/2">Ir para outra demanda</Link>
      <Outlet />
    </div>
  );
};

describe("DemandDetails breadcrumb", () => {
  beforeEach(() => {
    mockGetDemandById.mockReset();
    useAppStore.setState({
      categoryOptions: [{ value: "saude", label: "Saúde" }],
      urgencyOptions: [{ value: "baixa", label: "Baixa" }],
      statusOptions: [{ value: "em-analise", label: "Em Análise" }],
      updateDemand: vi.fn().mockResolvedValue(undefined),
    } as any);

    useMemberStore.setState({
      members: [],
      loadMembers: vi.fn().mockResolvedValue(undefined),
    } as any);
  });

  it("exibe breadcrumb com Home > Lista de Demandas > Detalhes da Demanda {protocolo}", async () => {
    mockGetDemandById.mockResolvedValue({
      id: "1",
      protocol: "20260101-001",
      title: "Título",
      category: "saude",
      urgency: "baixa",
      description: "Descrição detalhada o suficiente",
      requesterName: "Fulano",
      requesterContact: "fulano@email.com",
      status: "em-analise",
      location: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      timeline: [],
    });

    render(
      <MemoryRouter initialEntries={["/demands/1"]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/demands/:id" element={<DemandDetails />} />
          </Route>
          <Route path="/" element={<div>Home page</div>} />
          <Route path="/demands/list" element={<div>Demand list page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Lista de Demandas" })).toHaveAttribute("href", "/demands/list");
    expect(screen.getByText("Detalhes da Demanda 20260101-001")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("link", { name: "Lista de Demandas" }));
    expect(await screen.findByText("Demand list page")).toBeInTheDocument();
  });

  it("atualiza o protocolo no breadcrumb ao navegar entre demandas", async () => {
    mockGetDemandById.mockImplementation(async (id: string) => {
      return {
        id,
        protocol: id === "1" ? "20260101-001" : "20260101-002",
        title: "Título",
        category: "saude",
        urgency: "baixa",
        description: "Descrição detalhada o suficiente",
        requesterName: "Fulano",
        requesterContact: "fulano@email.com",
        status: "em-analise",
        location: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        timeline: [],
      };
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/demands/1"]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/demands/:id" element={<DemandDetails />} />
          </Route>
          <Route path="/" element={<div>Home page</div>} />
          <Route path="/demands/list" element={<div>Demand list page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Detalhes da Demanda 20260101-001")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Ir para outra demanda" }));

    await waitFor(() => {
      expect(screen.getByText("Detalhes da Demanda 20260101-002")).toBeInTheDocument();
    });
  });
});

