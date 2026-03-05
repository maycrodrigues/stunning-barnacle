import { useSync } from "../../hooks/useSync";
import { useOfflineStatus } from "../../hooks/useOfflineStatus";

export const SyncButton = () => {
  const { isSyncing, syncAll, unsyncedCount } = useSync();
  const isOffline = useOfflineStatus();

  return (
    <button
      onClick={syncAll}
      disabled={isSyncing || isOffline}
      className={`
        relative flex items-center justify-center w-10 h-10 rounded-lg border z-40 transition-colors
        ${isOffline 
          ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700" 
          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"}
      `}
      title={isOffline ? "Offline" : `Sincronizar (${unsyncedCount} pendentes)`}
    >
      {isSyncing ? (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : isOffline ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
      )}
      
      {/* Status Indicator Dot */}
      {isOffline && (
        <span className="absolute top-2 right-2 block h-2 w-2 rounded-full ring-2 ring-white dark:ring-gray-900 bg-red-500" />
      )}
      {!isOffline && unsyncedCount > 0 && (
        <span className="absolute top-2 right-2 block h-2 w-2 rounded-full ring-2 ring-white dark:ring-gray-900 bg-green-500" />
      )}
    </button>
  );
};
