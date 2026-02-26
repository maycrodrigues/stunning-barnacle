import React from "react";

interface DemandEmptyStateProps {
  title?: string;
  description?: string;
}

export const DemandEmptyState: React.FC<DemandEmptyStateProps> = ({
  title = "Nenhuma demanda encontrada",
  description = "Comece criando uma nova demanda para visualizar aqui.",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <svg
          className="h-10 w-10 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
};
