import { create } from "zustand";
import { ulid } from "ulid";
import { DemandFormData } from "../../features/demands/types";
import { saveDemand, getAllDemands, saveSettings, getSettings, updateDemand, deleteDemand, StatusHistoryEntry, TimelineEvent, Tratativa, DemandTratativa } from "../services/db";
import { generateSlug } from "../utils/stringUtils";

export interface Option {
  value: string;
  label: string;
  badge?: {
    text?: string;
    color?: "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";
  };
}

export interface Demand extends DemandFormData {
  id: string;
  createdAt: Date;
  protocol: string;
  status: string;
  statusHistory?: StatusHistoryEntry[];
  totalDuration?: number;
  timeline?: TimelineEvent[];
  tratativas?: DemandTratativa[];
}

export interface Location {
  lat: number;
  lng: number;
  zoom: number;
}

interface AppStore {
  // Configurações
  categoryOptions: Option[];
  urgencyOptions: Option[];
  statusOptions: Option[];
  tratativaOptions: Tratativa[];
  roleOptions: Option[];
  defaultLocation: Location;
  addCategory: (option: Option) => void;
  removeCategory: (value: string) => void;
  updateCategory: (value: string, newLabel: string, newSlug: string) => void;
  reorderCategories: (newOrder: Option[]) => void;
  addUrgency: (option: Option) => void;
  removeUrgency: (value: string) => void;
  updateUrgency: (value: string, newLabel: string, newSlug: string) => void;
  reorderUrgencies: (newOrder: Option[]) => void;
  addStatus: (option: Option) => void;
  removeStatus: (value: string) => void;
  updateStatus: (value: string, newLabel: string, newSlug: string, newBadge?: Option['badge']) => void;
  reorderStatus: (newOrder: Option[]) => void;
  addTratativa: (tratativa: Tratativa) => void;
  removeTratativa: (id: string) => void;
  updateTratativa: (id: string, title: string, type: Tratativa['type'], slug: string) => void;
  reorderTratativas: (newOrder: Tratativa[]) => void;
  addRole: (option: Option) => void;
  removeRole: (value: string) => void;
  updateRole: (value: string, newLabel: string, newSlug: string) => void;
  reorderRoles: (newOrder: Option[]) => void;
  updateDefaultLocation: (location: Location) => void;
  loadSettings: () => Promise<void>;

  // Demandas
  demands: Demand[];
  addDemand: (demand: DemandFormData) => Promise<void>;
  updateDemand: (id: string, demand: Partial<Demand>, justification?: string, attachment?: { type: 'image' | 'pdf', url: string, name: string }) => Promise<void>;
  removeDemand: (id: string) => Promise<void>;
  loadDemands: () => Promise<void>;
  isLoadingDemands: boolean;
}

// Helper to get initial location from localStorage
const getInitialLocation = (): Location => {
  const saved = localStorage.getItem("defaultLocation");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure zoom exists for backward compatibility
      if (typeof parsed.zoom !== 'number') {
        return { ...parsed, zoom: 13 };
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse default location", e);
    }
  }
  return { lat: -19.83996, lng: -40.21045, zoom: 13 }; // Default Aracruz/ES
};

