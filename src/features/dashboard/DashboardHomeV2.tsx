import React, { useEffect, useState } from "react";
import PageMeta from "../../shared/components/common/PageMeta";
import PageBreadcrumb from "../../shared/components/common/PageBreadCrumb";
import { useAppStore } from "../../shared/store/appStore";
import { DashboardFilter, DashboardFilters } from "./components/DashboardFilter";
import { DashboardStats } from "./components/DashboardStats";
import { DashboardCharts } from "./components/DashboardCharts";

export const DashboardHomeV2: React.FC = () => {
  const { demands, categoryOptions, statusOptions, loadDemands } = useAppStore();
  
  const [filters, setFilters] = useState<DashboardFilters>(() => {
    const now = new Date();
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 29); // Last 30 days
    
    return {
      startDate,
      endDate,
      status: "all",
      category: "all"
    };
  });

  useEffect(() => {
    loadDemands();
  }, [loadDemands]);

  const filteredDemands = demands.filter(d => {
    // Date Range Filter (based on createdAt)
    if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        if (new Date(d.createdAt) < start) return false;
    }
    
    if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(d.createdAt) > end) return false;
    }
    
    // Status Filter
    if (filters.status !== "all" && d.status !== filters.status) return false;

    // Category Filter
    if (filters.category !== "all" && d.category !== filters.category) return false;

    return true;
  });

  return (
    <>
      <PageMeta
        title="Dashboard | Gabinete Online"
        description="Dashboard do Gabinete Online"
      />
      <PageBreadcrumb pageTitle="Dashboard" />
      
      <div className="space-y-6">
          <DashboardFilter 
            categories={categoryOptions}  
            statusOptions={statusOptions}
            filters={filters}
            onFilterChange={setFilters}
          />

          <DashboardStats demands={filteredDemands} />

          <DashboardCharts 
            demands={filteredDemands}
            categories={categoryOptions}
            statusOptions={statusOptions}
          />
      </div>
    </>
  );
};
