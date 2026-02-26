import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertOctagon, X, CheckSquare } from 'lucide-react';

interface Tratativa {
  id: string;
  title: string;
  completed: boolean;
}

interface ActionBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockedStatusLabel: string;
  incompleteTratativas: Tratativa[];
}

export const ActionBlockedModal: React.FC<ActionBlockedModalProps> = ({
  isOpen,
  onClose,
  blockedStatusLabel,
  incompleteTratativas,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 backdrop-blur-sm transition-all">
      <div className="relative w-full max-w-lg transform rounded-xl bg-white p-6 shadow-2xl transition-all dark:bg-gray-800 border-l-4 border-red-500">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
              <AlertOctagon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Ação Bloqueada
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:hover:bg-gray-700 dark:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-2 ml-1">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            Não é possível mover esta demanda para <span className="font-semibold text-gray-900 dark:text-white">"{blockedStatusLabel}"</span> pois existem tratativas pendentes que precisam ser concluídas antes.
          </p>

          <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-100 dark:bg-red-900/10 dark:border-red-900/30">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-red-800 dark:text-red-300 flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Tratativas Pendentes
            </h4>
            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {incompleteTratativas.map((tratativa) => (
                <li key={tratativa.id} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-200">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500 dark:bg-red-400" />
                  <span>{tratativa.title}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            Conclua todas as tratativas listadas acima para desbloquear este status.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="inline-flex justify-center rounded-lg border border-transparent bg-red-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-600 dark:hover:bg-red-700 transition-colors w-full sm:w-auto"
            onClick={onClose}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
