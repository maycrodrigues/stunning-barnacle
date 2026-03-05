import { create } from "zustand";
import { Member } from "../../../shared/services/db";
import { syncService } from "../../../shared/services/sync";
import { getAllMembers, saveMember, updateMember as updateMemberService, deleteMember as deleteMemberService } from "../../../shared/services/memberService";

interface MemberStore {
  members: Member[];
  isLoading: boolean;
  error: string | null;
  loadMembers: () => Promise<void>;
  addMember: (memberData: Omit<Member, "id" | "createdAt" | "updatedAt" | "tenantId">) => Promise<Member>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
}

export const useMemberStore = create<MemberStore>((set) => ({
  members: [],
  isLoading: false,
  error: null,

  loadMembers: async () => {
    set({ isLoading: true, error: null });
    try {
      const members = await getAllMembers();
      // Sort by name
      const sortedMembers = members.sort((a, b) => a.name.localeCompare(b.name));
      set({ members: sortedMembers, isLoading: false });
    } catch (error: any) {
      console.error("Failed to load members:", error);
      set({ error: error.message || "Erro ao carregar membros", isLoading: false });
    }
  },

  addMember: async (memberData) => {
    set({ isLoading: true, error: null });
    try {
      const newMember = await saveMember(memberData);
      set((state) => ({
        members: [...state.members, newMember].sort((a, b) => a.name.localeCompare(b.name)),
        isLoading: false,
      }));
      syncService.syncMembers().catch(console.error);
      return newMember;
    } catch (error: any) {
      console.error("Failed to add member:", error);
      set({ error: error.message || "Erro ao adicionar membro", isLoading: false });
      throw error;
    }
  },

  updateMember: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await updateMemberService(id, updates);
      set((state) => ({
        members: state.members.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m)),
        isLoading: false,
      }));
      syncService.syncMembers().catch(console.error);
    } catch (error: any) {
      console.error("Failed to update member:", error);
      set({ error: error.message || "Erro ao atualizar membro", isLoading: false });
      throw error;
    }
  },

  removeMember: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteMemberService(id);
      set((state) => ({
        members: state.members.filter((m) => m.id !== id),
        isLoading: false,
      }));
      syncService.syncMembers().catch(console.error);
    } catch (error: any) {
      console.error("Failed to remove member:", error);
      set({ error: error.message || "Erro ao remover membro", isLoading: false });
      throw error;
    }
  },
}));
