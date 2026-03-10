import React from "react";
import { Option } from "../../../shared/store/appStore";
import Select from "../../../shared/components/form/Select";
import DatePicker from "../../../shared/components/form/date-picker";
import { X } from "lucide-react";

interface DashboardFilterProps {
  categories: Option[];
  statusOptions: Option[];
  neighborhoodOptions: Option[];
  onFilterChange: (filters: DashboardFilters) => void;
  filters: DashboardFilters;
}

export interface DashboardFilters {
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  category: string;
  neighborhood: string;
}

export const DashboardFilter: React.FC<DashboardFilterProps> = ({
  categories,
  statusOptions,
  neighborhoodOptions,
  onFilterChange,
  filters,
}) => {
  const handleDateChange = (selectedDates: Date[]) => {
    if (selectedDates.length === 2) {
      onFilterChange({
        ...filters,
        startDate: selectedDates[0],
        endDate: selectedDates[1],
      });
    } else if (selectedDates.length === 1) {
        // If only one date is selected, we might want to wait for the second one or set both to same
        // For range picker, flatpickr usually returns [start, end]
         onFilterChange({
            ...filters,
            startDate: selectedDates[0],
            endDate: null
         })
    } else {
        onFilterChange({
            ...filters,
            startDate: null,
            endDate: null
        })
    }
  };

  const hasActiveFilters =
    Boolean(filters.startDate || filters.endDate) ||
    filters.status !== "all" ||
    filters.category !== "all" ||
    filters.neighborhood !== "all";

  const clearFilters = () => {
    onFilterChange({
      startDate: null,
      endDate: null,
      status: "all",
      category: "all",
      neighborhood: "all",
    });
    // Hack to clear flatpickr instance if needed, but react key or passing value helps
    // Since DatePicker uses flatpickr imperatively, we might need to force a re-render or pass value prop if supported
    // The current DatePicker implementation takes defaultDate, so we might need to key it to reset
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Período
          </label>
          <div className="relative">
             <DatePicker
                id="dashboard-date-range"
                mode="range"
                placeholder="Selecione o período"
                onChange={handleDateChange}
                defaultDate={filters.startDate && filters.endDate ? [filters.startDate, filters.endDate] : undefined}
                // Key forces re-render when dates are cleared
                key={filters.startDate ? "has-date" : "no-date"} 
             />
          </div>
        </div>

        <div className="flex-1">
          <Select
            label="Status"
            placeholder="Todos os status"
            options={[{ value: "all", label: "Todos" }, ...statusOptions]}
            onChange={(value) => onFilterChange({ ...filters, status: value })}
            value={filters.status}
          />
        </div>

        <div className="flex-1">
          <Select
            label="Categoria"
            placeholder="Todas as categorias"
            options={[{ value: "all", label: "Todas" }, ...categories]}
            onChange={(value) => onFilterChange({ ...filters, category: value })}
            value={filters.category}
          />
        </div>

        <div className="flex-1">
          <Select
            label="Bairro"
            placeholder="Todos os bairros"
            options={[{ value: "all", label: "Todos" }, ...neighborhoodOptions]}
            onChange={(value) => onFilterChange({ ...filters, neighborhood: value })}
            value={filters.neighborhood}
          />
        </div>

        {hasActiveFilters && (
          <div className="pb-0.5">
            <button
              onClick={clearFilters}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 transition hover:bg-red-100 hover:text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              <X size={16} />
              Limpar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
