import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  CheckCircle2, 
  Calendar, 
  CheckSquare, 
  ArrowRight, 
  ListTodo, 
  AlertCircle,
  Clock
} from "lucide-react";
import { DemandTratativa } from "../../../shared/services/db";
import { useNavigate } from "react-router";
import { useAppStore } from "../../../shared/store/appStore";

interface TratativasPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandId: string;
  demandProtocol: string;
  tratativas: DemandTratativa[];
}

export const TratativasPreviewModal: React.FC<TratativasPreviewModalProps> = ({
  isOpen,
  onClose,
  demandId,
  demandProtocol,
  tratativas,
}) => {
  const navigate = useNavigate();
  const { updateDemand } = useAppStore();
  const [activeTab, setActiveTab] = useState<'open' | 'completed'>('open');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleViewDemand = () => {
    onClose();
    navigate(`/demands/${demandId}`);
  };

  const handleToggleTratativa = async (tratativaId: string, currentStatus: boolean) => {
    if (updatingId) return; // Prevent multiple clicks
    
    setUpdatingId(tratativaId);
    try {
      const updatedTratativas = tratativas.map(t => 
        t.id === tratativaId ? { ...t, completed: !currentStatus } : t
      );
      
      await updateDemand(demandId, { tratativas: updatedTratativas });
      
      // Optional: Switch tab if list becomes empty? No, better to stay.
    } catch (error) {
      console.error("Failed to toggle tratativa", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string | Date) => {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateString));
    } catch (e) {
      return String(dateString);
    }
  };

  const openTratativas = tratativas.filter((t) => !t.completed);
  const completedTratativas = tratativas.filter((t) => t.completed);

  // Animation classes
  const tabButtonClass = (isActive: boolean, color: 'blue' | 'green') => `
    flex-1 py-3 text-sm font-medium text-center transition-all relative
    ${isActive 
      ? color === 'blue' 
        ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' 
        : 'text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10'
      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800/50'
    }
  `;

  const badgeClass = (isActive: boolean, color: 'blue' | 'green') => `
    ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold transition-colors
    ${isActive
      ? color === 'blue'
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
        : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
    }
  `;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl transition-all flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5 dark:bg-blue-900/20 ring-1 ring-blue-100 dark:ring-blue-800">
              <ListTodo className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                Tratativas
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 flex items-center gap-1">
                Protocolo: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">{demandProtocol}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors dark:hover:bg-gray-700 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
          <button
            onClick={() => setActiveTab('open')}
            className={tabButtonClass(activeTab === 'open', 'blue')}
          >
            Pendentes
            <span className={badgeClass(activeTab === 'open', 'blue')}>
              {openTratativas.length}
            </span>
            {activeTab === 'open' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={tabButtonClass(activeTab === 'completed', 'green')}
          >
            Concluídas
            <span className={badgeClass(activeTab === 'completed', 'green')}>
              {completedTratativas.length}
            </span>
            {activeTab === 'completed' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 dark:bg-green-400" />
            )}
          </button>
        </div>

        {/* List Content */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/20">
          {activeTab === 'open' ? (
            openTratativas.length === 0 ? (
              <EmptyState type="open" />
            ) : (
              openTratativas.map(t => (
                <TratativaItem 
                  key={t.id} 
                  tratativa={t} 
                  onToggle={() => handleToggleTratativa(t.id, t.completed)}
                  isUpdating={updatingId === t.id}
                  formatDate={formatDate}
                />
              ))
            )
          ) : (
            completedTratativas.length === 0 ? (
              <EmptyState type="completed" />
            ) : (
              completedTratativas.map(t => (
                <TratativaItem 
                  key={t.id} 
                  tratativa={t} 
                  onToggle={() => handleToggleTratativa(t.id, t.completed)}
                  isUpdating={updatingId === t.id}
                  formatDate={formatDate}
                />
              ))
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
          <button
            onClick={handleViewDemand}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-600 dark:ring-offset-gray-900 active:scale-[0.98]"
          >
            Ver Detalhes Completos
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Helper Components
const EmptyState = ({ type }: { type: 'open' | 'completed' }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-300">
    <div className={`rounded-full p-4 mb-4 ring-8 ${
      type === 'open' 
        ? 'bg-green-50 text-green-500 ring-green-50/50 dark:bg-green-900/20 dark:ring-green-900/10' 
        : 'bg-gray-100 text-gray-400 ring-gray-50 dark:bg-gray-800 dark:ring-gray-800/50'
    }`}>
      {type === 'open' ? <CheckCircle2 size={40} strokeWidth={1.5} /> : <AlertCircle size={40} strokeWidth={1.5} />}
    </div>
    <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
      {type === 'open' ? 'Tudo em dia!' : 'Nenhuma concluída'}
    </h4>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[220px] leading-relaxed">
      {type === 'open' 
        ? 'Não há tratativas pendentes para esta demanda.' 
        : 'As tratativas concluídas aparecerão nesta aba.'}
    </p>
  </div>
);

interface TratativaItemProps {
  tratativa: DemandTratativa;
  onToggle: () => void;
  isUpdating: boolean;
  formatDate: (date: string | Date) => string;
}

const TratativaItem = ({ tratativa, onToggle, isUpdating, formatDate }: TratativaItemProps) => {
  return (
    <div 
      className={`group relative flex items-start gap-3 rounded-xl border p-3.5 transition-all duration-200 ${
        tratativa.completed 
          ? 'bg-gray-50/80 border-gray-200 dark:bg-gray-800/40 dark:border-gray-700/50' 
          : 'bg-white border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md dark:bg-gray-800 dark:border-gray-700 dark:hover:border-blue-500/30'
      }`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        disabled={isUpdating}
        className={`mt-0.5 shrink-0 rounded-md border transition-all duration-200 h-5 w-5 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          tratativa.completed
            ? 'bg-green-500 border-green-500 text-white focus:ring-green-500'
            : 'bg-white border-gray-300 text-transparent hover:border-blue-500 dark:bg-gray-800 dark:border-gray-500 dark:hover:border-blue-400 focus:ring-blue-500'
        } ${isUpdating ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
        aria-label={tratativa.completed ? "Marcar como pendente" : "Marcar como concluída"}
      >
        {isUpdating ? (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-gray-300 dark:border-t-transparent" />
        ) : (
          <CheckSquare size={14} strokeWidth={3} className={tratativa.completed ? 'block scale-100' : 'hidden scale-0'} />
        )}
      </button>
      
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium transition-colors ${
            tratativa.completed 
              ? 'text-gray-500 line-through decoration-gray-300 dark:text-gray-500 dark:decoration-gray-600' 
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {tratativa.title}
          </p>
        </div>
        
        {tratativa.description && (
          <p className={`mt-1 text-xs line-clamp-2 transition-colors ${
            tratativa.completed
              ? 'text-gray-400 dark:text-gray-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {tratativa.description}
          </p>
        )}
        
        <div className="mt-2.5 flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${
             tratativa.completed
               ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
               : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
          }`}>
            <Calendar size={10} />
            {formatDate(tratativa.createdAt || new Date())}
          </span>
          
          {!tratativa.completed && (
            <span className="flex items-center gap-1.5 text-[10px] text-orange-600 dark:text-orange-400 font-medium animate-pulse">
              <Clock size={10} />
              Pendente
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
