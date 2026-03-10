import React, { useMemo } from "react";
import { Demand, Option } from "../../../shared/store/appStore";
import { Clock, TrendingUp } from "lucide-react";

interface DashboardEfficiencyStatsProps {
  demands: Demand[];
  categoryOptions: Option[];
}

export const DashboardEfficiencyStats: React.FC<DashboardEfficiencyStatsProps> = ({ demands, categoryOptions }) => {
  // 1. Tempo Médio de Resolução (dias)
  const averageResolutionTime = useMemo(() => {
    const completedDemands = demands.filter(d => d.status === 'concluido');
    if (completedDemands.length === 0) return 0;

    const totalTimeMs = completedDemands.reduce((acc, d) => {
      const start = new Date(d.createdAt).getTime();
      
      // Tentar encontrar o evento de conclusão na timeline para maior precisão
      const completionEvent = d.timeline?.find(e => 
          e.type === 'status_change' && 
          (e.metadata?.to === 'concluido' || (d.status === 'concluido' && !e.metadata))
      );
      
      const end = completionEvent 
        ? new Date(completionEvent.date).getTime() 
        : new Date(d.updatedAt).getTime(); // Fallback para updatedAt
        
      return acc + (end - start);
    }, 0);

    const avgTimeMs = totalTimeMs / completedDemands.length;
    return Math.round(avgTimeMs / (1000 * 60 * 60 * 24)); // Ms para Dias
  }, [demands]);

  // 2. Taxa de Resolução no Prazo (%)
  const deadlineEfficiency = useMemo(() => {
    const completedDemands = demands.filter(d => d.status === 'concluido');
    if (completedDemands.length === 0) return 0;

    const onTimeCount = completedDemands.filter(d => {
      if (!d.deadline) return true; // Sem prazo = no prazo
      
      const completionEvent = d.timeline?.find(e => 
          e.type === 'status_change' && 
          (e.metadata?.to === 'concluido' || (d.status === 'concluido' && !e.metadata))
      );
      
      const completedDate = completionEvent 
        ? new Date(completionEvent.date)
        : new Date(d.updatedAt);

      const deadlineDate = new Date(d.deadline);
      // Ajustar para fim do dia do prazo
      deadlineDate.setHours(23, 59, 59, 999);
      return completedDate <= deadlineDate;
    }).length;

    return Math.round((onTimeCount / completedDemands.length) * 100);
  }, [demands]);

  // 3. Top 5 Categorias
  const topCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    demands.forEach(d => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([slug, count]) => {
        const option = categoryOptions.find(c => c.value === slug);
        return {
          label: option?.label || slug,
          count,
          percentage: Math.round((count / demands.length) * 100)
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [demands, categoryOptions]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10">
              <Clock size={20} />
            </div>
            <h4 className="font-semibold text-gray-800 dark:text-white/90">Tempo Médio</h4>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{averageResolutionTime}</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">dias para conclusão</span>
          </div>
          <p className="mt-2 text-xs text-gray-400">Baseado nas demandas concluídas</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-green-600 dark:bg-green-500/10">
              <TrendingUp size={20} />
            </div>
            <h4 className="font-semibold text-gray-800 dark:text-white/90">Eficiência</h4>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{deadlineEfficiency}%</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">no prazo</span>
          </div>
          <p className="mt-2 text-xs text-gray-400">Taxa de cumprimento de prazos</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h4 className="mb-4 font-semibold text-gray-800 dark:text-white/90">Principais Categorias</h4>
        <div className="space-y-4">
          {topCategories.map((cat, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 w-4">{index + 1}.</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.label}</span>
              </div>
              <div className="flex items-center gap-3 w-1/2">
                <div className="w-full bg-gray-100 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className="bg-brand-500 h-2 rounded-full" 
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-500 w-8 text-right">{cat.count}</span>
              </div>
            </div>
          ))}
          {topCategories.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">Nenhuma categoria registrada.</p>
          )}
        </div>
      </div>
    </div>
  );
};
