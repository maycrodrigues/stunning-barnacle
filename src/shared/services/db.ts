import { openDB, DBSchema, IDBPDatabase } from "idb";
import { ulid } from "ulid";
import { DemandFormData } from "../../features/demands/types";
import { z } from "zod";
import { mergePreferRemoteDefined } from "../utils/mergePreferRemoteDefined";

const apiUrlFromEnv = (import.meta.env.VITE_API_URL ?? "").trim();
const API_URL = apiUrlFromEnv
  ? apiUrlFromEnv
  : import.meta.env.DEV
    ? "http://localhost:3000/api/v1"
    : new URL("api/v1", new URL(import.meta.env.BASE_URL || "/", window.location.origin)).toString().replace(/\/$/, "");

export interface Option {
  value: string;
  label: string;
  badge?: {
    text?: string;
    color?: "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";
  };
}

export interface StatusHistoryEntry {
  status: string;
  startDate: Date;
  endDate?: Date;
  duration?: number; // in milliseconds
  responsibleId?: string;
}

export type TimelineEventType = 'created' | 'updated' | 'status_change' | 'comment' | 'attachment' | 'tratativa';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: Date;
  title: string;
  description?: string;
  metadata?: {
    from?: any;
    to?: any;
    field?: string;
    [key: string]: any;
  };
  user?: string;
}

export interface Tratativa {
  id: string;
  title: string;
  type: 'text' | 'number' | 'long_text';
  slug: string;
}

export interface DemandTratativa {
  id: string;
  tratativaId: string; // ID from Tratativa config
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

interface GabineteDB extends DBSchema {
  demands: {
    key: string;
    value: DemandFormData & { 
      id: string; 
      tenantId: string;
      createdAt: Date; 
      updatedAt: Date;
      protocol: string; 
      active: boolean; 
      status: string;
      statusHistory: StatusHistoryEntry[];
      totalDuration?: number;
      timeline: TimelineEvent[];
      tratativas?: DemandTratativa[];
      synced?: number; // 0 = false, 1 = true
    };
    indexes: { "by-date": Date; "by-protocol": string; "by-synced": number };
  };
  settings: {
    key: string;
    value: { 
      id: string; 
      tenantId: string;
      categories: Option[]; 
      urgencies: Option[]; 
      status: Option[]; 
      tratativas?: Tratativa[]; 
      roles?: Option[];
      politicalSpectrums?: Option[];
      updatedAt?: Date;
      synced?: number; // 0 = false, 1 = true
    };
    indexes: { "by-synced": number };
  };
  members: {
    key: string;
    value: Member;
    indexes: { "by-synced": number };
  };
  contacts: {
    key: string;
    value: Contact;
    indexes: { "by-synced": number };
  };
}

const DB_NAME = import.meta.env.MODE === "test" ? "gabinete-online-db-test" : "gabinete-online-db";
const DB_VERSION = 7; // Incremented version for schema update

let dbPromise: Promise<IDBPDatabase<GabineteDB>> | null = null;

export const resetDbForTests = async () => {
  if (import.meta.env.MODE !== "test") return;
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
  }
  dbPromise = null;
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
};

export interface Member {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  photo?: string;
  roleId?: string; // Link to role option value
  social?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    x?: string;
  };
  active?: boolean;
  createdAt: Date;
  updatedAt: Date;
  synced?: number; // 0 = false, 1 = true
}

