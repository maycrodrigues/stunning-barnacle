import React from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../../shared/components/common/PageMeta";
import PageBreadcrumb from "../../../shared/components/common/PageBreadCrumb";
import { DemandForm } from "../components/DemandForm";
import { useCreateDemand } from "../hooks/useCreateDemand";
import { DemandFormData } from "../types";

export const DemandCreate: React.FC = () => {
  const navigate = useNavigate();
  const { createDemand, isLoading } = useCreateDemand();

  const handleSuccess = () => {
    navigate("/demands/list");
  };

  const handleCancel = () => {
    navigate("/demands/list");
  };

  const handleSubmit = async (data: DemandFormData) => {
    const success = await createDemand(data);
    if (success) {
      handleSuccess();
    }
  };

  return (
    <>
      <PageMeta
        title="Nova Demanda | Gabinete Online"
        description="Criar uma nova demanda no Gabinete Online"
      />
      <PageBreadcrumb pageTitle="Nova Demanda" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <DemandForm 
          onSubmit={handleSubmit} 
          onCancel={handleCancel} 
          isLoading={isLoading}
          submitLabel="Criar"
        />
      </div>
    </>
  );
};
