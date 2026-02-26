import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Demand, Option } from "../../../../shared/store/appStore";
import { KanbanItem } from "./KanbanItem";
import Badge from "../../../../shared/components/ui/badge/Badge";

interface KanbanColumnProps {
  status: Option;
  demands: Demand[];
  onOpenDeadline: (demand: Demand) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, demands, onOpenDeadline }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status.value,
  });

  return (
    <div className={`flex h-full flex-col rounded-xl border p-4 transition-colors duration-200 ${
        isOver 
            ? "bg-brand-50/50 border-brand-200 dark:bg-brand-900/10 dark:border-brand-800" 
            : "bg-gray-50/50 border-gray-200 dark:bg-white/[0.03] dark:border-gray-800"
    }`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800 dark:text-white">
            {status.label}
          </h3>
          {status.badge?.text && (
            <Badge
              color={status.badge.color || "primary"}
              variant="light"
              size="sm"
            >
              {status.badge.text}
            </Badge>
          )}
        </div>
        <Badge
            color="light"
            variant="light"
            size="sm"
        >
            {demands.length}
        </Badge>
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[100px]">
        <SortableContext
          id={status.value}
          items={demands.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            {demands.map((demand) => (
                <KanbanItem key={demand.id} demand={demand} onOpenDeadline={onOpenDeadline} />
            ))}
          </div>
        </SortableContext>
        {demands.length === 0 && (
            <div className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <span className="text-sm text-gray-400">Vazio</span>
            </div>
        )}
      </div>
    </div>
  );
};
