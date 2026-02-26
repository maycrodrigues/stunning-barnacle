
import { getDB, Member } from "./db";
import { ulid } from "ulid";

export const getAllMembers = async (): Promise<Member[]> => {
  const db = await getDB();
  return db.getAll("members");
};

export const saveMember = async (memberData: Omit<Member, "id" | "createdAt" | "updatedAt">): Promise<Member> => {
  const db = await getDB();
  const newMember: Member = {
    ...memberData,
    id: ulid(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.put("members", newMember);
  return newMember;
};

export const updateMember = async (id: string, updates: Partial<Member>): Promise<void> => {
  const db = await getDB();
  const member = await db.get("members", id);
  if (!member) throw new Error("Member not found");
  
  const updatedMember = { ...member, ...updates, updatedAt: new Date() };
  await db.put("members", updatedMember);
};

export const deleteMember = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete("members", id);
};