export const useAppStore = create<AppStore>((set, get) => ({
  // Configurações (Estado Inicial)
  categoryOptions: [],
  urgencyOptions: [],
  statusOptions: [],
  tratativaOptions: [],
  roleOptions: [],
  defaultLocation: getInitialLocation(),

  // Ações de Configuração
  addCategory: (option) => {
    set((state) => {
      // Validate unique slug
      if (state.categoryOptions.some(opt => opt.value === option.value)) {
          throw new Error("Já existe uma categoria com este slug.");
      }
      const newCategories = [...state.categoryOptions, option];
      saveSettings(newCategories, state.urgencyOptions, state.statusOptions, state.tratativaOptions, state.roleOptions);
      return { categoryOptions: newCategories };
    });
  },
  removeCategory: (value) => {
    set((state) => {
      const newCategories = state.categoryOptions.filter((opt) => opt.value !== value);
      saveSettings(newCategories, state.urgencyOptions, state.statusOptions, state.tratativaOptions, state.roleOptions);
      return { categoryOptions: newCategories };
    });
  },
  updateCategory: (value, newLabel, newSlug) => {
    set((state) => {
        // Validate unique slug if changed
        if (value !== newSlug && state.categoryOptions.some(opt => opt.value === newSlug)) {
             throw new Error("Já existe uma categoria com este slug.");
        }
      const newCategories = state.categoryOptions.map((opt) =>
        opt.value === value ? { ...opt, label: newLabel, value: newSlug } : opt
      );
      saveSettings(newCategories, state.urgencyOptions, state.statusOptions, state.tratativaOptions, state.roleOptions);
      return { categoryOptions: newCategories };
    });
  },
  reorderCategories: (newOrder) => {
    set((state) => {
      saveSettings(newOrder, state.urgencyOptions, state.statusOptions, state.tratativaOptions, state.roleOptions);
      return { categoryOptions: newOrder };
    });
  },

  addUrgency: (option) => {
    set((state) => {
       // Validate unique slug
      if (state.urgencyOptions.some(opt => opt.value === option.value)) {
          throw new Error("Já existe uma urgência com este slug.");
      }
      const newUrgencies = [...state.urgencyOptions, option];
      saveSettings(state.categoryOptions, newUrgencies, state.statusOptions, state.tratativaOptions, state.roleOptions);
      return { urgencyOptions: newUrgencies };
    });
  },
  removeUrgency: (value) => {
    set((state) => {
      const newUrgencies = state.urgencyOptions.filter((opt) => opt.value !== value);
      saveSettings(state.categoryOptions, newUrgencies, state.statusOptions, state.tratativaOptions, state.roleOptions);
      return { urgencyOptions: newUrgencies };
    });
  },
  updateUrgency: (value, newLabel, newSlug) => {
    set((state) => {
       // Validate unique slug if changed
       if (value !== newSlug && state.urgencyOptions.some(opt => opt.value === newSlug)) {
            throw new Error("Já existe uma urgência com este slug.");
       }
      const newUrgencies = state.urgencyOptions.map((opt) =>
        opt.value === value ? { ...opt, label: newLabel, value: newSlug } : opt
      );
      saveSettings(state.categoryOptions, newUrgencies, state.statusOptions, state.tratativaOptions, state.roleOptions);
      return { urgencyOptions: newUrgencies };
    });
  },
  reorderUrgencies: (newOrder) => {
    set((state) => {
      saveSettings(state.categoryOptions, newOrder, state.statusOptions, state.tratativaOptions, state.roleOptions);
      return { urgencyOptions: newOrder };
    });
  },

  addStatus: (option) => {
    set((state) => {
       // Validate unique slug
      if (state.statusOptions.some(opt => opt.value === option.value)) {
          throw new Error("Já existe um status com este slug.");
      }
      const newStatus = [...state.statusOptions, option];
      saveSettings(state.categoryOptions, state.urgencyOptions, newStatus, state.tratativaOptions, state.roleOptions);
      return { statusOptions: newStatus };
    });
  },
  removeStatus: (value) => {
    set((state) => {
      // Validate default status
      if (value === "em-analise" || value === "concluido") {
        throw new Error("Este status padrão não pode ser removido.");
      }
      const newStatus = state.statusOptions.filter((opt) => opt.value !== value);
      saveSettings(state.categoryOptions, state.urgencyOptions, newStatus, state.tratativaOptions, state.roleOptions);
      return { statusOptions: newStatus };
    });
  },
  updateStatus: (value, newLabel, newSlug, newBadge) => {
    set((state) => {
      // Validate default status
      if (value === "em-analise" || value === "concluido") {
        if (value !== newSlug) {
             throw new Error("O slug deste status padrão não pode ser alterado.");
        }
      } else {
          // Validate unique slug if changed for non-default status
          if (value !== newSlug && state.statusOptions.some(opt => opt.value === newSlug)) {
            throw new Error("Já existe um status com este slug.");
          }
      }
      
      const newStatus = state.statusOptions.map((opt) =>
        opt.value === value ? { ...opt, label: newLabel, value: newSlug, badge: newBadge } : opt
      );
      saveSettings(state.categoryOptions, state.urgencyOptions, newStatus, state.tratativaOptions, state.roleOptions);
      return { statusOptions: newStatus };
    });
  },
  reorderStatus: (newOrder) => {
    set((state) => {
      saveSettings(state.categoryOptions, state.urgencyOptions, newOrder, state.tratativaOptions, state.roleOptions);
      return { statusOptions: newOrder };
    });
  },

  addTratativa: (tratativa) => {
    set((state) => {
      // Validate unique slug
      if (state.tratativaOptions.some(opt => opt.slug === tratativa.slug)) {
          throw new Error("Já existe uma tratativa com este slug.");
      }
      const newTratativas = [...state.tratativaOptions, tratativa];
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, newTratativas, state.roleOptions);
      return { tratativaOptions: newTratativas };
    });
  },
  removeTratativa: (id) => {
    set((state) => {
      const newTratativas = state.tratativaOptions.filter((opt) => opt.id !== id);
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, newTratativas, state.roleOptions);
      return { tratativaOptions: newTratativas };
    });
  },
  updateTratativa: (id, title, type, slug) => {
    set((state) => {
        // Validate unique slug if changed
        if (state.tratativaOptions.some(opt => opt.slug === slug && opt.id !== id)) {
            throw new Error("Já existe uma tratativa com este slug.");
        }
      const newTratativas = state.tratativaOptions.map((opt) =>
        opt.id === id ? { ...opt, title, type, slug } : opt
      );
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, newTratativas, state.roleOptions);
      return { tratativaOptions: newTratativas };
    });
  },
  reorderTratativas: (newOrder) => {
    set((state) => {
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, newOrder, state.roleOptions);
      return { tratativaOptions: newOrder };
    });
  },

  addRole: (option) => {
    set((state) => {
      if (state.roleOptions.some(opt => opt.value === option.value)) {
        throw new Error("Já existe um cargo com este slug.");
      }
      const newRoles = [...state.roleOptions, option];
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, state.tratativaOptions, newRoles);
      return { roleOptions: newRoles };
    });
  },
  removeRole: (value) => {
    set((state) => {
      const newRoles = state.roleOptions.filter((opt) => opt.value !== value);
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, state.tratativaOptions, newRoles);
      return { roleOptions: newRoles };
    });
  },
  updateRole: (value, newLabel, newSlug) => {
    set((state) => {
      if (value !== newSlug && state.roleOptions.some(opt => opt.value === newSlug)) {
          throw new Error("Já existe um cargo com este slug.");
      }
      const newRoles = state.roleOptions.map((opt) =>
        opt.value === value ? { ...opt, label: newLabel, value: newSlug } : opt
      );
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, state.tratativaOptions, newRoles);
      return { roleOptions: newRoles };
    });
  },
  reorderRoles: (newOrder) => {
    set((state) => {
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, state.tratativaOptions, newOrder);
      return { roleOptions: newOrder };
    });
  },

  updateDefaultLocation: (location) => {
    localStorage.setItem("defaultLocation", JSON.stringify(location));
    set(() => ({ defaultLocation: location }));
  },

  loadSettings: async () => {
    try {
      const settings = await getSettings();
      let statusOptions = settings.status || [];
      let categories = settings.categories || [];
      let urgencies = settings.urgencies || [];
      let tratativas = settings.tratativas || [];
      let roles = settings.roles || [];
      let hasChanges = false;

      // Migration: Add slug to existing tratativas if missing
      tratativas = tratativas.map(t => {
          if (!t.slug) {
              hasChanges = true;
              return { ...t, slug: generateSlug(t.title) };
          }
          return t;
      });

      // Ensure mandatory statuses exist
      const mandatoryStatuses: Option[] = [
        { value: "em-analise", label: "Em Análise" },
        { value: "em-processo", label: "Em Processo", badge: { text: "No Prazo", color: "info" } },
        { value: "em-processo-fora-do-prazo", label: "Em Processo", badge: { text: "Fora do Prazo", color: "error" } },
        { value: "concluido", label: "Concluído" },
      ];

      mandatoryStatuses.forEach(mandatory => {
        if (!statusOptions.some(s => s.value === mandatory.value)) {
          statusOptions.push(mandatory);
          hasChanges = true;
        }
      });

      // Default initial values if DB is empty for other settings
      if (categories.length === 0) {
        categories = [
            { value: "saude", label: "Saúde" },
            { value: "educacao", label: "Educação" },
            { value: "infraestrutura", label: "Infraestrutura" },
            { value: "seguranca", label: "Segurança" },
            { value: "esporte", label: "Esporte e Lazer" },
            { value: "assistencia", label: "Assistência Social" },
            { value: "cultura", label: "Cultura" },
            { value: "meio_ambiente", label: "Meio Ambiente" },
            { value: "transporte", label: "Transporte" },
            { value: "iluminacao", label: "Iluminação Pública" },
        ];
        hasChanges = true;
      }

      if (urgencies.length === 0) {
        urgencies = [
            { value: "baixa", label: "Baixa" },
            { value: "media", label: "Média" },
            { value: "alta", label: "Alta" },
            { value: "urgente", label: "Urgente" },
        ];
        hasChanges = true;
      }

      if (hasChanges) {
        await saveSettings(categories, urgencies, statusOptions, tratativas, roles);
      }

      set({
        categoryOptions: categories,
        urgencyOptions: urgencies,
        statusOptions: statusOptions,
        tratativaOptions: tratativas,
        roleOptions: roles,
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  },

  // Demandas (Estado Inicial)
  demands: [],
  isLoadingDemands: false,

  // Ações de Demandas
  addDemand: async (demandData) => {
    try {
      const newDemand = await saveDemand(demandData);
      set((state) => ({
        demands: [newDemand, ...state.demands],
      }));
    } catch (error) {
      console.error("Failed to save demand:", error);
      throw error;
    }
  },
  updateDemand: async (id, demandData, justification, attachment) => {
    try {
      const currentDemands = get().demands;
      const currentDemand = currentDemands.find(d => d.id === id);
      
      if (!currentDemand) {
        console.error("Demand not found for update:", id);
        return;
      }
      
      let dataToUpdate: Partial<Demand> = { ...demandData };
      let newStatus = demandData.status;

      // Check if deadline was updated and update status accordingly
      if (demandData.deadline !== undefined) {
          const now = new Date();
          const deadline = demandData.deadline ? new Date(demandData.deadline) : undefined;
          
          if (deadline && currentDemand.status === 'em-processo' && now > deadline) {
             newStatus = 'em-processo-fora-do-prazo';
          } else if (deadline && currentDemand.status === 'em-processo-fora-do-prazo' && now <= deadline) {
             newStatus = 'em-processo';
          }
      }

      // Handle status history tracking
      if (newStatus && newStatus !== currentDemand.status) {
        const now = new Date();
        let history = currentDemand.statusHistory ? [...currentDemand.statusHistory] : [];
        let totalDuration = currentDemand.totalDuration || 0;

        // Close previous status entry
        if (history.length > 0) {
          const lastEntry = history[history.length - 1];
          if (!lastEntry.endDate) {
            lastEntry.endDate = now;
            lastEntry.duration = now.getTime() - new Date(lastEntry.startDate).getTime();
            totalDuration += lastEntry.duration;
          }
        }

        // Add new status entry
        history.push({
          status: newStatus!,
          startDate: now,
        });
        
        dataToUpdate.status = newStatus;
        dataToUpdate.statusHistory = history;
        dataToUpdate.totalDuration = totalDuration;

        // Add timeline event for status change
        const timeline = currentDemand.timeline ? [...currentDemand.timeline] : [];
        timeline.unshift({
            id: ulid(),
            type: 'status_change',
            date: now,
            title: 'Status atualizado',
            description: justification ? justification : `Status alterado de "${currentDemand.status}" para "${newStatus}"`,
            metadata: {
                from: currentDemand.status,
                to: newStatus,
                justification: justification
            },
            user: 'Sistema' // TODO: Get current user
        });

        if (attachment) {
            timeline.unshift({
                id: ulid(),
                type: 'attachment',
                date: now,
                title: 'Anexo adicionado',
                description: `Anexo "${attachment.name}" adicionado`,
                metadata: {
                    attachmentUrl: attachment.url,
                    attachmentType: attachment.type
                },
                user: 'Sistema'
            });
        }

        dataToUpdate.timeline = timeline;
      } else {
         // Just updating fields without status change
         if (Object.keys(dataToUpdate).length > 0) {
            const timeline = currentDemand.timeline ? [...currentDemand.timeline] : [];
            
            // Check specific fields for timeline events
            if (justification) {
                 timeline.unshift({
                    id: ulid(),
                    type: 'updated',
                    date: new Date(),
                    title: 'Demanda atualizada',
                    description: justification,
                    user: 'Sistema'
                });
            }
            
            if (attachment) {
                timeline.unshift({
                    id: ulid(),
                    type: 'attachment',
                    date: new Date(),
                    title: 'Anexo adicionado',
                    description: `Anexo "${attachment.name}" adicionado`,
                    metadata: {
                        attachmentUrl: attachment.url,
                        attachmentType: attachment.type
                    },
                    user: 'Sistema'
                });
            }

             dataToUpdate.timeline = timeline;
         }
      }

      const updatedDemand = await updateDemand(id, dataToUpdate);
      if (updatedDemand) {
        set((state) => ({
          demands: state.demands.map((d) => (d.id === id ? updatedDemand : d)),
        }));
      }
    } catch (error) {
      console.error("Failed to update demand:", error);
      throw error;
    }
  },
  removeDemand: async (id) => {
    try {
      await deleteDemand(id);
      set((state) => ({
        demands: state.demands.filter((d) => d.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete demand:", error);
      throw error;
    }
  },
  loadDemands: async () => {
    set({ isLoadingDemands: true });
    try {
      const demands = await getAllDemands();
      // Sort by createdAt desc
      const sortedDemands = demands.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      set({ demands: sortedDemands, isLoadingDemands: false });
    } catch (error) {
      console.error("Failed to load demands:", error);
      set({ isLoadingDemands: false });
    }
  },
}));
