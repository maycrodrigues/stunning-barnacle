import { useState } from "react";
import { DemandFormData } from "../types";
import { useAppStore } from "../../../shared/store/appStore";

export const useCreateDemand = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addDemand = useAppStore((state) => state.addDemand);

  const createDemand = async (data: DemandFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call delay if needed or remove it
      // await new Promise((resolve) => setTimeout(resolve, 500));
      
      await addDemand(data);
      console.log("Demand created and saved to DB:", data);
      return true;
    } catch (err) {
      setError("Erro ao criar demanda. Tente novamente.");
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createDemand,
    isLoading,
    error,
  };
};
