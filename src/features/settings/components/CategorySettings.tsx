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
import { PencilIcon, TrashBinIcon, CheckLineIcon, CloseLineIcon, DragHandleIcon, PlusIcon } from "../../../shared/icons";
import { SortableItem } from "../../../shared/components/ui/sortable/SortableItem";

import { generateSlug } from "../../../shared/utils/stringUtils";

export const CategorySettings: React.FC = () => {
  const { categoryOptions, addCategory, removeCategory, updateCategory, reorderCategories } = useAppStore();
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editSlug, setEditSlug] = useState("");
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
      const oldIndex = categoryOptions.findIndex((item) => item.value === active.id);
      const newIndex = categoryOptions.findIndex((item) => item.value === over.id);
      reorderCategories(arrayMove(categoryOptions, oldIndex, newIndex));
    }
  };

  const handleAdd = () => {
    if (!newCategory.trim()) return;
    
    const value = generateSlug(newCategory);

    const option: Option = { value, label: newCategory };
    try {
      addCategory(option);
      setNewCategory("");
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
    setEditingCategory(option.value);
    setEditLabel(option.label);
    setEditSlug(option.value);
    setSlugEditedManually(false);
  };

  const handleEditCancel = () => {
    setEditingCategory(null);
    setEditLabel("");
    setEditSlug("");
    setSlugEditedManually(false);
  };

  const handleEditSave = (originalValue: string) => {
    if (!editLabel.trim() || !editSlug.trim()) return;

    // Validate slug format
    const formattedSlug = generateSlug(editSlug);

    try {
        updateCategory(originalValue, editLabel, formattedSlug);
        setEditingCategory(null);
        setEditLabel("");
        setEditSlug("");
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
        removeCategory(value);
        Swal.fire({
          title: "Excluído!",
          text: "A categoria foi removida.",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gerenciar Categorias
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Adicione, edite e reordene as categorias do sistema.
            </p>
          </div>
          <div className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
            {categoryOptions.length} categorias
          </div>
        </div>
        
        <div className="mb-8 flex gap-3">
          <div className="relative flex-1">
            <Input
              placeholder="Nome da nova categoria..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
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
              items={categoryOptions.map((opt) => opt.value)}
              strategy={verticalListSortingStrategy}
            >
              {categoryOptions.map((option) => (
                <SortableItem key={option.value} id={option.value}>
                  <div className="group relative flex w-full items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4 transition-all hover:border-brand-200 hover:bg-white hover:shadow-md dark:border-gray-800 dark:bg-gray-800/50 dark:hover:border-gray-700 dark:hover:bg-gray-800">
                    {editingCategory === option.value ? (
                      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex-1 space-y-3">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                Nome da Categoria
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
                                placeholder="Ex: Educação"
                                autoFocus
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                Slug (Identificador único)
                              </label>
                              <div className="flex items-center rounded-md border border-gray-200 bg-gray-50 px-3 dark:border-gray-700 dark:bg-gray-900">
                                <span className="text-gray-400">/</span>
                                <input
                                  value={editSlug}
                                  onChange={(e) => {
                                    setEditSlug(e.target.value);
                                    setSlugEditedManually(true);
                                  }}
                                  placeholder="slug-da-categoria"
                                  className="flex-1 bg-transparent py-2 pl-1 text-xs font-mono text-gray-600 focus:outline-none dark:text-gray-300"
                                />
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
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {option.label}
                            </span>
                            <span className="inline-flex w-fit items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                              {option.value}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                          <button
                            onClick={() => handleEditStart(option)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 dark:hover:text-brand-400"
                            title="Editar categoria"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemove(option.value)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            title="Excluir categoria"
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
          
          {categoryOptions.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="mb-3 rounded-full bg-gray-100 p-3 dark:bg-gray-800">
                <PlusIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Nenhuma categoria encontrada
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comece adicionando uma nova categoria acima.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
