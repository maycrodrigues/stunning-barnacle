import React, { useEffect } from "react";
import PageMeta from "../../../shared/components/common/PageMeta";
import PageBreadcrumb from "../../../shared/components/common/PageBreadCrumb";
import { CreateDemandButton, DemandEmptyState, CreateFakeDemandButton, DeleteAllDemandsButton } from "../components";
import { KanbanBoard } from "../components/kanban/KanbanBoard";
import { useAppStore } from "../../../shared/store/appStore";
import { Loader } from "../../../shared/components/ui/loader";

export const DemandKanban: React.FC = () => {
  const { demands, loadDemands, isLoadingDemands, statusOptions } = useAppStore();

  useEffect(() => {
    loadDemands();
  }, [loadDemands]);

  return (
    <>
      <PageMeta
        title="Quadro de Demandas | Gabinete Online"
        description="Quadro de demandas do Gabinete Online"
      />
      <PageBreadcrumb pageTitle="Quadro de Demandas" />

      <div className="mb-5 flex items-center justify-end gap-2 lg:mb-7">
        <DeleteAllDemandsButton />
        <CreateFakeDemandButton />
        <CreateDemandButton />
      </div>
      
      {isLoadingDemands ? (
        <div className="flex h-96 items-center justify-center">
            <Loader />
        </div>
      ) : demands.length > 0 ? (
        <KanbanBoard demands={demands} statusOptions={statusOptions} />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <DemandEmptyState />
        </div>
      )}
    </>
  );
};
