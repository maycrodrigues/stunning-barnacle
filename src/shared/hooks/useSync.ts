import { useState, useCallback, useEffect } from "react";
import { syncService } from "../services/sync";
import { useOfflineStatus } from "./useOfflineStatus";
import Swal from 'sweetalert2';

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const isOffline = useOfflineStatus();

  const checkUnsynced = useCallback(async () => {
    try {
      const count = await syncService.getUnsyncedCount();
      setUnsyncedCount(count);
    } catch (error) {
      console.error("Error checking unsynced count:", error);
    }
  }, []);

  useEffect(() => {
    checkUnsynced();
    const interval = setInterval(checkUnsynced, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [checkUnsynced]);

  const syncAll = useCallback(async () => {
    if (isOffline) {
      Swal.fire({
        icon: 'warning',
        title: 'Offline',
        text: 'Você está offline. A sincronização será realizada quando a conexão for restabelecida.',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    setIsSyncing(true);
    try {
      await syncService.syncAll();
      Swal.fire({
        icon: 'success',
        title: 'Sincronizado',
        text: 'Dados sincronizados com sucesso!',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (error) {
      console.error("Sync error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao sincronizar dados.',
        toast: true,
        position: 'top-end'
      });
    } finally {
      setIsSyncing(false);
      checkUnsynced();
    }
  }, [isOffline, checkUnsynced]);

  return {
    isSyncing,
    syncAll,
    isOffline,
    unsyncedCount
  };
}
