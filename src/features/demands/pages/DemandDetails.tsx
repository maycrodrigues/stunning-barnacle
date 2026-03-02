import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Swal from "sweetalert2";
import PageMeta from "../../../shared/components/common/PageMeta";
import PageBreadcrumb from "../../../shared/components/common/PageBreadCrumb";
import Badge from "../../../shared/components/ui/badge/Badge";
import { Loader } from "../../../shared/components/ui/loader";
import { getDemandById } from "../../../shared/services/db";
import { Demand, useAppStore } from "../../../shared/store/appStore";
import { DemandTimeline } from "../components/DemandTimeline";
import { DemandMap } from "../components/DemandMap";
import { DemandTratativas } from "../components/DemandTratativas";
import { DeadlineModal } from "../components/DeadlineModal";
import { StatusChangeModal } from "../components/StatusChangeModal";
import { useMemberStore } from "../../members/store/memberStore";
import { Clock, User } from "lucide-react";

export const DemandDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categoryOptions, urgencyOptions, statusOptions, updateDemand } = useAppStore();
  const { members, loadMembers } = useMemberStore();
  const [demand, setDemand] = useState<Demand | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Deadline Modal State
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [isSavingDeadline, setIsSavingDeadline] = useState(false);
  
  // Status Change Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatusValue, setNewStatusValue] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'status-change' | 'responsible-change'>('status-change');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  
  // Pending Status Change State (similar to KanbanBoard)
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);

  const loadDemand = async () => {
    if (!id) return;
    try {
      const data = await getDemandById(id);
      if (data) {
        // Cast the result to Demand type as getDemandById returns generic object
        setDemand(data as unknown as Demand);
      } else {
        navigate("/demands/list");
      }
    } catch (error) {
      console.error("Failed to load demand", error);
      navigate("/demands/list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDemand();
    loadMembers();
  }, [id, navigate]);

  const handleDemandUpdate = () => {
    loadDemand();
  };
  
  // This function might be triggered from a status change action (if implemented in details page)
  // For now, we'll expose a method or simply handle deadline updates directly
  const handleSaveDeadline = async (date: Date | undefined) => {
    if (!demand) return;
    
    setIsSavingDeadline(true);
    try {
        await updateDemand(demand.id, { deadline: date });
        
        // If we had a pending status change to 'em-processo'
        if (pendingStatusChange === 'em-processo') {
            // Here we would proceed with status change, but DemandDetails currently 
            // doesn't have a status change UI with justification modal built-in 
            // in the same way as Kanban. 
            // Assuming this modal is used when user clicks to edit deadline manually
            // or if we add status change controls here later.
        }
        
        loadDemand();
        setIsDeadlineModalOpen(false);
    } catch (error) {
        console.error("Failed to update deadline", error);
    } finally {
        setIsSavingDeadline(false);
        setIsSavingDeadline(false);
    }
  };

  const handleReopenDemand = async () => {
    if (!demand) return;
    
    try {
        await updateDemand(demand.id, { status: "em-analise" }, "Demanda reaberta pelo usuário");
        
        await Swal.fire({
            title: "Sucesso",
            text: "Demanda reaberta com sucesso! O status foi alterado para 'Em Análise'.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false
        });
        
        loadDemand();
    } catch (error) {
        console.error("Failed to reopen demand", error);
        Swal.fire("Erro", "Falha ao reabrir demanda", "error");
    }
  };

  const handleStatusChange = (status: string) => {
    setNewStatusValue(status);
    setModalMode('status-change');
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async (
    justification: string, 
    attachment: { type: 'image' | 'pdf', url: string, name: string } | null | undefined, 
    responsibleId?: string
  ) => {
    const statusToUpdate = newStatusValue || demand?.status;

    if (!demand || !statusToUpdate) return;

    setIsSavingStatus(true);
    try {
      await updateDemand(
        demand.id, 
        { 
          status: statusToUpdate,
          responsibleId: responsibleId 
        }, 
        justification,
        attachment || undefined
      );
      
      setIsStatusModalOpen(false);
      setNewStatusValue(null);
      loadDemand();

      await Swal.fire({
        title: "Sucesso",
        text: "Status atualizado com sucesso!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Failed to update status", error);
      Swal.fire("Erro", "Falha ao atualizar status", "error");
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleResponsibleChange = () => {
    // Open modal with current status to just change responsible
    setNewStatusValue(demand?.status || "em-analise");
    setModalMode('responsible-change');
    setIsStatusModalOpen(true);
  }

  const getResponsibleName = (id?: string) => {
    if (!id) return "Não atribuído";
    const member = members.find(m => m.id === id);
    return member?.name || "Usuário não encontrado";
  };

  const getCategoryLabel = (slug: string) => {
    return categoryOptions.find((opt) => opt.value === slug)?.label || slug;
  };

  const getUrgencyLabel = (slug: string) => {
    return urgencyOptions.find((opt) => opt.value === slug)?.label || slug;
  };

  const getStatusLabel = (slug: string) => {
    return statusOptions.find((opt) => opt.value === slug)?.label || slug;
  };

  const getUrgencyBadgeColor = (slug: string) => {
    switch (slug) {
      case "baixa":
        return "success";
      case "media":
        return "warning";
      case "alta":
        return "error";
      case "urgente":
        return "error";
      default:
        return "light";
    }
  };

  const getStatusBadgeColor = (slug: string) => {
    const status = statusOptions.find((opt) => opt.value === slug);
    if (status?.badge?.color) {
      return status.badge.color;
    }

    switch (slug) {
      case "em-analise":
        return "warning";
      case "em-processo":
        return "info";
      case "em-processo-fora-do-prazo":
        return "error";
      case "concluido":
        return "success";
      default:
        return "light";
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const formatDeadline = (date: Date | string | undefined) => {
    if (!date) return "Não definido";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  const getDaysOpen = (date: Date | string | undefined) => {
    if (!date) return 0;
    const start = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <Loader className="h-64" />
    );
  }

  if (!demand) {
    return null;
  }

  return (
    <>
      <PageMeta
        title={`Detalhes da Demanda #${demand.protocol} | Gabinete Online`}
        description="Visualizar detalhes da demanda"
      />
      <PageBreadcrumb pageTitle="Detalhes da Demanda" />

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Protocolo: <span className="font-mono text-brand-600 dark:text-brand-400">{demand.protocol}</span>
        </h2>
        <div className="flex gap-3">
          {demand.status === "concluido" ? (
            <button
              onClick={handleReopenDemand}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reabrir Demanda
            </button>
          ) : (
            <button
              onClick={() => navigate(`/demands/${demand.id}/edit`)}
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
          )}
          <button
            onClick={() => navigate("/demands/list")}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700/50 dark:focus:ring-offset-gray-900"
          >
            Voltar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          {/* Informações Principais */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">
              Informações da Demanda
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Título
                </label>
                <p className="text-base font-medium text-gray-800 dark:text-white">
                  {demand.title}
                </p>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Descrição
                </label>
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-white/[0.03] dark:text-gray-300 whitespace-pre-wrap">
                  {demand.description}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Categoria
                  </label>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {getCategoryLabel(demand.category)}
                  </p>
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Data de Criação
                  </label>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {formatDate(demand.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tratativas */}
          <DemandTratativas demand={demand} onUpdate={handleDemandUpdate} />
        </div>

        <div className="xl:col-span-1 space-y-6">

           {/* Solicitante */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">
              Dados do Solicitante
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Nome
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {demand.requesterName}
                </p>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Contato
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {demand.requesterContact}
                </p>
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">
              Localização
            </h3>
            <div className="h-48 w-full overflow-hidden rounded-lg">
                <DemandMap location={demand.location} />
            </div>
          </div>

          {/* Status e Prioridade */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">
              Status e Prioridade
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Urgência
                </label>
                <div>
                  <Badge
                    size="md"
                    color={getUrgencyBadgeColor(demand.urgency)}
                  >
                    {getUrgencyLabel(demand.urgency)}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status Atual
                </label>
                <div 
                  className="flex items-center gap-2"
                  title="Clique para alterar o status"
                >
                  <Badge
                    size="md"
                    color={getStatusBadgeColor(demand.status || "em-analise")}
                  >
                    {getStatusLabel(demand.status || "em-analise")}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Responsável
                </label>
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleResponsibleChange}
                  title="Clique para alterar o responsável"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-white">
                    <User size={16} className="text-gray-400" />
                    <span>{getResponsibleName(demand.responsibleId)}</span>
                  </div>
                  <span className="text-xs text-blue-500">(Alterar)</span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Prazo
                </label>
                <div 
                    className={`text-sm font-medium ${demand.deadline ? 'text-gray-800 dark:text-white' : 'text-gray-400'} ${demand.status === 'concluido' ? 'cursor-not-allowed' : 'cursor-pointer hover:underline'}`}
                    onClick={() => {
                        if (demand.status === 'concluido') return;
                        setPendingStatusChange(null);
                        setIsDeadlineModalOpen(true);
                    }}
                >
                  {formatDeadline(demand.deadline)} 
                  {demand.status !== 'concluido' && (
                    <span className="ml-2 text-xs text-blue-500">(Editar)</span>
                  )}
                </div>
              </div>

              {demand.status !== 'concluido' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tempo em Aberto
                  </label>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-white">
                    <Clock size={16} className="text-gray-400" />
                    <span>Essa demanda está aberta há {getDaysOpen(demand.createdAt)} dia(s)</span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Histórico da Demanda */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">
              Histórico
            </h3>
            <DemandTimeline timeline={demand.timeline} />
          </div>
        </div>
      </div>

      <DeadlineModal
        isOpen={isDeadlineModalOpen}
        onClose={() => setIsDeadlineModalOpen(false)}
        onSave={handleSaveDeadline}
        initialDate={demand?.deadline ? new Date(demand.deadline) : undefined}
        isLoading={isSavingDeadline}
      />

      <StatusChangeModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setNewStatusValue(null);
        }}
        onConfirm={handleConfirmStatusChange}
        oldStatusLabel={getStatusLabel(demand?.status || "em-analise")}
        newStatusLabel={getStatusLabel(newStatusValue || demand?.status || "em-analise")}
        newStatusValue={newStatusValue || demand?.status || "em-analise"}
        initialResponsibleId={demand?.responsibleId}
          enableResponsibleSelection={true}
          mode={modalMode}
          isLoading={isSavingStatus}
        />
    </>
  );
};
