import React, { useState } from "react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../shared/components/ui/table";
import Badge from "../../../shared/components/ui/badge/Badge";
import { Demand, useAppStore } from "../../../shared/store/appStore";
import { DeadlineModal } from "./DeadlineModal";
import { Eye, Edit2, Trash2, Clock, Calendar } from "lucide-react";

interface DemandTableProps {
  demands: Demand[];
}

export const DemandTable: React.FC<DemandTableProps> = ({ demands }) => {
  const { categoryOptions, urgencyOptions, statusOptions, removeDemand, updateDemand } = useAppStore();
  const navigate = useNavigate();

  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [selectedDemandDate, setSelectedDemandDate] = useState<Date | undefined>(undefined);
  const [isSavingDeadline, setIsSavingDeadline] = useState(false);

  const handleOpenDeadlineModal = (demand: Demand) => {
    setSelectedDemandId(demand.id);
    setSelectedDemandDate(demand.deadline ? new Date(demand.deadline) : undefined);
    setIsDeadlineModalOpen(true);
  };

  const handleCloseDeadlineModal = () => {
    setIsDeadlineModalOpen(false);
    setSelectedDemandId(null);
    setSelectedDemandDate(undefined);
  };

  const handleSaveDeadline = async (date: Date | undefined) => {
    if (!selectedDemandId) return;

    setIsSavingDeadline(true);
    try {
      await updateDemand(selectedDemandId, { deadline: date });
      Swal.fire({
        title: "Sucesso!",
        text: "Prazo atualizado com sucesso.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        background: document.documentElement.classList.contains("dark") ? "#1f2937" : "#fff",
        color: document.documentElement.classList.contains("dark") ? "#fff" : "#1f2937",
      });
      handleCloseDeadlineModal();
    } catch (error) {
      console.error("Failed to update deadline:", error);
      Swal.fire({
        title: "Erro!",
        text: "Não foi possível atualizar o prazo.",
        icon: "error",
        background: document.documentElement.classList.contains("dark") ? "#1f2937" : "#fff",
        color: document.documentElement.classList.contains("dark") ? "#fff" : "#1f2937",
      });
    } finally {
      setIsSavingDeadline(false);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/demands/${id}/edit`);
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: "Tem certeza?",
      text: "Você não poderá reverter esta ação!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#3B82F6",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
      background: document.documentElement.classList.contains("dark") ? "#1f2937" : "#fff",
      color: document.documentElement.classList.contains("dark") ? "#fff" : "#1f2937",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await removeDemand(id);
          Swal.fire({
            title: "Excluído!",
            text: "A demanda foi excluída.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
            background: document.documentElement.classList.contains("dark") ? "#1f2937" : "#fff",
            color: document.documentElement.classList.contains("dark") ? "#fff" : "#1f2937",
          });
        } catch (error) {
          Swal.fire({
            title: "Erro!",
            text: "Não foi possível excluir a demanda.",
            icon: "error",
            background: document.documentElement.classList.contains("dark") ? "#1f2937" : "#fff",
            color: document.documentElement.classList.contains("dark") ? "#fff" : "#1f2937",
          });
        }
      }
    });
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const groupedDemands = React.useMemo(() => {
    const groups: Record<string, Demand[]> = {};
    
    // Initialize groups based on statusOptions
    statusOptions.forEach((opt) => {
      groups[opt.value] = [];
    });

    // Distribute demands
    demands.forEach((demand) => {
      const status = demand.status || "em-analise";
      if (!groups[status]) {
        // If status not in options, maybe add to a default or add key
        groups[status] = [];
      }
      groups[status].push(demand);
    });

    return groups;
  }, [demands, statusOptions]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Protocolo
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Título
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Categoria
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Urgência
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Solicitante
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Data
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Prazo
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Ações
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {statusOptions.map((statusOption) => {
              const groupDemands = groupedDemands[statusOption.value] || [];
              if (groupDemands.length === 0) return null;

              return (
                <React.Fragment key={statusOption.value}>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 dark:bg-white/[0.02] dark:hover:bg-white/[0.02]">
                    <TableCell colSpan={9} className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          {statusOption.label}
                        </span>
                        <Badge
                          variant="light"
                          color={statusOption.badge?.color || "light"}
                          size="sm"
                        >
                          {groupDemands.length}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                  {groupDemands.map((demand) => {
                    const isOverdue = demand.deadline && new Date(demand.deadline) < new Date() && demand.status !== 'concluido';
                    return (
                    <TableRow key={demand.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                      <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {demand.protocol || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span 
                          className="block font-medium text-gray-800 text-theme-sm dark:text-white/90 cursor-pointer hover:text-brand-600 hover:underline"
                          onClick={() => navigate(`/demands/${demand.id}`)}
                        >
                          {demand.title}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {getCategoryLabel(demand.category)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <Badge
                          size="sm"
                          color={getUrgencyBadgeColor(demand.urgency)}
                        >
                          {getUrgencyLabel(demand.urgency)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex flex-col items-start gap-1">
                          <Badge
                            size="sm"
                            color={getStatusBadgeColor(demand.status || "em-analise")}
                          >
                            {getStatusLabel(demand.status || "em-analise")}
                          </Badge>
                          {(() => {
                            const status = statusOptions.find(opt => opt.value === (demand.status || "em-analise"));
                            if (status?.badge?.text) {
                              return (
                                <Badge
                                  size="sm"
                                  variant="light"
                                  color={status.badge.color || "light"}
                                >
                                  {status.badge.text}
                                </Badge>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <div className="flex flex-col">
                          <span className="font-medium">{demand.requesterName}</span>
                          <span className="text-xs">{demand.requesterContact}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {formatDate(demand.createdAt)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {demand.deadline ? (
                          <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                            <Calendar size={14} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
                            <span>{formatDate(demand.deadline)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/demands/${demand.id}`)}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
                            title="Visualizar"
                          >
                            <Eye size={18} />
                          </button>
                          {(demand.status === "em-processo" || demand.status === "em-processo-fora-do-prazo") && (
                            <button
                              onClick={() => handleOpenDeadlineModal(demand)}
                              className="rounded p-1.5 text-gray-500 hover:bg-orange-50 hover:text-orange-600 dark:text-gray-400 dark:hover:bg-orange-900/30 dark:hover:text-orange-400"
                              title="Definir Prazo"
                            >
                              <Clock size={18} />
                            </button>
                          )}
                          {demand.status !== 'concluido' && (
                            <>
                              <button
                                onClick={() => handleEdit(demand.id)}
                                className="rounded p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                                title="Editar"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(demand.id)}
                                className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                                title="Excluir"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <DeadlineModal
        isOpen={isDeadlineModalOpen}
        onClose={handleCloseDeadlineModal}
        onSave={handleSaveDeadline}
        initialDate={selectedDemandDate}
        isLoading={isSavingDeadline}
      />
    </div>
  );
};
