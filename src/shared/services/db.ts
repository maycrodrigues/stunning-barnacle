import { openDB, DBSchema, IDBPDatabase } from "idb";
import { ulid } from "ulid";
import { DemandFormData } from "../../features/demands/types";

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
}

export type TimelineEventType = 'created' | 'updated' | 'status_change' | 'comment' | 'attachment';

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
      createdAt: Date; 
      protocol: string; 
      active: boolean; 
      status: string;
      statusHistory: StatusHistoryEntry[];
      totalDuration?: number;
      timeline: TimelineEvent[];
      tratativas?: DemandTratativa[];
    };
    indexes: { "by-date": Date; "by-protocol": string };
  };
  settings: {
    key: string;
    value: { id: string; categories: Option[]; urgencies: Option[]; status: Option[]; tratativas?: Tratativa[]; roles?: Option[] };
  };
  members: {
    key: string;
    value: Member;
  };
  contacts: {
    key: string;
    value: Contact;
  };
}

const DB_NAME = "gabinete-online-db";
const DB_VERSION = 6; // Incremented version for schema update

let dbPromise: Promise<IDBPDatabase<GabineteDB>> | null = null;

export interface Member {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<GabineteDB>(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
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

        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id" });
        }
        
        if (!db.objectStoreNames.contains("members")) {
          db.createObjectStore("members", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("contacts")) {
          db.createObjectStore("contacts", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
};

// Demand operations
export const saveDemand = async (
  demand: DemandFormData
): Promise<DemandFormData & { id: string; createdAt: Date; protocol: string; active: boolean; status: string; statusHistory: StatusHistoryEntry[]; totalDuration?: number; timeline: TimelineEvent[] }> => {
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
    createdAt: new Date(),
    protocol,
    active: true,
    status: initialStatus,
    statusHistory: [{
      status: initialStatus,
      startDate: new Date(),
    }],
    totalDuration: 0,
    timeline: [{
      id: ulid(),
      type: 'created' as TimelineEventType,
      date: new Date(),
      title: 'Demanda criada',
      description: 'Demanda registrada no sistema',
      user: 'Sistema'
    }]
  };
  await db.put("demands", newDemand);
  return newDemand;
};

export const updateDemand = async (
  id: string,
  data: Partial<DemandFormData & { statusHistory: StatusHistoryEntry[]; totalDuration?: number; timeline: TimelineEvent[] }>
): Promise<DemandFormData & { id: string; createdAt: Date; protocol: string; active: boolean; status: string; statusHistory: StatusHistoryEntry[]; totalDuration?: number; timeline: TimelineEvent[] } | null> => {
  const db = await getDB();
  const existingDemand = await db.get("demands", id);
  
  if (!existingDemand) {
    return null;
  }

  const updatedDemand = {
    ...existingDemand,
    ...data,
  };

  await db.put("demands", updatedDemand);
  return updatedDemand;
};

export const getAllDemands = async () => {
  const db = await getDB();
  const allDemands = await db.getAllFromIndex("demands", "by-date");
  return allDemands.filter(d => d.active !== false); // Return only active demands (or undefined which defaults to active for legacy)
};

export const getDemandById = async (id: string) => {
  const db = await getDB();
  return db.get("demands", id);
};

export const deleteDemand = async (id: string) => {
  const db = await getDB();
  const existingDemand = await db.get("demands", id);
  if (existingDemand) {
    const deletedDemand = { ...existingDemand, active: false };
    await db.put("demands", deletedDemand);
  }
};

// Settings operations
const SETTINGS_ID = "global_settings";

export const saveSettings = async (categories: Option[], urgencies: Option[], status: Option[], tratativas: Tratativa[] = [], roles: Option[] = []) => {
  const db = await getDB();
  await db.put("settings", { id: SETTINGS_ID, categories, urgencies, status, tratativas, roles });
};

export const getSettings = async () => {
  const db = await getDB();
  const settings = await db.get("settings", SETTINGS_ID);
  return settings || { id: SETTINGS_ID, categories: [], urgencies: [], status: [], tratativas: [], roles: [] };
};

// Contact operations
export const saveContact = async (contact: Omit<Contact, "id" | "createdAt" | "updatedAt" | "active">): Promise<Contact> => {
  const db = await getDB();
  const id = ulid();
  const newContact: Contact = {
    ...contact,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
    active: true,
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
  };
  await db.put("contacts", updatedContact);
  return updatedContact;
};

export const deleteContact = async (id: string): Promise<void> => {
  const db = await getDB();
  const existing = await db.get("contacts", id);
  if (existing) {
    // Soft delete
    await db.put("contacts", { ...existing, active: false, updatedAt: new Date() });
  }
};

export const getAllContacts = async (): Promise<Contact[]> => {
  const db = await getDB();
  const all = await db.getAll("contacts");
  return all.filter(c => c.active !== false).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getContactById = async (id: string): Promise<Contact | undefined> => {
  const db = await getDB();
  return db.get("contacts", id);
};
