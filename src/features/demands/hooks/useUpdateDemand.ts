import { useState } from "react";
import { DemandFormData } from "../types";
import { useAppStore } from "../../../shared/store/appStore";

export const useUpdateDemand = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateDemandStore = useAppStore((state) => state.updateDemand);

  const updateDemand = async (id: string, data: Partial<DemandFormData>) => {
    setIsLoading(true);
    setError(null);
    try {
      await updateDemandStore(id, data);
      return true;
    } catch (err) {
      setError("Erro ao atualizar demanda. Tente novamente.");
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateDemand,
    isLoading,
    error,
  };
};
