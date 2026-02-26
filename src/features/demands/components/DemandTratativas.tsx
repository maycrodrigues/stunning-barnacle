import React, { useState } from "react";
import { ulid } from "ulid";
import Swal from "sweetalert2";
import { useAppStore, Demand } from "../../../shared/store/appStore";
import { DemandTratativa } from "../../../shared/services/db";
import Button from "../../../shared/components/ui/button/Button";
import Input from "../../../shared/components/form/input/InputField";
import Select from "../../../shared/components/form/Select";
import { Modal } from "../../../shared/components/ui/modal";
import { PlusIcon, CheckLineIcon, TrashBinIcon, CloseLineIcon, TaskIcon } from "../../../shared/icons";
import { CreateFakeTratativaButton } from "./CreateFakeTratativaButton";

interface DemandTratativasProps {
  demand: Demand;
  onUpdate: () => void;
}

export const DemandTratativas: React.FC<DemandTratativasProps> = ({
  demand,
  onUpdate,
}) => {
  const { tratativaOptions, updateDemand } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const isConcluded = demand.status === "concluido";

  // Form State
  const [selectedType, setSelectedType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setSelectedType("");
    setTitle("");
    setDescription("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async () => {
    if (!selectedType || !title.trim()) {
        Swal.fire({
            title: "Erro",
            text: "Preencha o tipo e o título da tratativa.",
            icon: "error",
            timer: 2000,
            showConfirmButton: false,
        });
        return;
    }

    try {
      const newTratativa: DemandTratativa = {
        id: ulid(),
        tratativaId: selectedType,
        title,
        description,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const currentTratativas = demand.tratativas || [];
      let statusUpdate = {};
      let justification: string | undefined = undefined;

      // First, add the tratativa
      await updateDemand(demand.id, {
        tratativas: [newTratativa, ...currentTratativas], // Add to top
      });

      handleCloseModal();
      onUpdate();

      // Then check for status restriction
      const restrictedStatus = ["em-processo", "em-processo-fora-do-prazo"];
      if (restrictedStatus.includes(demand.status)) {
        await Swal.fire({
          title: "Alteração de Status Necessária",
          text: "A demanda voltará para o status 'Em Andamento', pois não é permitido manter o status atual com novas tratativas em aberto.",
          icon: "info",
          confirmButtonText: "Confirmar",
          confirmButtonColor: "#3B82F6",
        });

        statusUpdate = { status: "em-andamento" };
        justification = "Essa demanda voltou pois contém Tratativas em aberto";
        
        await updateDemand(demand.id, {
            ...statusUpdate,
        }, justification);
        onUpdate();
      }
      
      Swal.fire({
        title: "Sucesso",
        text: "Tratativa adicionada com sucesso!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error adding tratativa:", error);
      Swal.fire({
        title: "Erro",
        text: "Erro ao adicionar tratativa.",
        icon: "error",
      });
    }
  };

  const handleToggleComplete = async (tratativaId: string, currentStatus: boolean) => {
    try {
      const currentTratativas = demand.tratativas || [];
      const updatedTratativas = currentTratativas.map((t) =>
        t.id === tratativaId
          ? {
              ...t,
              completed: !currentStatus,
              completedAt: !currentStatus ? new Date().toISOString() : undefined,
            }
          : t
      );

      await updateDemand(demand.id, {
        tratativas: updatedTratativas,
      });
      onUpdate();
    } catch (error) {
      console.error("Error toggling tratativa:", error);
    }
  };

  const handleRemove = async (tratativaId: string) => {
    Swal.fire({
      title: "Tem certeza?",
      text: "Você não poderá reverter isso!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const currentTratativas = demand.tratativas || [];
          const updatedTratativas = currentTratativas.filter(
            (t) => t.id !== tratativaId
          );

          await updateDemand(demand.id, {
            tratativas: updatedTratativas,
          });
          onUpdate();
          
          Swal.fire({
            title: "Excluído!",
            text: "A tratativa foi removida.",
            icon: "success",
            showConfirmButton: false,
            timer: 1500,
          });
        } catch (error) {
            console.error("Error removing tratativa:", error);
            Swal.fire({
                title: "Erro",
                text: "Erro ao remover tratativa.",
                icon: "error",
            });
        }
      }
    });
  };

  const getTypeLabel = (id: string) => {
    const type = tratativaOptions.find((t) => t.id === id);
    return type ? type.title : "Desconhecido";
  };
  
  const getTypeBadgeColor = (typeId: string) => {
      // Logic to assign colors based on type or just random/hash
      // For now, return a default style or map specific types if known
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  const typeOptions = tratativaOptions.map(t => ({
      value: t.id,
      label: t.title
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
            <TaskIcon className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tratativas
            </h3>
        </div>
        <div className="flex items-center gap-2">
            <CreateFakeTratativaButton demand={demand} onUpdate={onUpdate} disabled={isConcluded} />
            <Button onClick={handleOpenModal} size="sm" className="gap-2" disabled={isConcluded}>
              <PlusIcon className="h-4 w-4" />
              Nova Tratativa
            </Button>
        </div>
      </div>

      <div className="p-6">
        {(!demand.tratativas || demand.tratativas.length === 0) ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-8 text-center dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma tratativa registrada.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenModal}
              disabled={isConcluded}
              className="mt-2 text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Adicionar a primeira
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {demand.tratativas.map((tratativa) => (
              <div
                key={tratativa.id}
                className={`group flex items-start gap-3 rounded-lg border p-4 transition-all ${
                  tratativa.completed
                    ? "border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50"
                    : "border-gray-200 bg-white hover:border-brand-200 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                }`}
              >
                <div className="mt-0.5">
                  <button
                    onClick={() => handleToggleComplete(tratativa.id, tratativa.completed)}
                    disabled={isConcluded}
                    className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                      isConcluded 
                        ? "cursor-not-allowed opacity-50 border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                        : tratativa.completed
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-gray-300 bg-white hover:border-brand-400 dark:border-gray-600 dark:bg-gray-800"
                    }`}
                  >
                    {tratativa.completed && <CheckLineIcon className="h-3.5 w-3.5" />}
                  </button>
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        <span
                            className={`text-sm font-medium transition-colors ${
                                tratativa.completed
                                ? "text-gray-500 line-through dark:text-gray-500"
                                : "text-gray-900 dark:text-white"
                            }`}
                            >
                            {tratativa.title}
                        </span>
                        <span className={`inline-flex w-fit items-center rounded px-2 py-0.5 text-xs font-medium ${getTypeBadgeColor(tratativa.tratativaId)}`}>
                            {getTypeLabel(tratativa.tratativaId)}
                        </span>
                    </div>
                    {!isConcluded && (
                      <button
                          onClick={() => handleRemove(tratativa.id)}
                          className="opacity-0 transition-opacity group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                          title="Excluir"
                      >
                          <TrashBinIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {tratativa.description && (
                    <p
                      className={`text-sm ${
                        tratativa.completed
                          ? "text-gray-400 dark:text-gray-600"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {tratativa.description}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    {tratativa.completed && tratativa.completedAt ? (
                        <span>Concluído em {new Date(tratativa.completedAt).toLocaleString('pt-BR')}</span>
                    ) : (
                        <span>Criado em {new Date(tratativa.createdAt).toLocaleString('pt-BR')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        className="max-w-lg p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nova Tratativa
          </h3>
          <button
            onClick={handleCloseModal}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <CloseLineIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de Tratativa
            </label>
            <Select
              options={typeOptions}
              value={selectedType}
              onChange={(val) => setSelectedType(val)}
              placeholder="Selecione o tipo..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Título
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ligar para o munícipe"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              placeholder="Detalhes adicionais..."
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Tratativa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
