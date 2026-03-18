import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDB, getSettings, resetDbForTests, saveSettings } from "./db";
import { syncService } from "./sync";

const SETTINGS_ID = "global_settings";

describe("settings sync (roles/tratativas)", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    (globalThis as any).fetch = vi.fn();
    await resetDbForTests();
  });

  it("não sobrescreve roles/tratativas locais com servidor mais antigo", async () => {
    await saveSettings(
      [],
      [],
      [],
      [{ id: "t1", title: "Contato", type: "text", slug: "contato" }],
      [{ value: "assessor", label: "Assessor" }],
      []
    );

    const db = await getDB();
    const local = await db.get("settings", SETTINGS_ID);
    expect(local).toBeTruthy();
    await db.put("settings", { ...(local as any), synced: 1 });

    const olderUpdatedAt = new Date(new Date((local as any).updatedAt).getTime() - 60_000).toISOString();
    (globalThis.fetch as any).mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: SETTINGS_ID,
            categories: [],
            urgencies: [],
            status: [],
            roles: [],
            tratativas: [],
            politicalSpectrums: [],
            updatedAt: olderUpdatedAt,
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const loaded = await getSettings();
    expect(loaded.roles?.length).toBe(1);
    expect(loaded.tratativas?.length).toBe(1);
  });

  it("mantém settings como unsynced quando servidor não reflete roles/tratativas após POST", async () => {
    await saveSettings(
      [],
      [],
      [],
      [{ id: "t1", title: "Contato", type: "text", slug: "contato" }],
      [{ value: "assessor", label: "Assessor" }],
      []
    );

    const serverSettings = [
      {
        id: SETTINGS_ID,
        categories: [],
        urgencies: [],
        status: [],
        roles: [],
        tratativas: [],
        politicalSpectrums: [],
        updatedAt: new Date().toISOString(),
      },
    ];

    (globalThis.fetch as any).mockImplementation(async (input: any, init?: any) => {
      const url = String(input);
      if (url.endsWith("/settings") && init?.method === "POST") {
        return new Response("", { status: 200 });
      }
      if (url.endsWith("/settings") && (!init?.method || init?.method === "GET")) {
        return new Response(JSON.stringify(serverSettings), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("not found", { status: 404 });
    });

    await syncService.syncSettings();

    const db = await getDB();
    const stored = await db.get("settings", SETTINGS_ID);
    expect(stored?.synced).not.toBe(1);
  });
});

