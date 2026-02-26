import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface CompletionTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSuccess: () => void;
  onConfirmWithRestriction: () => void;
}

export const CompletionTypeModal: React.FC<CompletionTypeModalProps> = ({
  isOpen,
  onClose,
  onConfirmSuccess,
  onConfirmWithRestriction,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 backdrop-blur-sm transition-all">
      <div className="relative w-full max-w-lg transform rounded-xl bg-white p-6 shadow-2xl transition-all dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Conclusão de Demanda
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:hover:bg-gray-700 dark:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Selecione como deseja registrar a conclusão desta demanda.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: Success */}
            <button
              onClick={onConfirmSuccess}
              className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-transparent bg-green-50 hover:bg-green-100 hover:border-green-200 hover:shadow-md transition-all group dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:hover:border-green-800"
            >
              <div className="mb-4 rounded-full bg-green-100 p-4 group-hover:scale-110 transition-transform dark:bg-green-800">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
              <h4 className="font-semibold text-lg text-green-900 dark:text-green-100 mb-2">Concluído com Sucesso</h4>
              <p className="text-xs text-center text-green-700 dark:text-green-300/80 leading-relaxed">
                A demanda foi atendida plenamente sem pendências.
              </p>
            </button>

            {/* Option 2: With Restriction */}
            <button
              onClick={onConfirmWithRestriction}
              className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-transparent bg-amber-50 hover:bg-amber-100 hover:border-amber-200 hover:shadow-md transition-all group dark:bg-amber-900/20 dark:hover:bg-amber-900/30 dark:hover:border-amber-800"
            >
              <div className="mb-4 rounded-full bg-amber-100 p-4 group-hover:scale-110 transition-transform dark:bg-amber-800">
                <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-300" />
              </div>
              <h4 className="font-semibold text-lg text-amber-900 dark:text-amber-100 mb-2">Com Ressalvas</h4>
              <p className="text-xs text-center text-amber-700 dark:text-amber-300/80 leading-relaxed">
                A demanda foi concluída, mas requer justificativa ou anexo.
              </p>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