export interface Contact {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  neighborhood?: string;
  notes?: string;
  isVoter?: boolean;
  politicalSpectrum?: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  synced?: number; // 0 = false, 1 = true
}

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<GabineteDB>(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        // Demands Store
        let demandsStore;
        if (!db.objectStoreNames.contains("demands")) {
          demandsStore = db.createObjectStore("demands", {
            keyPath: "id",
          });
        } else {
          demandsStore = transaction.objectStore("demands");
        }

        if (!demandsStore.indexNames.contains("by-date")) {
          demandsStore.createIndex("by-date", "createdAt");
        }
        if (!demandsStore.indexNames.contains("by-synced")) {
          demandsStore.createIndex("by-synced", "synced");
        }

        // Settings Store
        let settingsStore;
        if (!db.objectStoreNames.contains("settings")) {
          settingsStore = db.createObjectStore("settings", { keyPath: "id" });
        } else {
          settingsStore = transaction.objectStore("settings");
        }
        if (!settingsStore.indexNames.contains("by-synced")) {
          settingsStore.createIndex("by-synced", "synced");
        }
        
        // Members Store
        let membersStore;
        if (!db.objectStoreNames.contains("members")) {
          membersStore = db.createObjectStore("members", { keyPath: "id" });
        } else {
          membersStore = transaction.objectStore("members");
        }
        if (!membersStore.indexNames.contains("by-synced")) {
          membersStore.createIndex("by-synced", "synced");
        }

        // Contacts Store
        let contactsStore;
        if (!db.objectStoreNames.contains("contacts")) {
          contactsStore = db.createObjectStore("contacts", { keyPath: "id" });
        } else {
          contactsStore = transaction.objectStore("contacts");
        }
        if (!contactsStore.indexNames.contains("by-synced")) {
          contactsStore.createIndex("by-synced", "synced");
        }
      },
    });
  }
  return dbPromise;
};

// Demand operations
export const saveDemand = async (
  demand: DemandFormData,
  actorName: string = 'Sistema',
  tenantId: string = 'default-tenant'
): Promise<DemandFormData & { id: string; tenantId: string; createdAt: Date; updatedAt: Date; protocol: string; active: boolean; status: string; statusHistory: StatusHistoryEntry[]; totalDuration?: number; timeline: TimelineEvent[]; synced?: number }> => {
  const db = await getDB();
  const id = ulid();
  const today = new Date();
  
  // Protocol Generation: YYYYMMDD-XXX
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const datePrefix = `${year}${month}${day}`;

  // Count demands created today to determine the sequence number
  // Since we don't have a direct "count by date" index query that supports partial matching easily in all IDB wrappers,
  // we will fetch all demands and filter or use a cursor. 
  // For efficiency in a real app, we might want a separate counter store.
  // Here, for simplicity and offline-first without backend, we'll query by date index range.
  
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  const range = IDBKeyRange.bound(startOfDay, endOfDay);
  // Get ALL demands for today, including those with active=false (soft deleted)
  const demandsToday = await db.getAllFromIndex("demands", "by-date", range);
  
  // Find the highest sequence number for today
  let maxSequence = 0;
  demandsToday.forEach((d) => {
    if (d.protocol && d.protocol.startsWith(datePrefix)) {
      const parts = d.protocol.split("-");
      if (parts.length === 2) {
        const seq = parseInt(parts[1], 10);
        if (!isNaN(seq) && seq > maxSequence) {
          maxSequence = seq;
        }
      }
    }
  });

  const sequence = String(maxSequence + 1).padStart(3, "0");
  const protocol = `${datePrefix}-${sequence}`;

  // Validate status
  const settings = await getSettings();
  let initialStatus = "em-analise";
  const statusExists = settings.status.some((s) => s.value === initialStatus);
  
  if (!statusExists) {
    // Ideally we should warn or ensure it exists. For now, we proceed with the default value.
    console.warn("Status 'em-analise' not found in settings. Using default.");
  }

  const newDemand = {
    ...demand,
    id,
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
    protocol,
    active: true,
    status: initialStatus,
    statusHistory: [{
      status: initialStatus,
      startDate: new Date(),
      responsibleId: demand.responsibleId
    }],
    totalDuration: 0,
    timeline: [{
      id: ulid(),
      type: 'created' as TimelineEventType,
      date: new Date(),
      title: 'Demanda criada',
      description: 'Demanda registrada no sistema',
      user: actorName
    }],
    synced: 0
  };
  await db.put("demands", newDemand);
  return newDemand;
};

export const updateDemand = async (
  id: string,
  data: Partial<DemandFormData & { statusHistory: StatusHistoryEntry[]; totalDuration?: number; timeline: TimelineEvent[]; synced?: number }>
): Promise<DemandFormData & { id: string; tenantId: string; createdAt: Date; updatedAt: Date; protocol: string; active: boolean; status: string; statusHistory: StatusHistoryEntry[]; totalDuration?: number; timeline: TimelineEvent[]; synced?: number } | null> => {
  const db = await getDB();
  const existingDemand = await db.get("demands", id);
  
  if (!existingDemand) {
    return null;
  }

  const updatedDemand = {
    ...existingDemand,
    ...data,
    updatedAt: new Date(),
    synced: data.synced !== undefined ? data.synced : 0 // If synced is passed, use it, otherwise default to 0 (dirty)
  };

  await db.put("demands", updatedDemand);
  return updatedDemand;
};

