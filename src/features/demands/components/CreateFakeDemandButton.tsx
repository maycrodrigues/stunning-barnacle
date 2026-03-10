import React, { useState } from "react";
import Button from "../../../shared/components/ui/button/Button";
import { useAppStore } from "../../../shared/store/appStore";
import { useContactsStore } from "../../contacts/store/contactsStore";
import { DemandFormData } from "../types";
import { ContactFormData } from "../../contacts/types";
import { Loader } from "../../../shared/components/ui/loader";

interface CreateFakeDemandButtonProps {
  className?: string;
}

const ARACRUZ_NEIGHBORHOODS = [
  "Centro", "Bela Vista", "Jequitibá", "Coqueiral", "Barra do Riacho",
  "Vila do Riacho", "Santa Cruz", "Mar Azul", "Praia dos Padres", "Sauê",
  "Guaxindiba", "Morobá", "Jardim", "São Marcos", "Novo Jequitibá",
  "Itaputera", "Segredo", "São José", "Guanabara", "De Carli"
];

const FIRST_NAMES = [
  "João", "Maria", "Pedro", "Ana", "Carlos", "Luciana", "Marcos", "Fernanda",
  "Rafael", "Juliana", "Bruno", "Patricia", "Gustavo", "Camila", "Rodrigo",
  "Amanda", "Lucas", "Beatriz", "Felipe", "Mariana"
];

const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Pereira", "Lima", "Ferreira",
  "Costa", "Rodrigues", "Almeida", "Nascimento", "Alves", "Carvalho",
  "Araujo", "Ribeiro", "Goncalves", "Lopes", "Mendes", "Barbosa", "Freitas"
];

export const CreateFakeDemandButton: React.FC<CreateFakeDemandButtonProps> = ({ className }) => {
  const { addDemand, categoryOptions, urgencyOptions, defaultLocation } = useAppStore();
  const { addContact } = useContactsStore();
  const [loading, setLoading] = useState(false);

  const generateFakeData = async () => {
    const randomId = Math.floor(Math.random() * 10000);
    
    // Generate Fake Contact Data
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const fullName = `${firstName} ${lastName}`;
    const neighborhood = ARACRUZ_NEIGHBORHOODS[Math.floor(Math.random() * ARACRUZ_NEIGHBORHOODS.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomId}@example.com`;
    const phone = `(27) 9${Math.floor(Math.random() * 90000 + 10000)}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const contactData: ContactFormData = {
      name: fullName,
      email: email,
      phone: phone,
      neighborhood: neighborhood,
      address: `Rua Exemplo, ${Math.floor(Math.random() * 1000)}, ${neighborhood}`,
      notes: "Gerado automaticamente",
      isVoter: Math.random() > 0.3, // 70% chance of being a voter
      politicalSpectrum: Math.random() > 0.5 ? (Math.random() > 0.5 ? "Left" : "Right") : "Center",
    };

    // Create Contact first
    await addContact(contactData);

    // Generate Fake Demand Data
    const randomCategory = categoryOptions.length > 0 
      ? categoryOptions[Math.floor(Math.random() * categoryOptions.length)].value 
      : "infraestrutura";
      
    const randomUrgency = urgencyOptions.length > 0
      ? urgencyOptions[Math.floor(Math.random() * urgencyOptions.length)].value
      : "baixa";

    // Coordinates around default location
    const randomLat = defaultLocation.lat + (Math.random() - 0.5) * 0.05; // Slightly tighter radius (approx 5km)
    const randomLng = defaultLocation.lng + (Math.random() - 0.5) * 0.05;

    const titles = [
      "Buraco na rua", "Lâmpada queimada", "Lixo acumulado", 
      "Árvore caída", "Bueiro entupido", "Sinalização danificada",
      "Solicitação de poda", "Fiscalização de obra", "Limpeza de terreno",
      "Manutenção de praça"
    ];
    
    const title = `${titles[Math.floor(Math.random() * titles.length)]} - #${randomId}`;

    const demandData: DemandFormData = {
      title: title,
      description: `Esta é uma demanda de teste gerada automaticamente para ${fullName} do bairro ${neighborhood}.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      category: randomCategory,
      urgency: randomUrgency,
      requesterName: fullName, // Link by name
      requesterContact: email, // Link by email
      location: {
        lat: randomLat,
        lng: randomLng
      },
      deadline: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 15 * 24 * 60 * 60 * 1000) : undefined,
      status: "nova"
    };

    // Create Demand
    await addDemand(demandData);
  };

  const handleCreateFake = async () => {
    setLoading(true);
    try {
      await generateFakeData();
    } catch (error) {
      console.error("Erro ao criar dados fake:", error);
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
