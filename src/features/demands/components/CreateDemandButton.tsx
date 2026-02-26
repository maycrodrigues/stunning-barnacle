import React from "react";
import { useNavigate } from "react-router";
import Button from "../../../shared/components/ui/button/Button";
import { PlusIcon } from "../../../shared/icons";

interface CreateDemandButtonProps {
  className?: string;
}

export const CreateDemandButton: React.FC<CreateDemandButtonProps> = ({ className }) => {
  const navigate = useNavigate();

  return (
    <Button size="sm" onClick={() => navigate("/demands/new")} className={className}>
      Adicionar Nova Demanda
      <PlusIcon className="ml-2 size-5" />
    </Button>
  );
};
