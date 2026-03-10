import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageMeta from "../../shared/components/common/PageMeta";
import PageBreadcrumb from "../../shared/components/common/PageBreadCrumb";
import { Demand, Option, useAppStore } from "../../shared/store/appStore";
import { useContactsStore } from "../contacts/store/contactsStore";
import { DashboardFilter, DashboardFilters } from "./components/DashboardFilter";
import { DashboardStats } from "./components/DashboardStats";
import { DashboardEfficiencyStats } from "./components/DashboardEfficiencyStats";
import { DashboardCharts } from "./components/DashboardCharts";
import { DashboardDemographicMap } from "./components/DashboardDemographicMap";

export const DashboardHomeV2: React.FC = () => {
  const { demands, categoryOptions, statusOptions, loadDemands } = useAppStore();
  const { contacts, loadContacts } = useContactsStore();
  
  const [filters, setFilters] = useState<DashboardFilters>(() => ({
    startDate: null,
    endDate: null,
    status: "all",
    category: "all",
    neighborhood: "all",
  }));

  useEffect(() => {
    loadDemands();
    loadContacts();
  }, [loadDemands, loadContacts]);

  const contactLookup = useMemo(() => {
    const byNameLower = new Map<string, (typeof contacts)[number]>();
    const byEmail = new Map<string, (typeof contacts)[number]>();
    const byPhone = new Map<string, (typeof contacts)[number]>();

    for (const c of contacts) {
      byNameLower.set(c.name.toLowerCase(), c);
      if (c.email) byEmail.set(c.email.toLowerCase(), c);
      if (c.phone) byPhone.set(c.phone.toLowerCase(), c);
    }

    return { byNameLower, byEmail, byPhone };
  }, [contacts]);

  const getDemandNeighborhood = useCallback(
    (demand: Demand) => {
      const contact =
        contactLookup.byNameLower.get(demand.requesterName.toLowerCase()) ||
        (demand.requesterContact
          ? contactLookup.byEmail.get(demand.requesterContact.toLowerCase()) ||
            contactLookup.byPhone.get(demand.requesterContact.toLowerCase())
          : undefined);

      const neighborhood = contact?.neighborhood?.trim();
      return neighborhood ? neighborhood : null;
    },
    [contactLookup]
  );

  const neighborhoodOptions: Option[] = useMemo(() => {
    const unique = new Set<string>();
    for (const c of contacts) {
      const neighborhood = c.neighborhood?.trim();
      if (neighborhood) unique.add(neighborhood);
    }

    const options = Array.from(unique)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name }));

    const hasUnknown = demands.some((d) => !getDemandNeighborhood(d));
    if (hasUnknown) {
      options.unshift({ value: "__unknown__", label: "Não Identificado" });
    }

    return options;
  }, [contacts, demands, getDemandNeighborhood]);

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

    // Neighborhood Filter (via contact match)
    if (filters.neighborhood !== "all") {
      const neighborhood = getDemandNeighborhood(d);
      if (filters.neighborhood === "__unknown__") {
        if (neighborhood) return false;
      } else {
        if (!neighborhood) return false;
        if (neighborhood.toLowerCase() !== filters.neighborhood.toLowerCase()) return false;
      }
    }

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
            neighborhoodOptions={neighborhoodOptions}
            filters={filters}
            onFilterChange={setFilters}
          />

          <DashboardStats demands={filteredDemands} />

          <DashboardEfficiencyStats 
            demands={filteredDemands}
            categoryOptions={categoryOptions}
          />

          <DashboardCharts 
            demands={filteredDemands}
            categories={categoryOptions}
            statusOptions={statusOptions}
          />

          <DashboardDemographicMap 
            demands={filteredDemands}
            contacts={contacts}
            statusOptions={statusOptions}
          />
      </div>
    </>
  );
};