export const getAllDemands = async () => {
  // Try to fetch from API first (Online)
  try {
    const response = await fetch(`${API_URL}/demands`);
    if (response.ok) {
      const serverDemands = await response.json();
      const db = await getDB();
      const tx = db.transaction('demands', 'readwrite');
      const store = tx.objectStore('demands');

      const serverDemandIds = new Set<string>();

      for (const serverDemand of serverDemands) {
        serverDemandIds.add(serverDemand.id);
        // Revive dates and ensure correct types
        const revivedDemand = {
          ...serverDemand,
          active: serverDemand.active !== undefined ? serverDemand.active : true,
          createdAt: new Date(serverDemand.createdAt),
          updatedAt: new Date(serverDemand.updatedAt),
          deadline: serverDemand.deadline ? new Date(serverDemand.deadline) : undefined,
          statusHistory: serverDemand.statusHistory?.map((h: any) => ({
            ...h,
            startDate: new Date(h.startDate),
            endDate: h.endDate ? new Date(h.endDate) : undefined
          })),
          timeline: serverDemand.timeline?.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          })),
          synced: 1
        };

        const localDemand = await store.get(serverDemand.id);
        
        // Only update if local doesn't exist or is already synced (no local changes)
        if (!localDemand || localDemand.synced === 1) {
          await store.put(revivedDemand);
        }
      }

      // Handle hard deletions from server
      const allLocalDemands = await store.getAll();
      for (const localDemand of allLocalDemands) {
        if (localDemand.synced === 1 && !serverDemandIds.has(localDemand.id)) {
          await store.delete(localDemand.id);
        }
      }

      await tx.done;
    }
  } catch (error) {
    console.warn("Error fetching demands from API, falling back to local DB:", error);
  }

  const db = await getDB();
  const allDemands = await db.getAllFromIndex("demands", "by-date");
  return allDemands.filter(d => d.active !== false); // Return only active demands (or undefined which defaults to active for legacy)
};

export const getDemandById = async (id: string) => {
  try {
    const response = await fetch(`${API_URL}/demands/${id}`);
    if (response.ok) {
      const serverDemand = await response.json();
      const db = await getDB();
      const tx = db.transaction('demands', 'readwrite');
      const store = tx.objectStore('demands');
      
      const revivedDemand = {
          ...serverDemand,
          active: serverDemand.active !== undefined ? serverDemand.active : true,
          createdAt: new Date(serverDemand.createdAt),
          updatedAt: new Date(serverDemand.updatedAt),
          deadline: serverDemand.deadline ? new Date(serverDemand.deadline) : undefined,
          statusHistory: serverDemand.statusHistory?.map((h: any) => ({
            ...h,
            startDate: new Date(h.startDate),
            endDate: h.endDate ? new Date(h.endDate) : undefined
          })),
          timeline: serverDemand.timeline?.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          })),
          synced: 1
      };

      const localDemand = await store.get(id);
      if (!localDemand || localDemand.synced === 1) {
         await store.put(revivedDemand);
      }
      await tx.done;
    }
  } catch (error) {
    console.warn(`Error fetching demand ${id} from API, falling back to local DB:`, error);
  }

  const db = await getDB();
  return db.get("demands", id);
};

export const deleteDemand = async (id: string) => {
  const db = await getDB();
  const existingDemand = await db.get("demands", id);
  if (existingDemand) {
    const deletedDemand = { ...existingDemand, active: false, updatedAt: new Date(), synced: 0 };
    await db.put("demands", deletedDemand);
  }
};

export const deleteAllDemands = async () => {
  const db = await getDB();
  await db.clear("demands");
};

// Settings operations
const SETTINGS_ID = "global_settings";

const optionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  badge: z
    .object({
      text: z.string().optional(),
      color: z.enum(["primary", "success", "error", "warning", "info", "light", "dark"]).optional(),
    })
    .optional(),
});

const tratativaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(["text", "number", "long_text"]),
  slug: z.string().min(1),
});

