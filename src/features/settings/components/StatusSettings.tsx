import React, { useState } from "react";
import Swal from "sweetalert2";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useAppStore, Option } from "../../../shared/store/appStore";
import Button from "../../../shared/components/ui/button/Button";
import Input from "../../../shared/components/form/input/InputField";
import Select from "../../../shared/components/form/Select";
import Badge from "../../../shared/components/ui/badge/Badge";
import { PencilIcon, TrashBinIcon, CheckLineIcon, CloseLineIcon, PlusIcon } from "../../../shared/icons";
import { SortableItem } from "../../../shared/components/ui/sortable/SortableItem";

import { generateSlug } from "../../../shared/utils/stringUtils";

export const StatusSettings: React.FC = () => {
  const { statusOptions, addStatus, removeStatus, updateStatus, reorderStatus } = useAppStore();
  const [newStatus, setNewStatus] = useState("");
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editBadgeText, setEditBadgeText] = useState("");
  const [editBadgeColor, setEditBadgeColor] = useState<"primary" | "success" | "error" | "warning" | "info" | "light" | "dark">("primary");
  const [slugEditedManually, setSlugEditedManually] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = statusOptions.findIndex((item) => item.value === active.id);
      const newIndex = statusOptions.findIndex((item) => item.value === over.id);
      reorderStatus(arrayMove(statusOptions, oldIndex, newIndex));
    }
  };

  const handleAdd = () => {
    if (!newStatus.trim()) return;
    
    const value = generateSlug(newStatus);

    const option: Option = { value, label: newStatus };
    try {
      addStatus(option);
      setNewStatus("");
    } catch (error: any) {
        Swal.fire({
            title: "Erro",
            text: error.message,
            icon: "error",
            timer: 2000,
            showConfirmButton: false,
        });
    }
  };

  const handleEditStart = (option: Option) => {
    // We allow editing badges for default statuses now, but we must be careful not to change their slug.
    setEditingStatus(option.value);
    setEditLabel(option.label);
    setEditSlug(option.value);
    setEditBadgeText(option.badge?.text || "");
    const color = option.badge?.color;
    setEditBadgeColor((color as "primary" | "success" | "error" | "warning" | "info" | "light" | "dark") || "primary");
    setSlugEditedManually(false);
  };

  const handleEditCancel = () => {
    setEditingStatus(null);
    setEditLabel("");
    setEditSlug("");
    setEditBadgeText("");
    setEditBadgeColor("primary");
    setSlugEditedManually(false);
  };

  const handleEditSave = (originalValue: string) => {
    if (!editLabel.trim() || !editSlug.trim()) return;

    // Validate slug format
    const formattedSlug = generateSlug(editSlug);

    const badge = editBadgeText.trim() ? {
        text: editBadgeText,
        color: editBadgeColor
    } : undefined;

    try {
        updateStatus(originalValue, editLabel, formattedSlug, badge);
        setEditingStatus(null);
        setEditLabel("");
        setEditSlug("");
        setEditBadgeText("");
        setEditBadgeColor("primary");
        setSlugEditedManually(false);
    } catch (error: any) {
        Swal.fire({
            title: "Erro",
            text: error.message,
            icon: "error",
            timer: 2000,
            showConfirmButton: false,
        });
    }
  };

  const handleRemove = (value: string) => {
    if (value === "em-analise" || value === "concluido") {
      Swal.fire({
        title: "Ação não permitida",
        text: "Este status padrão não pode ser removido.",
        icon: "warning",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    Swal.fire({
      title: "Tem certeza?",
      text: "Você não poderá reverter isso!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          removeStatus(value);
          Swal.fire({
            title: "Excluído!",
            text: "O status foi removido.",
            icon: "success",
            showConfirmButton: false,
            timer: 2000,
          });
        } catch (error: any) {
           Swal.fire({
            title: "Erro",
            text: error.message,
            icon: "error",
            timer: 2000,
            showConfirmButton: false,
        });
        }
      }
    });
  };

  const isDefaultStatus = (value: string) => {
    return value === "em-analise" || value === "concluido";
  };

  const badgeColorOptions = [
    { value: 'primary', label: 'Primary (Azul)' },
    { value: 'success', label: 'Success (Verde)' },
    { value: 'error', label: 'Error (Vermelho)' },
    { value: 'warning', label: 'Warning (Amarelo)' },
    { value: 'info', label: 'Info (Ciano)' },
    { value: 'light', label: 'Light (Cinza Claro)' },
    { value: 'dark', label: 'Dark (Cinza Escuro)' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gerenciar Status
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Adicione, edite e reordene os status das demandas.
            </p>
          </div>
          <div className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
            {statusOptions.length} status
          </div>
        </div>
        
        <div className="mb-8 flex gap-3">
          <div className="relative flex-1">
            <Input
              placeholder="Nome do novo status..."
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="pl-4 pr-4"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2 px-6">
            <PlusIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>

        <div className="space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={statusOptions.map((opt) => opt.value)}
              strategy={verticalListSortingStrategy}
            >
              {statusOptions.map((option) => (
                <SortableItem key={option.value} id={option.value}>
                  <div className={`group relative flex w-full items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4 transition-all hover:border-brand-200 hover:bg-white hover:shadow-md dark:border-gray-800 dark:bg-gray-800/50 dark:hover:border-gray-700 dark:hover:bg-gray-800`}>
                    {editingStatus === option.value ? (
                      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Nome do Status
                                    </label>
                                    <Input
                                        value={editLabel}
                                        onChange={(e) => {
                                            const newLabel = e.target.value;
                                            setEditLabel(newLabel);
                                            if (!slugEditedManually) {
                                                setEditSlug(generateSlug(newLabel));
                                            }
                                        }}
                                        placeholder="Ex: Em Progresso"
                                        autoFocus
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Slug (ID)
                                    </label>
                                    <div className="flex items-center rounded-md border border-gray-200 bg-gray-50 px-3 dark:border-gray-700 dark:bg-gray-900">
                                        <span className="text-gray-400">/</span>
                                        <input
                                            value={editSlug}
                                            onChange={(e) => {
                                                setEditSlug(e.target.value);
                                                setSlugEditedManually(true);
                                            }}
                                            disabled={isDefaultStatus(option.value)}
                                            placeholder="slug-do-status"
                                            className={`flex-1 bg-transparent py-2 pl-1 text-xs font-mono text-gray-600 focus:outline-none dark:text-gray-300 ${isDefaultStatus(option.value) ? 'cursor-not-allowed opacity-50' : ''}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Configuração do Badge
                                </h4>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Texto do Badge (Opcional)
                                        </label>
                                        <Input
                                            value={editBadgeText}
                                            onChange={(e) => setEditBadgeText(e.target.value)}
                                            placeholder="Ex: Novo"
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Cor do Badge
                                        </label>
                                        <Select
                                            options={badgeColorOptions}
                                            value={editBadgeColor}
                                            onChange={(value) => setEditBadgeColor(value as any)}
                                            className="text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 sm:flex-col sm:border-l sm:border-gray-200 sm:pl-4 sm:dark:border-gray-700">
                            <button
                              onClick={() => handleEditSave(option.value)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 transition-colors hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                              title="Salvar alterações"
                            >
                              <CheckLineIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                              title="Cancelar edição"
                            >
                              <CloseLineIcon className="h-4 w-4" />
                            </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                {option.label}
                                </span>
                                {isDefaultStatus(option.value) && (
                                    <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                        Padrão
                                    </span>
                                )}
                                {option.badge && option.badge.text && (
                                    <Badge color={option.badge.color || "primary"} variant="light" size="sm">
                                        {option.badge.text}
                                    </Badge>
                                )}
                            </div>
                            <span className="inline-flex w-fit items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                              {option.value}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                          <button
                            onClick={() => handleEditStart(option)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 dark:hover:text-brand-400"
                            title="Editar status"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemove(option.value)}
                            disabled={isDefaultStatus(option.value)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 ${isDefaultStatus(option.value) ? 'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-gray-400' : ''}`}
                            title={isDefaultStatus(option.value) ? "Status padrão não pode ser excluído" : "Excluir status"}
                          >
                            <TrashBinIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
          
          {statusOptions.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="mb-3 rounded-full bg-gray-100 p-3 dark:bg-gray-800">
                <PlusIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Nenhum status encontrado
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comece adicionando um novo status acima.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
