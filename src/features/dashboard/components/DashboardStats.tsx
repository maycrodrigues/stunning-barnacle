import React from "react";
import { Demand } from "../../../shared/store/appStore";
import { 
  LayoutList, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Inbox
} from "lucide-react";

interface DashboardStatsProps {
  demands: Demand[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ demands }) => {
  const totalDemands = demands.length;
  const completedDemands = demands.filter((d) => d.status === "concluido").length;
  const inProgressDemands = demands.filter((d) => 
    ["em-processo", "em-analise", "em-processo-fora-do-prazo"].includes(d.status || "")
  ).length;
  
  // Calculate overdue demands (either status indicates it, or deadline passed and not completed)
  const overdueDemands = demands.filter((d) => {
    if (d.status === "em-processo-fora-do-prazo") return true;
    if (d.deadline && new Date(d.deadline) < new Date() && d.status !== "concluido") return true;
    return false;
  }).length;

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    colorClass, 
    bgClass 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    colorClass: string; 
    bgClass: string;
  }) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${bgClass}`}>
        <Icon className={`size-6 ${colorClass}`} />
      </div>

      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {value}
          </h4>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6 mb-6">
      <StatCard 
        title="Total de Demandas" 
        value={totalDemands} 
        icon={Inbox} 
        colorClass="text-brand-500" 
        bgClass="bg-brand-50 dark:bg-brand-500/10" 
      />
      <StatCard 
        title="Em Andamento" 
        value={inProgressDemands} 
        icon={LayoutList} 
        colorClass="text-blue-500" 
        bgClass="bg-blue-50 dark:bg-blue-500/10" 
      />
      <StatCard 
        title="Concluídas" 
        value={completedDemands} 
        icon={CheckCircle2} 
        colorClass="text-green-500" 
        bgClass="bg-green-50 dark:bg-green-500/10" 
      />
      <StatCard 
        title="Atrasadas" 
        value={overdueDemands} 
        icon={AlertCircle} 
        colorClass="text-red-500" 
        bgClass="bg-red-50 dark:bg-red-500/10" 
      />
    </div>
  );
};
