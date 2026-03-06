import { create } from "zustand";
import { ulid } from "ulid";
import { DemandFormData } from "../../features/demands/types";
import { saveDemand, getAllDemands, saveSettings, getSettings, updateDemand, deleteDemand, deleteAllDemands, StatusHistoryEntry, TimelineEvent, Tratativa, DemandTratativa } from "../services/db";
import { syncService } from "../services/sync";
import { generateSlug } from "../utils/stringUtils";
import { useMemberStore } from "../../features/members/store/memberStore";

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
  updatedAt: Date;
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
  politicalSpectrumOptions: Option[];
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
  addPoliticalSpectrum: (option: Option) => void;
  removePoliticalSpectrum: (value: string) => void;
  updatePoliticalSpectrum: (value: string, newLabel: string, newSlug: string) => void;
  reorderPoliticalSpectrums: (newOrder: Option[]) => void;
  updateDefaultLocation: (location: Location) => void;
  loadSettings: () => Promise<void>;

  // Demandas
  demands: Demand[];
  addDemand: (demand: DemandFormData) => Promise<void>;
  updateDemand: (id: string, demand: Partial<Demand>, justification?: string, attachment?: { type: 'image' | 'pdf', url: string, name: string }) => Promise<void>;
  removeDemand: (id: string) => Promise<void>;
  clearDemands: () => Promise<void>;
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
  politicalSpectrumOptions: [],
  defaultLocation: getInitialLocation(),

  // Ações de Configuração
  addCategory: (option) => {
    set((state) => {
      // Validate unique slug
      if (state.categoryOptions.some(opt => opt.value === option.value)) {
          throw new Error("Já existe uma categoria com este slug.");
      }
      const newCategories = [...state.categoryOptions, option];
      saveSettings(newCategories, state.urgencyOptions, state.statusOptions, state.tratativaOptions, state.roleOptions, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
      return { categoryOptions: newCategories };
    });
  },
  removeCategory: (value) => {
    set((state) => {
      const newCategories = state.categoryOptions.filter((opt) => opt.value !== value);
      saveSettings(newCategories, state.urgencyOptions, state.statusOptions, state.tratativaOptions, state.roleOptions, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
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
      saveSettings(newCategories, state.urgencyOptions, state.statusOptions, state.tratativaOptions, state.roleOptions, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
      return { categoryOptions: newCategories };
    });
  },
  reorderCategories: (newOrder) => {
    set((state) => {
      saveSettings(newOrder, state.urgencyOptions, state.statusOptions, state.tratativaOptions, state.roleOptions, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
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
      saveSettings(state.categoryOptions, newUrgencies, state.statusOptions, state.tratativaOptions, state.roleOptions, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
      return { urgencyOptions: newUrgencies };
    });
  },
  removeUrgency: (value) => {
    set((state) => {
      const newUrgencies = state.urgencyOptions.filter((opt) => opt.value !== value);
      saveSettings(state.categoryOptions, newUrgencies, state.statusOptions, state.tratativaOptions, state.roleOptions, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
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
      saveSettings(state.categoryOptions, newUrgencies, state.statusOptions, state.tratativaOptions, state.roleOptions, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
      return { urgencyOptions: newUrgencies };
    });
  },
  reorderUrgencies: (newOrder) => {
    set((state) => {
      saveSettings(state.categoryOptions, newOrder, state.statusOptions, state.tratativaOptions, state.roleOptions, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
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
      saveSettings(state.categoryOptions, state.urgencyOptions, newStatus, state.tratativaOptions, state.roleOptions, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
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
      saveSettings(state.categoryOptions, state.urgencyOptions, newStatus, state.tratativaOptions, state.roleOptions, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
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
      saveSettings(state.categoryOptions, state.urgencyOptions, newStatus, state.tratativaOptions, state.roleOptions, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
      return { statusOptions: newStatus };
    });
  },
  reorderStatus: (newOrder) => {
    set((state) => {
      saveSettings(state.categoryOptions, state.urgencyOptions, newOrder, state.tratativaOptions, state.roleOptions, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
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
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, newTratativas, state.roleOptions, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
      return { tratativaOptions: newTratativas };
    });
  },
  removeTratativa: (id) => {
    set((state) => {
      const newTratativas = state.tratativaOptions.filter((opt) => opt.id !== id);
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, newTratativas, state.roleOptions, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
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
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, newTratativas, state.roleOptions, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
      return { tratativaOptions: newTratativas };
    });
  },
  reorderTratativas: (newOrder) => {
    set((state) => {
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, newOrder, state.roleOptions, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
      return { tratativaOptions: newOrder };
    });
  },

  addRole: (option) => {
    set((state) => {
      if (state.roleOptions.some(opt => opt.value === option.value)) {
        throw new Error("Já existe um cargo com este slug.");
      }
      const newRoles = [...state.roleOptions, option];
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, state.tratativaOptions, newRoles, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
      return { roleOptions: newRoles };
    });
  },
  removeRole: (value) => {
    set((state) => {
      const newRoles = state.roleOptions.filter((opt) => opt.value !== value);
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, state.tratativaOptions, newRoles, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
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
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, state.tratativaOptions, newRoles, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
      return { roleOptions: newRoles };
    });
  },
  reorderRoles: (newOrder) => {
    set((state) => {
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, state.tratativaOptions, newOrder, state.politicalSpectrumOptions);
      syncService.syncSettings().catch(console.error);
      return { roleOptions: newOrder };
    });
  },

  addPoliticalSpectrum: (option) => {
    set((state) => {
      if (state.politicalSpectrumOptions.some(opt => opt.value === option.value)) {
        throw new Error("Já existe um espectro político com este slug.");
      }
      const newOptions = [...state.politicalSpectrumOptions, option];
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, state.tratativaOptions, state.roleOptions, newOptions);
      syncService.syncSettings().catch(console.error);
      return { politicalSpectrumOptions: newOptions };
    });
  },
  removePoliticalSpectrum: (value) => {
    set((state) => {
      const newOptions = state.politicalSpectrumOptions.filter((opt) => opt.value !== value);
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, state.tratativaOptions, state.roleOptions, newOptions);
      syncService.syncSettings().catch(console.error);
      return { politicalSpectrumOptions: newOptions };
    });
  },
  updatePoliticalSpectrum: (value, newLabel, newSlug) => {
    set((state) => {
      if (value !== newSlug && state.politicalSpectrumOptions.some(opt => opt.value === newSlug)) {
          throw new Error("Já existe um espectro político com este slug.");
      }
      const newOptions = state.politicalSpectrumOptions.map((opt) =>
        opt.value === value ? { ...opt, label: newLabel, value: newSlug } : opt
      );
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, state.tratativaOptions, state.roleOptions, newOptions);
      syncService.syncSettings().catch(console.error);
      return { politicalSpectrumOptions: newOptions };
    });
  },
  reorderPoliticalSpectrums: (newOrder) => {
    set((state) => {
      saveSettings(state.categoryOptions, state.urgencyOptions, state.statusOptions, state.tratativaOptions, state.roleOptions, newOrder);
      syncService.syncSettings().catch(console.error);
      return { politicalSpectrumOptions: newOrder };
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
      let politicalSpectrums = settings.politicalSpectrums || [];
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
        { value: "acoes-do-gabinete", label: "Ações do Gabinete", badge: { text: "Gabinete", color: "warning" } },
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

      if (politicalSpectrums.length === 0) {
        politicalSpectrums = [
            { value: "esquerda", label: "Esquerda" },
            { value: "direita", label: "Direita" },
            { value: "centro", label: "Centro" },
        ];
        hasChanges = true;
      }

      if (hasChanges) {
        await saveSettings(categories, urgencies, statusOptions, tratativas, roles, politicalSpectrums);
      }

      set({
        categoryOptions: categories,
        urgencyOptions: urgencies,
        statusOptions: statusOptions,
        tratativaOptions: tratativas,
        roleOptions: roles,
        politicalSpectrumOptions: politicalSpectrums,
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
      const { members } = useMemberStore.getState();
      const responsibleId = demandData.responsibleId;
      const actorName = responsibleId ? (members.find(m => m.id === responsibleId)?.name || 'Sistema') : 'Sistema';

      const newDemand = await saveDemand(demandData, actorName);
      set((state) => ({
        demands: [newDemand, ...state.demands],
      }));
      syncService.syncDemands().catch(console.error);
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

      const now = new Date();
      // Handle deadline changes and automatic status updates
      if (demandData.deadline !== undefined) {
          const deadline = demandData.deadline ? new Date(demandData.deadline) : undefined;
          
          if (deadline) {
             // If updating deadline, re-evaluate status based on expiration
             if (now > deadline) {
                // If expired, force status to overdue if it was 'em-processo' or 'em-processo-fora-do-prazo'
                if (newStatus === 'em-processo' || currentDemand.status === 'em-processo' || currentDemand.status === 'em-processo-fora-do-prazo') {
                   newStatus = 'em-processo-fora-do-prazo';
                }
             } else {
                // If valid deadline, revert overdue to 'em-processo'
                if (newStatus === 'em-processo-fora-do-prazo' || currentDemand.status === 'em-processo-fora-do-prazo') {
                   newStatus = 'em-processo';
                }
             }
          }
      } else if (newStatus === 'em-processo') {
          // If just changing status to 'em-processo', check existing deadline
          const deadline = currentDemand.deadline ? new Date(currentDemand.deadline) : undefined;
          if (deadline && now > deadline) {
             newStatus = 'em-processo-fora-do-prazo';
          }
      }

      // Get actor name based on current responsible
      const { members } = useMemberStore.getState();
      const getActorName = (responsibleId?: string) => {
          if (!responsibleId) return 'Sistema';
          const member = members.find(m => m.id === responsibleId);
          return member ? member.name : 'Sistema';
      };
      const actorName = getActorName(currentDemand.responsibleId);

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
          responsibleId: dataToUpdate.responsibleId || currentDemand.responsibleId
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
                justification: justification,
                responsibleId: dataToUpdate.responsibleId
            },
            user: actorName
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
                user: actorName
            });
        }

        dataToUpdate.timeline = timeline;
      } else {
         // Just updating fields without status change
         if (Object.keys(dataToUpdate).length > 0) {
            const timeline = currentDemand.timeline ? [...currentDemand.timeline] : [];
            
            // Check specific fields for timeline events
            if (dataToUpdate.responsibleId && dataToUpdate.responsibleId !== currentDemand.responsibleId) {
                timeline.unshift({
                    id: ulid(),
                    type: 'updated',
                    date: new Date(),
                    title: 'Responsável atualizado',
                    description: justification || 'Responsável alterado',
                    metadata: {
                        from: currentDemand.responsibleId,
                        to: dataToUpdate.responsibleId,
                        justification: justification
                    },
                    user: actorName
                });
            }

            // Check for deadline changes
            if (dataToUpdate.deadline !== undefined) {
                const currentDeadline = currentDemand.deadline ? new Date(currentDemand.deadline).getTime() : null;
                const newDeadline = dataToUpdate.deadline ? new Date(dataToUpdate.deadline).getTime() : null;
                
                if (currentDeadline !== newDeadline) {
                     const formattedCurrent = currentDeadline ? new Date(currentDeadline).toLocaleDateString('pt-BR') : 'Sem prazo';
                     const formattedNew = newDeadline ? new Date(newDeadline).toLocaleDateString('pt-BR') : 'Sem prazo';
                     
                     timeline.unshift({
                        id: ulid(),
                        type: 'updated',
                        date: new Date(),
                        title: 'Prazo atualizado',
                        description: `Prazo alterado\nDe: ${formattedCurrent}\nPara: ${formattedNew}`,
                        metadata: {
                            from: currentDemand.deadline,
                            to: dataToUpdate.deadline,
                            field: 'deadline',
                            justification: justification
                        },
                        user: actorName
                    });
                }
            }

            if (justification && !dataToUpdate.responsibleId) {
                 timeline.unshift({
                    id: ulid(),
                    type: 'updated',
                    date: new Date(),
                    title: 'Demanda atualizada',
                    description: justification,
                    user: actorName
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
                    user: actorName
                });
            }

            // Check for tratativas changes (add, remove, update)
            if (dataToUpdate.tratativas) {
                const currentTratativas = currentDemand.tratativas || [];
                const newTratativas = dataToUpdate.tratativas;
                const { tratativaOptions } = get();

                // 1. Added Tratativas
                const addedTratativas = newTratativas.filter(t => !currentTratativas.some(ct => ct.id === t.id));
                addedTratativas.forEach(t => {
                    const typeOption = tratativaOptions.find(o => o.id === t.tratativaId);
                    const typeLabel = typeOption ? typeOption.title : t.tratativaId;

                    timeline.unshift({
                        id: ulid(),
                        type: 'tratativa',
                        date: new Date(),
                        title: `Adicionada nova tratativa: ${typeLabel}`,
                        description: t.description,
                        metadata: {
                            tratativaId: t.id,
                            tratativaType: t.tratativaId,
                            tratativaTitle: t.title,
                            action: 'added'
                        },
                        user: actorName
                    });
                });

                // 2. Removed Tratativas
                const removedTratativas = currentTratativas.filter(ct => !newTratativas.some(nt => nt.id === ct.id));
                removedTratativas.forEach(t => {
                    const typeOption = tratativaOptions.find(o => o.id === t.tratativaId);
                    const typeLabel = typeOption ? typeOption.title : t.tratativaId;

                    timeline.unshift({
                        id: ulid(),
                        type: 'tratativa',
                        date: new Date(),
                        title: `Tratativa removida: ${typeLabel}`,
                        description: t.description,
                        metadata: {
                            tratativaId: t.id,
                            tratativaType: t.tratativaId,
                            tratativaTitle: t.title,
                            action: 'removed'
                        },
                        user: actorName
                    });
                });

                // 3. Updated Tratativas (Status Change)
                newTratativas.forEach(nt => {
                    const ct = currentTratativas.find(t => t.id === nt.id);
                    if (ct && ct.completed !== nt.completed) {
                        const typeOption = tratativaOptions.find(o => o.id === nt.tratativaId);
                        const typeLabel = typeOption ? typeOption.title : nt.tratativaId;
                        const action = nt.completed ? "Concluída" : "Reaberta";

                        timeline.unshift({
                            id: ulid(),
                            type: 'tratativa',
                            date: new Date(),
                            title: `Tratativa ${action}: ${typeLabel}`,
                            description: nt.description,
                            metadata: {
                                tratativaId: nt.id,
                                tratativaType: nt.tratativaId,
                                tratativaTitle: nt.title,
                                action: nt.completed ? 'completed' : 'reopened'
                            },
                            user: actorName
                        });
                    }
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
        syncService.syncDemands().catch(console.error);
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
      syncService.syncDemands().catch(console.error);
    } catch (error) {
      console.error("Failed to delete demand:", error);
      throw error;
    }
  },
  clearDemands: async () => {
    try {
      await deleteAllDemands();
      set({ demands: [] });
    } catch (error) {
      console.error("Failed to clear demands:", error);
      throw error;
    }
  },
  loadDemands: async () => {
    set({ isLoadingDemands: true });
    try {
      const demands = await getAllDemands();
      const now = new Date();
      let hasUpdates = false;

      // Check for expired demands and update them
      for (const demand of demands) {
        if (demand.status === 'em-processo' && demand.deadline) {
          const deadlineDate = new Date(demand.deadline);
          // Check if deadline has passed
          if (now > deadlineDate) {
            const newStatus = 'em-processo-fora-do-prazo';
            
            // Calculate status history
            let history = demand.statusHistory ? [...demand.statusHistory] : [];
            let totalDuration = demand.totalDuration || 0;

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
              status: newStatus,
              startDate: now,
            });

            // Add timeline event
            const timeline = demand.timeline ? [...demand.timeline] : [];
            timeline.unshift({
              id: ulid(),
              type: 'status_change',
              date: now,
              title: 'Prazo Expirado',
              description: 'O prazo desta demanda expirou. Status alterado automaticamente para "Em Processo Fora do Prazo".',
              metadata: {
                from: demand.status,
                to: newStatus,
                justification: 'Prazo expirado'
              },
              user: 'Sistema'
            });

            // Update in DB
            const updatedData = {
              status: newStatus,
              statusHistory: history,
              totalDuration: totalDuration,
              timeline: timeline
            };

            await updateDemand(demand.id, updatedData);

            // Update local object
            demand.status = newStatus;
            demand.statusHistory = history;
            demand.totalDuration = totalDuration;
            demand.timeline = timeline;
            
            hasUpdates = true;
          }
        }
      }

      if (hasUpdates) {
        console.log("Demands updated due to expiration.");
        syncService.syncDemands().catch(console.error);
      }

      // Sort by createdAt desc
      const sortedDemands = demands.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      set({ demands: sortedDemands, isLoadingDemands: false });
    } catch (error) {
      console.error("Failed to load demands:", error);
      set({ isLoadingDemands: false });
    }
  },
}));
