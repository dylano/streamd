import { createContext, useContext, useState, useCallback } from "react";
import { api } from "../api/client";

interface SyncContextValue {
  syncing: boolean;
  sync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
  syncing: false,
  sync: async () => {},
});

export const SYNC_KEY = "streamd:lastSync";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await api.post("/shows/sync", {});
      localStorage.setItem(SYNC_KEY, String(Date.now()));
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  return <SyncContext.Provider value={{ syncing, sync }}>{children}</SyncContext.Provider>;
}

export function useSync() {
  return useContext(SyncContext);
}