const settingsPayloadSchema = z.object({
  categories: z.array(optionSchema),
  urgencies: z.array(optionSchema),
  status: z.array(optionSchema),
  tratativas: z.array(tratativaSchema),
  roles: z.array(optionSchema),
  politicalSpectrums: z.array(optionSchema),
});

export const assertValidSettingsPayload = (payload: {
  categories: Option[];
  urgencies: Option[];
  status: Option[];
  tratativas: Tratativa[];
  roles: Option[];
  politicalSpectrums: Option[];
}) => {
  const parsed = settingsPayloadSchema.safeParse(payload);
  if (parsed.success) return;
  const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" | ");
  throw new Error(`Configurações inválidas: ${issues}`);
};

export const saveSettings = async (categories: Option[], urgencies: Option[], status: Option[], tratativas: Tratativa[] = [], roles: Option[] = [], politicalSpectrums: Option[] = [], tenantId: string = 'default-tenant') => {
  const db = await getDB();
  assertValidSettingsPayload({
    categories,
    urgencies,
    status,
    tratativas,
    roles,
    politicalSpectrums,
  });
  await db.put("settings", { id: SETTINGS_ID, tenantId, categories, urgencies, status, tratativas, roles, politicalSpectrums, updatedAt: new Date(), synced: 0 });
  const saved = await db.get("settings", SETTINGS_ID);
  if (!saved) throw new Error("Falha ao persistir configurações no IndexedDB.");
  if (!Array.isArray(saved.roles) || !Array.isArray(saved.tratativas)) {
    throw new Error("Configurações persistidas em formato inválido no IndexedDB.");
  }
};

export const getSettings = async () => {
  // Try to fetch from API first (Online)
  try {
    const response = await fetch(`${API_URL}/settings`);
    if (response.ok) {
      const serverSettingsArray = await response.json();
      // Server returns an array, but we only care about the global settings object if it exists
      const serverSettings = serverSettingsArray.find((s: any) => s.id === SETTINGS_ID);

      if (serverSettings) {
        const db = await getDB();
        const tx = db.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');

        const revivedSettings = {
             ...serverSettings,
             updatedAt: serverSettings.updatedAt ? new Date(serverSettings.updatedAt) : undefined,
             synced: 1
        };

        const localSettings = await store.get(SETTINGS_ID);
        
        // Only update if local doesn't exist or is already synced (no local changes)
        if (!localSettings || localSettings.synced === 1) {
             const payloadToValidate = {
               categories: revivedSettings.categories ?? [],
               urgencies: revivedSettings.urgencies ?? [],
               status: revivedSettings.status ?? [],
               tratativas: revivedSettings.tratativas ?? [],
               roles: revivedSettings.roles ?? [],
               politicalSpectrums: revivedSettings.politicalSpectrums ?? [],
             };
             const validation = settingsPayloadSchema.safeParse(payloadToValidate);
             if (validation.success) {
              const localUpdatedAt = localSettings?.updatedAt ? new Date(localSettings.updatedAt).getTime() : undefined;
              const remoteUpdatedAt = revivedSettings.updatedAt ? new Date(revivedSettings.updatedAt).getTime() : undefined;
              const shouldApplyRemote = !localSettings || (remoteUpdatedAt !== undefined && (localUpdatedAt === undefined || remoteUpdatedAt >= localUpdatedAt));
              if (shouldApplyRemote) {
                const next = localSettings
                  ? mergePreferRemoteDefined(localSettings, revivedSettings)
                  : revivedSettings;
                await store.put(next);
              } else {
                console.warn("Settings from API ignored due to missing/older updatedAt; keeping local.", {
                  localUpdatedAt,
                  remoteUpdatedAt,
                });
              }
             } else {
               console.warn("Settings from API failed validation; keeping local settings.", {
                 issues: validation.error.issues.map((i) => ({ path: i.path, message: i.message })),
               });
             }
        }
        await tx.done;
      }
    }
  } catch (error) {
    console.warn("Error fetching settings from API, falling back to local DB:", error);
  }

  const db = await getDB();
  const settings = await db.get("settings", SETTINGS_ID);
  return settings || { id: SETTINGS_ID, tenantId: 'default-tenant', categories: [], urgencies: [], status: [], tratativas: [], roles: [], politicalSpectrums: [], updatedAt: new Date(), synced: 1 };
};

