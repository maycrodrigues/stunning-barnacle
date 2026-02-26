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
import { useAppStore } from "../../../shared/store/appStore";
import { Tratativa } from "../../../shared/services/db";
import Button from "../../../shared/components/ui/button/Button";
import Input from "../../../shared/components/form/input/InputField";
import Select from "../../../shared/components/form/Select";
import { PencilIcon, TrashBinIcon, CheckLineIcon, CloseLineIcon, PlusIcon } from "../../../shared/icons";
import { SortableItem } from "../../../shared/components/ui/sortable/SortableItem";
import { ulid } from "ulid";
import { generateSlug } from "../../../shared/utils/stringUtils";

export const TratativaSettings: React.FC = () => {
  const { tratativaOptions, addTratativa, removeTratativa, updateTratativa, reorderTratativas } = useAppStore();
  const [newTratativaTitle, setNewTratativaTitle] = useState("");
  const [newTratativaType, setNewTratativaType] = useState<Tratativa['type']>('text');
  
  const [editingTratativa, setEditingTratativa] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editType, setEditType] = useState<Tratativa['type']>('text');
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
      const oldIndex = tratativaOptions.findIndex((item) => item.id === active.id);
      const newIndex = tratativaOptions.findIndex((item) => item.id === over.id);
      reorderTratativas(arrayMove(tratativaOptions, oldIndex, newIndex));
    }
  };

  const handleAdd = () => {
    if (!newTratativaTitle.trim()) return;
    
    const tratativa: Tratativa = {
      id: ulid(),
      title: newTratativaTitle,
      type: newTratativaType,
      slug: generateSlug(newTratativaTitle)
    };

    try {
      addTratativa(tratativa);
      setNewTratativaTitle("");
      setNewTratativaType('text');
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

  const handleEditStart = (tratativa: Tratativa) => {
    setEditingTratativa(tratativa.id);
    setEditTitle(tratativa.title);
    setEditSlug(tratativa.slug || generateSlug(tratativa.title));
    setEditType(tratativa.type);
    setSlugEditedManually(false);
  };

  const handleEditCancel = () => {
    setEditingTratativa(null);
    setEditTitle("");
    setEditSlug("");
    setEditType('text');
    setSlugEditedManually(false);
  };

  const handleEditSave = (id: string) => {
    if (!editTitle.trim() || !editSlug.trim()) return;

    try {
        updateTratativa(id, editTitle, editType, generateSlug(editSlug));
        setEditingTratativa(null);
        setEditTitle("");
        setEditSlug("");
        setEditType('text');
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

  const handleRemove = (id: string) => {
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
        removeTratativa(id);
        Swal.fire({
          title: "Excluído!",
          text: "A tratativa foi removida.",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    });
  };

  const getTypeLabel = (type: Tratativa['type']) => {
    switch(type) {
      case 'text': return 'Texto Curto';
      case 'number': return 'Número';
      case 'long_text': return 'Texto Longo';
      default: return type;
    }
  };

  const typeOptions = [
    { value: 'text', label: 'Texto Curto' },
    { value: 'number', label: 'Número' },
    { value: 'long_text', label: 'Texto Longo' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gerenciar Tratativas
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Adicione, edite e reordene as tratativas do sistema.
            </p>
          </div>
          <div className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
            {tratativaOptions.length} tratativas
          </div>
        </div>
        
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Nome da tratativa..."
              value={newTratativaTitle}
              onChange={(e) => setNewTratativaTitle(e.target.value)}
              className="pl-4 pr-4"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={typeOptions}
              value={newTratativaType}
              onChange={(value) => setNewTratativaType(value as Tratativa['type'])}
              placeholder="Selecione o tipo"
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
              items={tratativaOptions.map((opt) => opt.id)}
              strategy={verticalListSortingStrategy}
            >
              {tratativaOptions.map((tratativa) => (
                <SortableItem key={tratativa.id} id={tratativa.id}>
                  <div className="group relative flex w-full items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4 transition-all hover:border-brand-200 hover:bg-white hover:shadow-md dark:border-gray-800 dark:bg-gray-800/50 dark:hover:border-gray-700 dark:hover:bg-gray-800">
                    {editingTratativa === tratativa.id ? (
                      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="sm:col-span-1">
                                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Título
                                    </label>
                                    <Input
                                        value={editTitle}
                                        onChange={(e) => {
                                            const newTitle = e.target.value;
                                            setEditTitle(newTitle);
                                            if (!slugEditedManually) {
                                                setEditSlug(generateSlug(newTitle));
                                            }
                                        }}
                                        autoFocus
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="sm:col-span-1">
                                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Slug
                                    </label>
                                    <Input
                                        value={editSlug}
                                        onChange={(e) => {
                                            setEditSlug(e.target.value);
                                            setSlugEditedManually(true);
                                        }}
                                        className="h-9 text-sm font-mono text-gray-600 dark:text-gray-300"
                                        placeholder="slug-da-tratativa"
                                    />
                                </div>
                                <div className="sm:col-span-1">
                                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Tipo
                                    </label>
                                    <Select
                                        options={typeOptions}
                                        value={editType}
                                        onChange={(value) => setEditType(value as Tratativa['type'])}
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleEditSave(tratativa.id)}
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
                        <div className="flex flex-1 items-center gap-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-700 dark:ring-gray-600">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                              {tratativa.title.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {tratativa.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">/{tratativa.slug}</span>
                                <span>•</span>
                                <span>Tipo: {getTypeLabel(tratativa.type)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            onClick={() => handleEditStart(tratativa)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 dark:hover:text-brand-400"
                            title="Editar tratativa"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemove(tratativa.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            title="Excluir tratativa"
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

          {tratativaOptions.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12 text-center dark:border-gray-700">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <PlusIcon className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                Nenhuma tratativa
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comece adicionando uma nova tratativa acima.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
