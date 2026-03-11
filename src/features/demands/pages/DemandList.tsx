import React, { useEffect } from "react";
import PageBreadcrumb from "../../../shared/components/common/PageBreadCrumb";
import PageMeta from "../../../shared/components/common/PageMeta";
import { Loader } from "../../../shared/components/ui/loader";
import { CreateDemandButton, DemandEmptyState, DemandGroupedList } from "../components";
import { useAppStore } from "../../../shared/store/appStore";

export const DemandList: React.FC = () => {
  const { demands, loadDemands, isLoadingDemands } = useAppStore();

  useEffect(() => {
    loadDemands();
  }, [loadDemands]);

  return (
    <>
      <PageMeta
        title="Lista de Demandas | Gabinete Online"
        description="Lista de demandas do Gabinete Online"
      />
      <PageBreadcrumb pageTitle="Lista de Demandas" />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Todas as Demandas
            <span className="ml-2 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-white/5 dark:text-gray-400">
              {demands.length}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <CreateDemandButton />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {isLoadingDemands ? (
          <Loader className="h-40" />
        ) : demands.length > 0 ? (
          <DemandGroupedList demands={demands} />
        ) : (
          <DemandEmptyState />
        )}
      </div>
    </>
  );
};
