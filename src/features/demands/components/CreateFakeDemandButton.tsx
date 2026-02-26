import React, { useState } from "react";
import Button from "../../../shared/components/ui/button/Button";
import { useAppStore } from "../../../shared/store/appStore";
import { DemandFormData } from "../types";
import { Loader } from "../../../shared/components/ui/loader";

interface CreateFakeDemandButtonProps {
  className?: string;
}

export const CreateFakeDemandButton: React.FC<CreateFakeDemandButtonProps> = ({ className }) => {
  const { addDemand, categoryOptions, urgencyOptions, defaultLocation } = useAppStore();
  const [loading, setLoading] = useState(false);

  const generateFakeDemand = (): DemandFormData => {
    // Pegar uma categoria aleatória ou usar padrão se vazia
    const randomCategory = categoryOptions.length > 0 
      ? categoryOptions[Math.floor(Math.random() * categoryOptions.length)].value 
      : "infraestrutura"; // Fallback
      
    // Pegar uma urgência aleatória ou usar padrão se vazia
    const randomUrgency = urgencyOptions.length > 0
      ? urgencyOptions[Math.floor(Math.random() * urgencyOptions.length)].value
      : "baixa"; // Fallback

    // Gera coordenadas próximas à localização padrão (aprox +/- 2km)
    // 0.01 grau é aprox 1.1km
    const randomLat = defaultLocation.lat + (Math.random() - 0.5) * 0.10;
    const randomLng = defaultLocation.lng + (Math.random() - 0.5) * 0.10;

    const randomId = Math.floor(Math.random() * 10000);
    
    // Lista de tipos de demandas comuns para parecer mais real
    const titles = [
      "Buraco na rua", "Lâmpada queimada", "Lixo acumulado", 
      "Árvore caída", "Bueiro entupido", "Sinalização danificada",
      "Solicitação de poda", "Fiscalização de obra", "Limpeza de terreno",
      "Manutenção de praça"
    ];
    
    const title = `${titles[Math.floor(Math.random() * titles.length)]} - #${randomId}`;

    return {
      title: title,
      description: `Esta é uma demanda de teste gerada automaticamente (${title}). \n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
      category: randomCategory,
      urgency: randomUrgency,
      requesterName: `Cidadão Teste ${Math.floor(Math.random() * 100)}`,
      requesterContact: `(27) 99999-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      location: {
        lat: randomLat,
        lng: randomLng
      },
      deadline: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 15 * 24 * 60 * 60 * 1000) : undefined,
      status: "nova"
    };
  };

  const handleCreateFake = async () => {
    setLoading(true);
    try {
      const fakeData = generateFakeDemand();
      await addDemand(fakeData);
    } catch (error) {
      console.error("Erro ao criar demanda fake:", error);
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
      disabled={loading}
    >
      {loading ? (
        <>
            <Loader size="sm" className="mr-2" />
            Gerando...
        </>
      ) : "Adicionar Demanda Fake"}
    </Button>
  );
};
