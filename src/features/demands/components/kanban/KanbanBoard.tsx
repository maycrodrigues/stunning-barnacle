import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
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
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { Demand, Option, useAppStore } from "../../../../shared/store/appStore";
import { useMemberStore } from "../../../members/store/memberStore";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanItem, KanbanCard } from "./KanbanItem";
import { createPortal } from "react-dom";
import { DeadlineModal } from "../DeadlineModal";
import { StatusChangeModal } from "../StatusChangeModal";
import { CompletionTypeModal } from "../CompletionTypeModal";
import { ActionBlockedModal } from "../ActionBlockedModal";
import Swal from "sweetalert2";

interface KanbanBoardProps {
  demands: Demand[];
  statusOptions: Option[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ demands, statusOptions }) => {
  const { updateDemand } = useAppStore();
  const { loadMembers } = useMemberStore();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);
  const [activeOverId, setActiveOverId] = useState<string | null>(null);
  
  // Ref to keep demands up to date in drag callbacks
  const demandsRef = useRef(demands);
  useEffect(() => {
    demandsRef.current = demands;
  }, [demands]);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState<{ id: string; newStatus: string; oldStatus: string } | null>(null);

  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState<{ id: string; oldStatus: string } | null>(null);

  const [isActionBlockedModalOpen, setIsActionBlockedModalOpen] = useState(false);
  const [blockedActionData, setBlockedActionData] = useState<{ statusLabel: string; tratativas: any[] } | null>(null);

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

      if (pendingChange && pendingChange.id === selectedDemandId && pendingChange.newStatus === 'em-processo') {
        setIsDeadlineModalOpen(false);
        setTimeout(() => {
          setIsStatusModalOpen(true);
        }, 100);
      } else {
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
      }
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

  const handleCancelDeadline = () => {
    if (pendingChange && pendingChange.newStatus === 'em-processo') {
      setPendingChange(null);
    }
    handleCloseDeadlineModal();
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 5, // Start dragging after 5px movement
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group demands by status
  const demandsByStatus = useMemo(() => {
    const grouped: Record<string, Demand[]> = {};
    statusOptions.forEach((status) => {
      grouped[status.value] = [];
    });
    demands.forEach((demand) => {
        if (grouped[demand.status || ""]) {
             grouped[demand.status || ""].push(demand);
        } else if (demand.status && grouped[demand.status]) {
            grouped[demand.status].push(demand);
        }
    });
    return grouped;
  }, [demands, statusOptions]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveOverId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setActiveOverId(over ? (over.id as string) : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveOverId(null);

    if (!over) {
        setActiveId(null);
        return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) {
        setActiveId(null);
        return;
    }

    // Use store state directly to avoid stale closures
    const currentDemands = useAppStore.getState().demands;
    const activeDemand = currentDemands.find((d) => d.id === activeId);
    
    if (!activeDemand) {
        setActiveId(null);
        return;
    }

    let newStatus = "";

    // Check if dropped on a column
    const isOverColumn = statusOptions.some((s) => s.value === overId);
    if (isOverColumn) {
      newStatus = overId;
    } else {
      // Check if dropped on another item
      const overDemand = currentDemands.find((d) => d.id === overId);
      if (overDemand) {
        newStatus = overDemand.status || "";
      }
    }

    if (newStatus && newStatus !== activeDemand.status) {
      // Check for incomplete tratativas before allowing status change
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

      if (newStatus === 'em-processo' && !activeDemand.deadline) {
        setSelectedDemandId(activeId);
        setIsDeadlineModalOpen(true);
      } else {
        setIsStatusModalOpen(true);
      }
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
          opacity: '0',
        },
      },
    }),
    duration: 0,
    easing: 'linear',
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[calc(100vh-200px)] w-full gap-4 pb-4">
        {statusOptions.map((status) => (
          <div key={status.value} className="h-full flex-1 min-w-0">
             <KanbanColumn
                status={status}
                demands={demandsByStatus[status.value] || []}
                onOpenDeadline={handleOpenDeadlineModal}
             />
          </div>
        ))}
      </div>

      {createPortal(
        <DragOverlay dropAnimation={dropAnimation} zIndex={1000}>
          {activeDemand ? (
            <KanbanCard 
              demand={activeDemand} 
              isOverlay
            />
          ) : null}
        </DragOverlay>,
        document.body
      )}

      <DeadlineModal
        isOpen={isDeadlineModalOpen}
        onClose={handleCancelDeadline}
        onSave={handleSaveDeadline}
        initialDate={selectedDemandDate}
        isLoading={isSavingDeadline}
      />

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