// Contact operations
export const saveContact = async (contact: Omit<Contact, "id" | "createdAt" | "updatedAt" | "active" | "synced" | "tenantId">, tenantId: string = 'default-tenant'): Promise<Contact> => {
  const db = await getDB();
  const id = ulid();
  const newContact: Contact = {
    ...contact,
    id,
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
    active: true,
    synced: 0
  };
  await db.add("contacts", newContact);
  return newContact;
};

export const updateContact = async (id: string, contact: Partial<Contact>): Promise<Contact> => {
  const db = await getDB();
  const existing = await db.get("contacts", id);
  if (!existing) throw new Error("Contact not found");

  const updatedContact: Contact = {
    ...existing,
    ...contact,
    updatedAt: new Date(),
    synced: contact.synced !== undefined ? contact.synced : 0
  };
  await db.put("contacts", updatedContact);
  return updatedContact;
};

export const deleteContact = async (id: string): Promise<void> => {
  const db = await getDB();
  const existing = await db.get("contacts", id);
  if (existing) {
    // Soft delete
    await db.put("contacts", { ...existing, active: false, updatedAt: new Date(), synced: 0 });
  }
};

export const getAllContacts = async (): Promise<Contact[]> => {
  // Try to fetch from API first (Online)
  try {
    const response = await fetch(`${API_URL}/contacts`);
    if (response.ok) {
      const serverContacts = await response.json();
      const db = await getDB();
      const tx = db.transaction('contacts', 'readwrite');
      const store = tx.objectStore('contacts');

      const serverContactIds = new Set<string>();

      for (const serverContact of serverContacts) {
        serverContactIds.add(serverContact.id);
        const revivedContact = {
          ...serverContact,
          active: serverContact.active !== undefined ? serverContact.active : true,
          createdAt: new Date(serverContact.createdAt),
          updatedAt: new Date(serverContact.updatedAt),
          synced: 1
        };

        const localContact = await store.get(serverContact.id);
        
        // Only update if local doesn't exist or is already synced (no local changes)
        if (!localContact) {
          await store.put(revivedContact);
        } else if (localContact.synced === 1) {
          const mergedContact: Record<string, unknown> = {
            ...(localContact as unknown as Record<string, unknown>),
          };
          for (const [key, value] of Object.entries(revivedContact as Record<string, unknown>)) {
            if (value !== undefined) mergedContact[key] = value;
          }
          await store.put(mergedContact as unknown as Contact);
        }
      }

      // Handle hard deletions from server
      const allLocalContacts = await store.getAll();
      for (const localContact of allLocalContacts) {
        if (localContact.synced === 1 && !serverContactIds.has(localContact.id)) {
          await store.delete(localContact.id);
        }
      }

      await tx.done;
    }
  } catch (error) {
    console.warn("Error fetching contacts from API, falling back to local DB:", error);
  }

  const db = await getDB();
  const all = await db.getAll("contacts");
  return all.filter(c => c.active !== false).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getContactById = async (id: string): Promise<Contact | undefined> => {
  // Try to fetch from API first (Online)
  try {
    const response = await fetch(`${API_URL}/contacts/${id}`);
    if (response.ok) {
      const serverContact = await response.json();
      const db = await getDB();
      const tx = db.transaction('contacts', 'readwrite');
      const store = tx.objectStore('contacts');

      const revivedContact = {
          ...serverContact,
          active: serverContact.active !== undefined ? serverContact.active : true,
          createdAt: new Date(serverContact.createdAt),
          updatedAt: new Date(serverContact.updatedAt),
          synced: 1
      };

      const localContact = await store.get(id);
      if (!localContact) {
        await store.put(revivedContact);
      } else if (localContact.synced === 1) {
        const mergedContact: Record<string, unknown> = {
          ...(localContact as unknown as Record<string, unknown>),
        };
        for (const [key, value] of Object.entries(revivedContact as Record<string, unknown>)) {
          if (value !== undefined) mergedContact[key] = value;
        }
        await store.put(mergedContact as unknown as Contact);
      }
      await tx.done;
    }
  } catch (error) {
    console.warn(`Error fetching contact ${id} from API, falling back to local DB:`, error);
  }

  const db = await getDB();
  return db.get("contacts", id);
};
