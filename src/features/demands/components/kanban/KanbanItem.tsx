import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";
import { Eye, Edit2, Trash2, Clock, Calendar, User } from "lucide-react";
import { Demand, useAppStore } from "../../../../shared/store/appStore";
import { useMemberStore } from "../../../members/store/memberStore";
import Badge from "../../../../shared/components/ui/badge/Badge";

interface KanbanCardProps {
  demand: Demand;
  isDragging?: boolean;
  isOverlay?: boolean;
  style?: React.CSSProperties;
  attributes?: any;
  listeners?: any;
  setNodeRef?: (node: HTMLElement | null) => void;
  onOpenDeadline?: (demand: Demand) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  demand,
  isDragging,
  isOverlay,
  style,
  attributes,
  listeners,
  setNodeRef,
  onOpenDeadline,
}) => {
  const navigate = useNavigate();
  const { removeDemand } = useAppStore();
  const { members } = useMemberStore();

  const responsibleMember = demand.responsibleId ? members.find(m => m.id === demand.responsibleId) : null;

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/demands/${demand.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/demands/${demand.id}/edit`);
  };

  const handleDeadline = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenDeadline) {
      onOpenDeadline(demand);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
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
          await removeDemand(demand.id);
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

  const isCompleted = demand.status === 'concluido';
  const isOverdue = demand.deadline && new Date(demand.deadline) < new Date() && !isCompleted;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative flex flex-col gap-2 p-3 rounded-xl border transition-all duration-200 mb-3 ${
        isOverlay
            ? "border-brand-500 bg-white ring-2 ring-brand-500/20 z-50 shadow-xl scale-105 rotate-2 cursor-grabbing dark:bg-gray-800"
            : isDragging
            ? "opacity-50 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 grayscale"
            : isCompleted
            ? "bg-gray-50/50 border-gray-100 dark:bg-gray-800/30 dark:border-gray-800 cursor-default opacity-80 hover:border-gray-200 dark:hover:border-gray-700"
            : "cursor-grab bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
      }`}
    >
      {/* Header */}
      <div className={`flex items-start justify-between ${isDragging && !isOverlay ? "opacity-25" : ""}`}>
        <span className="font-mono text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 px-1.5 py-0.5 rounded tracking-wide">
          {demand.protocol}
        </span>
        {demand.urgency && (
            <Badge
                color={
                demand.urgency === "alta"
                    ? "error"
                    : demand.urgency === "media"
                    ? "warning"
                    : "success"
                }
                size="sm"
                variant="light"
            >
                {demand.urgency}
            </Badge>
        )}
      </div>

      {/* Content */}
      <div>
        <h4 
          className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 mb-1 cursor-pointer hover:text-brand-600 hover:underline transition-colors" 
          title={demand.title}
          onClick={handleView}
        >
          {demand.title}
        </h4>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400 flex-shrink-0 border border-brand-100 dark:border-brand-800/30">
                {demand.requesterName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
               <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[80px]" title={demand.requesterName}>
                   {demand.requesterName}
               </span>
               {responsibleMember && (
                 <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5" title={`Responsável: ${responsibleMember.name}`}>
                   <User size={10} />
                   <span className="truncate max-w-[80px]">{responsibleMember.name}</span>
                 </div>
               )}
               {demand.deadline && (
                 <div className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-red-500 font-medium' : 'text-green-500 font-medium'}`}>
                   <Calendar size={10} />
                   <span>{new Date(demand.deadline).toLocaleDateString('pt-BR')}</span>
                 </div>
               )}
            </div>
        </div>
        
        {/* Actions */}
        <div className={`flex items-center gap-0.5 opacity-0 transition-opacity duration-200 ${isOverlay ? "opacity-100" : "group-hover:opacity-100"}`}>
          <button
            onClick={handleView}
            className="p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-600 rounded transition-colors dark:hover:bg-gray-700 dark:hover:text-brand-400"
            title="Visualizar"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Eye size={14} />
          </button>
          
          {(demand.status === "em-processo" || demand.status === "em-processo-fora-do-prazo") && (
            <button
              onClick={handleDeadline}
              className="rounded p-1 text-gray-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/30 dark:hover:text-orange-400"
              title="Definir Prazo"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Clock size={14} />
            </button>
          )}

          {!isCompleted && (
            <>
              <button
                onClick={handleEdit}
                className="p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600 rounded transition-colors dark:hover:bg-gray-700 dark:hover:text-blue-400"
                title="Editar"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 rounded transition-colors dark:hover:bg-gray-700 dark:hover:text-red-400"
                title="Excluir"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface KanbanItemProps {
  demand: Demand;
  onOpenDeadline?: (demand: Demand) => void;
}

export const KanbanItem: React.FC<KanbanItemProps> = ({ demand, onOpenDeadline }) => {
  const isCompleted = demand.status === 'concluido';
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: demand.id, 
    data: { demand },
    disabled: isCompleted
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };


  return (
    <KanbanCard
      demand={demand}
      isDragging={isDragging}
      style={style}
      attributes={attributes}
      listeners={listeners}
      setNodeRef={setNodeRef}
      onOpenDeadline={onOpenDeadline}
    />
  );
};
