import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../../shared/components/common/PageMeta";
import PageBreadcrumb from "../../../shared/components/common/PageBreadCrumb";
import { Loader } from "../../../shared/components/ui/loader";
import { DemandForm } from "../components/DemandForm";
import { useUpdateDemand } from "../hooks/useUpdateDemand";
import { DemandFormData } from "../types";
import { getDemandById } from "../../../shared/services/db";

export const DemandEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateDemand, isLoading: isSaving } = useUpdateDemand();
  const [initialValues, setInitialValues] = useState<Partial<DemandFormData> | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const loadDemand = async () => {
      if (!id) return;
      try {
        const demand = await getDemandById(id);
        if (demand) {
          if (demand.status === 'concluido') {
            navigate("/demands/list");
            return;
          }
          setInitialValues(demand);
        } else {
          // Demand not found
          navigate("/demands/list");
        }
      } catch (error) {
        console.error("Failed to load demand", error);
        navigate("/demands/list");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadDemand();
  }, [id, navigate]);

  const handleSuccess = () => {
    navigate("/demands/list");
  };

  const handleCancel = () => {
    navigate("/demands/list");
  };

  const handleSubmit = async (data: DemandFormData) => {
    if (!id) return;
    const success = await updateDemand(id, data);
    if (success) {
      handleSuccess();
    }
  };

  if (isLoadingData) {
    return (
      <Loader className="h-64" />
    );
  }

  return (
    <>
      <PageMeta
        title="Editar Demanda | Gabinete Online"
        description="Editar uma demanda existente"
      />
      <PageBreadcrumb pageTitle="Editar Demanda" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {initialValues && (
          <DemandForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isSaving}
            submitLabel="Salvar Alterações"
          />
        )}
      </div>
    </>
  );
};
