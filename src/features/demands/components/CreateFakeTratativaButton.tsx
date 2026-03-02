import React, { useState } from "react";
import { ulid } from "ulid";
import Swal from "sweetalert2";
import Button from "../../../shared/components/ui/button/Button";
import { useAppStore, Demand } from "../../../shared/store/appStore";
import { DemandTratativa } from "../../../shared/services/db";
import { Loader } from "../../../shared/components/ui/loader";

interface CreateFakeTratativaButtonProps {
  demand: Demand;
  onUpdate: () => void;
  className?: string;
  disabled?: boolean;
}

export const CreateFakeTratativaButton: React.FC<CreateFakeTratativaButtonProps> = ({ 
  demand, 
  onUpdate,
  className,
  disabled
}) => {
  const { tratativaOptions, updateDemand } = useAppStore();
  const [loading, setLoading] = useState(false);

  const generateFakeTratativa = (): DemandTratativa => {
    // Pegar um tipo de tratativa aleatório ou usar padrão se vazio
    // Se não houver opções, cria um ID fictício, mas idealmente deve existir configuração
    const randomType = tratativaOptions.length > 0 
      ? tratativaOptions[Math.floor(Math.random() * tratativaOptions.length)].id
      : "general"; 
      
    const randomId = Math.floor(Math.random() * 1000);
    
    const actions = [
      "Ligação realizada", "Email enviado", "Ofício encaminhado", 
      "Visita técnica", "Reunião agendada", "Documento analisado",
      "Solicitação de verba", "Pedido de material", "Consulta jurídica",
      "Parecer técnico"
    ];
    
    const title = `${actions[Math.floor(Math.random() * actions.length)]} - #${randomId}`;
    const isCompleted = Math.random() > 0.7; // 30% de chance de estar concluída

    return {
      id: ulid(),
      tratativaId: randomType,
      title: title,
      description: `Registro automático de tratativa (${title}). \n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      completed: isCompleted,
      createdAt: new Date().toISOString(),
      completedAt: isCompleted ? new Date().toISOString() : undefined
    };
  };

  const handleCreateFake = async () => {
    setLoading(true);
    try {
      const newTratativa = generateFakeTratativa();
      const currentTratativas = demand.tratativas || [];
      
      let statusUpdate = {};
      let justification: string | undefined = undefined;

      // First add the tratativa
      await updateDemand(demand.id, {
        tratativas: [newTratativa, ...currentTratativas],
      });
      
      onUpdate();

      // Then check for status change
      const restrictedStatus = ["em-processo", "em-processo-fora-do-prazo"];
      if (!newTratativa.completed && restrictedStatus.includes(demand.status)) {
        await Swal.fire({
          title: "Alteração de Status (Fake)",
          text: " 'Em Andamento', pois a tratativa fake gerada está em aberto.",
          icon: "info",
          confirmButtonText: "Confirmar",
          confirmButtonColor: "#3B82F6",
        });

        statusUpdate = { status: "acoes-do-gabinete" };
        justification = "Essa demanda voltou pois contém Tratativas em aberto";

        await updateDemand(demand.id, {
            ...statusUpdate,
        }, justification);
        onUpdate();
      }
    } catch (error) {
      console.error("Erro ao criar tratativa fake:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      size="sm" 
      variant="outline" 
      onClick={handleCreateFake} 
      className={className}
      disabled={loading || disabled}
    >
      {loading ? (
        <>
            <Loader size="sm" className="mr-2" />
            Gerando...
        </>
      ) : "Nova Tratativa Fake"}
    </Button>
  );
};
