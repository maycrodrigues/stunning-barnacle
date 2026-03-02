import React, { useState, useMemo } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DropAnimation,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";
import { Eye, Edit2, Trash2, Clock, ChevronDown, ChevronRight, User, Calendar, GripVertical, MessageSquare, ListTodo } from "lucide-react";

import { Demand, useAppStore, Option } from "../../../shared/store/appStore";
import { useMemberStore } from "../../members/store/memberStore";
import Badge from "../../../shared/components/ui/badge/Badge";
import { StatusChangeModal } from "./StatusChangeModal";
import { CompletionTypeModal } from "./CompletionTypeModal";
import { ActionBlockedModal } from "./ActionBlockedModal";
import { DeadlineModal } from "./DeadlineModal";
import { TratativasPreviewModal } from "./TratativasPreviewModal";

// --- Components ---

interface DemandListItemProps {
  demand: Demand;
  isOverlay?: boolean;
  categoryOptions: Option[];
  urgencyOptions: Option[];
}

const DemandListItem = ({ demand, isOverlay, categoryOptions, urgencyOptions }: DemandListItemProps) => {
  const navigate = useNavigate();
  const { removeDemand } = useAppStore();
  const { members } = useMemberStore();

  const responsibleMember = demand.responsibleId ? members.find(m => m.id === demand.responsibleId) : null;
  
  const [showTratativas, setShowTratativas] = useState(false);
  const openTratativasCount = demand.tratativas?.filter(t => !t.completed).length || 0;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: demand.id,
    data: {
      type: "Demand",
      demand,
    },
    disabled: demand.status === 'concluido'
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const getCategoryLabel = (slug: string) => {
    return categoryOptions.find((opt) => opt.value === slug)?.label || slug;
  };

  const getUrgencyLabel = (slug: string) => {
    return urgencyOptions.find((opt) => opt.value === slug)?.label || slug;
  };

  const getUrgencyBadgeColor = (slug: string) => {
    switch (slug) {
      case "baixa": return "success";
      case "media": return "warning";
      case "alta": return "error";
      case "urgente": return "error";
      default: return "light";
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag start if clicking button
    navigate(`/demands/${demand.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/demands/${demand.id}/edit`);
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
      className={`group relative flex items-center justify-between p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all ${
        isCompleted ? 'cursor-default opacity-80' : 'cursor-grab active:cursor-grabbing'
      } ${
        isDragging ? "opacity-30" : ""
      } ${isOverlay ? "shadow-none border border-brand-500 z-50 bg-white dark:bg-gray-800" : ""}`}
    >
      {/* Left Section: Drag Handle & Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`${isCompleted ? 'text-gray-200 dark:text-gray-700 cursor-not-allowed' : 'text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing hover:text-gray-500'} transition-colors`}>
          <GripVertical size={16} />
        </div>

        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          isCompleted ? 'bg-green-500' : 
          demand.status === 'em-processo' ? 'bg-blue-500' :
          demand.status === 'em-processo-fora-do-prazo' ? 'bg-red-500' :
          'bg-yellow-500'
        }`} />

        <div className="flex flex-col min-w-0">
          <h4 
            className="text-sm font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-brand-600 hover:underline transition-colors" 
            title={demand.title}
            onClick={handleView}
          >
            {demand.title}
          </h4>
          <span className="text-[10px] text-gray-400 font-mono hidden sm:inline-block">
            {demand.protocol}
          </span>
        </div>
      </div>

      {/* Right Section: Metadata & Actions */}
      <div className="flex items-center gap-3 flex-shrink-0 ml-4">

        {/* Responsible Member */}
        {responsibleMember && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400" title={`Responsável: ${responsibleMember.name}`}>
            <User size={14} className="text-gray-400" />
            <span className="hidden md:inline max-w-[100px] truncate">{responsibleMember.name}</span>
          </div>
        )}

        {/* Date */}
        {demand.deadline && (
          <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500 dark:text-gray-400'}`} title="Prazo">
            <Calendar size={14} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
            <span className="hidden md:inline">{formatDate(demand.deadline)}</span>
          </div>
        )}

        {/* Tratativas Count */}
        {openTratativasCount > 0 && (
          <div 
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-xs font-medium text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer border border-orange-200 dark:border-orange-800"
            onClick={(e) => {
              e.stopPropagation();
              setShowTratativas(true);
            }}
            title={`${openTratativasCount} tratativas em aberto`}
          >
            <ListTodo size={14} className="text-orange-600 dark:text-orange-400" />
            <span>{openTratativasCount}</span>
          </div>
        )}

        {/* Category Badge */}
        <div className="hidden sm:inline-flex">
          <Badge variant="light" size="sm" color="light">
            {getCategoryLabel(demand.category)}
          </Badge>
        </div>

        {/* Urgency Badge (condensed) */}
        {demand.urgency !== 'baixa' && (
           <Badge color={getUrgencyBadgeColor(demand.urgency)} size="sm">
             {getUrgencyLabel(demand.urgency)}
           </Badge>
        )}

        {/* Actions (Hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2 border-l border-gray-100 dark:border-gray-700 ml-1">
          <button
            onClick={handleView}
            className="p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
            title="Visualizar"
          >
            <Eye size={14} />
          </button>
          
          {!isCompleted && (
            <>
              <button
                onClick={handleEdit}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Editar"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Excluir"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {showTratativas && (
        <TratativasPreviewModal
          isOpen={showTratativas}
          onClose={() => setShowTratativas(false)}
          demandId={demand.id}
          demandProtocol={demand.protocol}
          tratativas={demand.tratativas || []}
        />
      )}
    </div>
  );
};

interface DemandStatusGroupProps {
  status: Option;
  demands: Demand[];
  categoryOptions: Option[];
  urgencyOptions: Option[];
}

const DemandStatusGroup = ({ status, demands, categoryOptions, urgencyOptions }: DemandStatusGroupProps) => {
  const { setNodeRef } = useSortable({
    id: status.value,
    data: {
      type: "Status",
      status,
    },
  });

  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleCount, setVisibleCount] = useState(5);

  const visibleDemands = useMemo(() => demands.slice(0, visibleCount), [demands, visibleCount]);
  const hasMore = visibleCount < demands.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  return (
    <div 
      ref={setNodeRef}
      className="mb-6 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden"
    >
      <div 
        className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-white/[0.05] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            {status.label}
            <span className="inline-flex items-center justify-center rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              {demands.length}
            </span>
          </h3>
          {status.badge && status.badge.text && (
            <Badge color={status.badge.color || "primary"} variant="light" size="sm">
              {status.badge.text}
            </Badge>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-0">
          <SortableContext
            items={visibleDemands.map((d) => d.id)}
            strategy={verticalListSortingStrategy}
          >
            <div 
              className="divide-y divide-gray-100 dark:divide-gray-800 min-h-[50px] bg-white dark:bg-transparent max-h-[400px] overflow-y-auto"
            >
              {demands.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                  Nenhuma demanda neste status
                </div>
              ) : (
                <>
                  {visibleDemands.map((demand) => (
                    <DemandListItem
                      key={demand.id}
                      demand={demand}
                      categoryOptions={categoryOptions}
                      urgencyOptions={urgencyOptions}
                    />
                  ))}
                  
                  {hasMore && (
                    <div className="p-3 text-center border-t border-gray-100 dark:border-gray-700">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadMore();
                        }}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
                      >
                        Carregar mais demandas (+{demands.length - visibleCount})
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </SortableContext>
        </div>
      )}
    </div>
  );
};

interface DemandGroupedListProps {
  demands: Demand[];
}

export const DemandGroupedList: React.FC<DemandGroupedListProps> = ({ demands }) => {
  const navigate = useNavigate();
  const { statusOptions, categoryOptions, urgencyOptions, updateDemand } = useAppStore();
  const { loadMembers } = useMemberStore();
  
  React.useEffect(() => {
    loadMembers();
  }, []);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState<{ id: string; newStatus: string; oldStatus: string } | null>(null);

  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState<{ id: string; oldStatus: string } | null>(null);

  const [isActionBlockedModalOpen, setIsActionBlockedModalOpen] = useState(false);
  const [blockedActionData, setBlockedActionData] = useState<{ statusLabel: string; tratativas: any[] } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const demandsByStatus = useMemo(() => {
    const grouped: Record<string, Demand[]> = {};
    statusOptions.forEach((status) => {
      grouped[status.value] = [];
    });
    demands.forEach((demand) => {
      const status = demand.status || "em-analise";
      if (!grouped[status]) {
          // If status doesn't exist in options, add it anyway or handle it
          grouped[status] = [];
      }
      grouped[status].push(demand);
    });
    return grouped;
  }, [demands, statusOptions]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string; // Can be a status value or another demand id

    if (activeId === overId) {
      setActiveId(null);
      return;
    }

    const activeDemand = demands.find((d) => d.id === activeId);
    if (!activeDemand) {
      setActiveId(null);
      return;
    }

    let newStatus = "";

    // Check if dropped on a status group directly (the header/container has the status value as ID)
    const isOverStatusGroup = statusOptions.some((s) => s.value === overId);
    
    if (isOverStatusGroup) {
      newStatus = overId;
    } else {
      // Check if dropped on another item
      const overDemand = demands.find((d) => d.id === overId);
      if (overDemand) {
        newStatus = overDemand.status || "";
      }
    }

    if (newStatus && newStatus !== activeDemand.status) {
      const restrictedStatuses = ['em-processo', 'em-processo-fora-do-prazo', 'concluido'];
      if (restrictedStatuses.includes(newStatus)) {
        // Ensure tratativas array exists and check for incomplete items
        const incompleteTratativas = activeDemand.tratativas?.filter(t => !t.completed) || [];
        
        if (incompleteTratativas.length > 0) {
          setBlockedActionData({
            statusLabel: statusOptions.find(s => s.value === newStatus)?.label || newStatus,
            tratativas: incompleteTratativas
          });
          setIsActionBlockedModalOpen(true);
          setActiveId(null);
          return;
        }
      }

      if (newStatus === 'concluido') {
        setPendingCompletion({
          id: activeId,
          oldStatus: activeDemand.status || "em-analise"
        });
        setIsCompletionModalOpen(true);
        setActiveId(null);
        return;
      }

      setPendingChange({
        id: activeId,
        newStatus: newStatus,
        oldStatus: activeDemand.status || "em-analise"
      });
      setIsStatusModalOpen(true);
    }
    
    setActiveId(null);
  };

  const handleConfirmStatusChange = async (justification: string, attachment?: { type: 'image' | 'pdf', url: string, name: string } | null, responsibleId?: string) => {
    if (pendingChange) {
      await updateDemand(pendingChange.id, { status: pendingChange.newStatus, responsibleId }, justification, attachment || undefined);
      setPendingChange(null);
      setIsStatusModalOpen(false);
    }
  };

  const handleCancelStatusChange = () => {
    setPendingChange(null);
    setIsStatusModalOpen(false);
  };

  const handleConfirmCompletionSuccess = async () => {
    if (pendingCompletion) {
      await updateDemand(pendingCompletion.id, { status: 'concluido' }, "Demanda concluída com sucesso.");
      setPendingCompletion(null);
      setIsCompletionModalOpen(false);
    }
  };

  const handleConfirmCompletionWithRestriction = () => {
    if (pendingCompletion) {
      setPendingChange({
        id: pendingCompletion.id,
        newStatus: 'concluido',
        oldStatus: pendingCompletion.oldStatus
      });
      setPendingCompletion(null);
      setIsCompletionModalOpen(false);
      setIsStatusModalOpen(true);
    }
  };

  const handleCancelCompletion = () => {
    setPendingCompletion(null);
    setIsCompletionModalOpen(false);
  };

  const activeDemand = activeId ? demands.find((d) => d.id === activeId) : null;

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.3',
        },
      },
    }),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4">
        {statusOptions.map((status) => (
          <DemandStatusGroup
            key={status.value}
            status={status}
            demands={demandsByStatus[status.value] || []}
            categoryOptions={categoryOptions}
            urgencyOptions={urgencyOptions}
          />
        ))}
      </div>

      {createPortal(
        <DragOverlay dropAnimation={dropAnimation} zIndex={1000}>
          {activeDemand ? (
            <DemandListItem 
              demand={activeDemand} 
              isOverlay 
              categoryOptions={categoryOptions}
              urgencyOptions={urgencyOptions}
            />
          ) : null}
        </DragOverlay>,
        document.body
      )}

      <StatusChangeModal
        isOpen={isStatusModalOpen}
        onClose={handleCancelStatusChange}
        onConfirm={handleConfirmStatusChange}
        oldStatusLabel={statusOptions.find(s => s.value === pendingChange?.oldStatus)?.label || pendingChange?.oldStatus || ''}
        newStatusLabel={statusOptions.find(s => s.value === pendingChange?.newStatus)?.label || pendingChange?.newStatus || ''}
        newStatusValue={pendingChange?.newStatus}
        initialResponsibleId={pendingChange ? demands.find(d => d.id === pendingChange.id)?.responsibleId : undefined}
        enableResponsibleSelection={true}
      />

      <CompletionTypeModal
        isOpen={isCompletionModalOpen}
        onClose={handleCancelCompletion}
        onConfirmSuccess={handleConfirmCompletionSuccess}
        onConfirmWithRestriction={handleConfirmCompletionWithRestriction}
      />

      <ActionBlockedModal
        isOpen={isActionBlockedModalOpen}
        onClose={() => setIsActionBlockedModalOpen(false)}
        blockedStatusLabel={blockedActionData?.statusLabel || ''}
        incompleteTratativas={blockedActionData?.tratativas || []}
      />
    </DndContext>
  );
};
