import React, { useState } from "react";
import Swal from "sweetalert2";
import { Trash2 } from "lucide-react";
import Button from "../../../shared/components/ui/button/Button";
import { useAppStore } from "../../../shared/store/appStore";
import { Loader } from "../../../shared/components/ui/loader";

interface DeleteAllDemandsButtonProps {
  className?: string;
}

export const DeleteAllDemandsButton: React.FC<DeleteAllDemandsButtonProps> = ({ className }) => {
  const { clearDemands, demands } = useAppStore();
  const [loading, setLoading] = useState(false);

  const handleDeleteAll = async () => {
    if (demands.length === 0) {
      Swal.fire("Aviso", "Não há demandas para excluir.", "info");
      return;
    }

    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Esta ação excluirá TODAS as demandas permanentemente. Não é possível desfazer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, excluir tudo",
      cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await clearDemands();
        Swal.fire(
          "Excluído!",
          "Todas as demandas foram excluídas.",
          "success"
        );
      } catch (error) {
        console.error("Erro ao excluir demandas:", error);
        Swal.fire(
          "Erro",
          "Falha ao excluir demandas.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Button 
      size="sm" 
      variant="outline" 
      onClick={handleDeleteAll} 
      className={`text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20 ${className}`}
      disabled={loading || demands.length === 0}
    >
      {loading ? (
        <>
            <Loader size="sm" className="mr-2" />
            Excluindo...
        </>
      ) : (
        <>
            <Trash2 size={16} className="mr-2" />
            Excluir Todas
        </>
      )}
    </Button>
  );
};
