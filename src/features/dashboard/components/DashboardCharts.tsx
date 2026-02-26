import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Demand, Option } from "../../../shared/store/appStore";
import { DashboardMap } from "./DashboardMap";

interface DashboardChartsProps {
  demands: Demand[];
  categories: Option[];
  statusOptions: Option[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  demands,
  categories,
  statusOptions,
}) => {
  // 1. Demands by Status
  const statusCounts = statusOptions.map((status) => {
    return demands.filter((d) => d.status === status.value).length;
  });

  const statusChartOptions: ApexOptions = {
    chart: { type: "donut", fontFamily: "Outfit, sans-serif" },
    labels: statusOptions.map((s) => s.label),
    colors: ["#3C50E0", "#80CAEE", "#0FADCF", "#6577F3", "#259AE6"],
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "65%" } } },
  };

  // 2. Categories: On Time vs Overdue
  const categoryLabels = categories.map((c) => c.label);
  const onTimeData = categories.map((c) => {
    return demands.filter((d) => {
      if (d.category !== c.value) return false;
      // Is Overdue?
      const isOverdue =
        d.status === "em-processo-fora-do-prazo" ||
        (d.deadline && new Date(d.deadline) < new Date() && d.status !== "concluido");
      return !isOverdue;
    }).length;
  });

  const overdueData = categories.map((c) => {
    return demands.filter((d) => {
      if (d.category !== c.value) return false;
      const isOverdue =
        d.status === "em-processo-fora-do-prazo" ||
        (d.deadline && new Date(d.deadline) < new Date() && d.status !== "concluido");
      return isOverdue;
    }).length;
  });

  const categoryChartOptions: ApexOptions = {
    chart: { type: "bar", stacked: true, fontFamily: "Outfit, sans-serif", toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, borderRadius: 0, columnWidth: "25%" } },
    xaxis: { categories: categoryLabels },
    legend: { position: "top", horizontalAlign: "left" },
    colors: ["#3C50E0", "#FF4560"], // Blue for On Time, Red for Overdue
    dataLabels: { enabled: false },
  };

  // 3. Completion Type (Success vs Restriction)
  const completedDemands = demands.filter((d) => d.status === "concluido");
  
  let successCount = 0;
  let restrictionCount = 0;

  completedDemands.forEach(d => {
      // Find the status change event to 'concluido'
      // Since timeline is ordered (newest first), we find the first matching event
      const completionEvent = d.timeline?.find(e => 
          e.type === 'status_change' && 
          (e.metadata?.to === 'concluido' || (d.status === 'concluido' && !e.metadata))
      );
      
      let isSuccess = false;
      
      if (completionEvent) {
          // Check metadata.justification (new logic)
          if (completionEvent.metadata?.justification === "Demanda concluída com sucesso.") {
              isSuccess = true;
          } 
          // Check description (fallback/legacy logic)
          else if (completionEvent.description === "Demanda concluída com sucesso.") {
              isSuccess = true;
          }
      }
      
      if (isSuccess) {
          successCount++;
      } else {
          restrictionCount++;
      }
  });

  const completionChartOptions: ApexOptions = {
    chart: { type: "donut", fontFamily: "Outfit, sans-serif" },
    labels: ["Com Sucesso", "Com Ressalva"],
    colors: ["#10B981", "#F59E0B"], // Green, Amber
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "65%" } } },
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
      {/* Status Chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Demandas por Status
        </h3>
        <Chart options={statusChartOptions} series={statusCounts} type="donut" height={350} />
      </div>

      {/* Category Chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Demandas por Categoria (Prazo)
        </h3>
        <Chart
          options={categoryChartOptions}
          series={[
            { name: "No Prazo", data: onTimeData },
            { name: "Fora do Prazo", data: overdueData },
          ]}
          type="bar"
          height={350}
        />
      </div>

      {/* Completion Type Chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Tipo de Conclusão
        </h3>
        <div className="flex items-center justify-center h-full pb-6">
           {completedDemands.length > 0 ? (
             <Chart options={completionChartOptions} series={[successCount, restrictionCount]} type="donut" height={350} />
           ) : (
             <p className="text-gray-500 text-sm">Nenhuma demanda concluída ainda.</p>
           )}
        </div>
      </div>

      {/* Map - Below Category Chart (same size) */}
      <DashboardMap demands={demands} statusOptions={statusOptions} className="lg:col-span-2" />
    </div>
  );
};
