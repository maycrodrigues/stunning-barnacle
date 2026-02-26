import { create } from "zustand";
import { Contact, saveContact, updateContact, deleteContact, getAllContacts } from "../../../shared/services/db";
import { ContactFormData } from "../types";

interface ContactsStore {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
  
  loadContacts: () => Promise<void>;
  addContact: (data: ContactFormData) => Promise<void>;
  updateContact: (id: string, data: Partial<ContactFormData>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
}

export const useContactsStore = create<ContactsStore>((set, get) => ({
  contacts: [],
  isLoading: false,
  error: null,

  loadContacts: async () => {
    set({ isLoading: true, error: null });
    try {
      const contacts = await getAllContacts();
      set({ contacts, isLoading: false });
    } catch (error) {
      console.error("Failed to load contacts:", error);
      set({ error: "Falha ao carregar contatos", isLoading: false });
    }
  },

  addContact: async (data: ContactFormData) => {
    set({ isLoading: true, error: null });
    try {
      const newContact = await saveContact(data);
      set((state) => ({ 
        contacts: [newContact, ...state.contacts],
        isLoading: false 
      }));
    } catch (error) {
      console.error("Failed to add contact:", error);
      set({ error: "Falha ao adicionar contato", isLoading: false });
      throw error;
    }
  },

  updateContact: async (id: string, data: Partial<ContactFormData>) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await updateContact(id, data);
      set((state) => ({
        contacts: state.contacts.map((c) => (c.id === id ? updated : c)),
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to update contact:", error);
      set({ error: "Falha ao atualizar contato", isLoading: false });
      throw error;
    }
  },

  deleteContact: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteContact(id);
      set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to delete contact:", error);
      set({ error: "Falha ao excluir contato", isLoading: false });
      throw error;
    }
  },
}));
