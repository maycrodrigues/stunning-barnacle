
import { getDB, Member } from "./db";
import { ulid } from "ulid";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const getAllMembers = async (): Promise<Member[]> => {
  // Try to fetch from API first (Online)
  try {
    const response = await fetch(`${API_URL}/members`);
    if (response.ok) {
      const serverMembers = await response.json();
      const db = await getDB();
      const tx = db.transaction('members', 'readwrite');
      const store = tx.objectStore('members');

      const serverMemberIds = new Set<string>();

      for (const serverMember of serverMembers) {
        serverMemberIds.add(serverMember.id);
        const revivedMember = {
          ...serverMember,
          active: serverMember.active !== undefined ? serverMember.active : true,
          createdAt: new Date(serverMember.createdAt),
          updatedAt: new Date(serverMember.updatedAt),
          synced: 1
        };

        const localMember = await store.get(serverMember.id);
        
        // Only update if local doesn't exist or is already synced (no local changes)
        if (!localMember || localMember.synced === 1) {
          await store.put(revivedMember);
        }
      }

      // Handle hard deletions from server:
      // If a member exists locally, is synced, but is NOT in the server response, delete it locally.
      const allLocalMembers = await store.getAll();
      for (const localMember of allLocalMembers) {
        if (localMember.synced === 1 && !serverMemberIds.has(localMember.id)) {
           await store.delete(localMember.id);
        }
      }
      
      await tx.done;
    }
  } catch (error) {
    console.warn("Error fetching members from API, falling back to local DB:", error);
  }

  const db = await getDB();
  const members = await db.getAll("members");
  return members.filter(m => m.active !== false).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const saveMember = async (memberData: Omit<Member, "id" | "createdAt" | "updatedAt" | "tenantId">, tenantId: string = 'default-tenant'): Promise<Member> => {
  const db = await getDB();
  const newMember: Member = {
    ...memberData,
    id: ulid(),
    tenantId,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    synced: 0 // Mark as unsynced
  };
  await db.put("members", newMember);
  return newMember;
};

export const updateMember = async (id: string, updates: Partial<Member>): Promise<void> => {
  const db = await getDB();
  const member = await db.get("members", id);
  if (!member) throw new Error("Member not found");
  
  const updatedMember = { ...member, ...updates, updatedAt: new Date(), synced: 0 }; // Mark as unsynced
  await db.put("members", updatedMember);
};

export const deleteMember = async (id: string): Promise<void> => {
  const db = await getDB();
  const existing = await db.get("members", id);
  if (existing) {
    // Soft delete
    await db.put("members", { ...existing, active: false, updatedAt: new Date(), synced: 0 });
  }
};
