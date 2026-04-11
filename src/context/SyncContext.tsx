import { createContext, useContext, useState, useCallback } from "react";
import { useUser } from "./UserContext";
import { api } from "../api/client";

interface SyncContextValue {
  syncing: boolean;
  sync: () => Promise<void>;
  syncKey: string;
}

const SyncContext = createContext<SyncContextValue>({
  syncing: false,
  sync: async () => {},
  syncKey: "",
});

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const syncKey = `streamd:lastSync:${user!.id}`;
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await api.post("/shows/sync", {});
      localStorage.setItem(syncKey, String(Date.now()));
    } finally {
      setSyncing(false);
    }
  }, [syncing, syncKey]);

  return <SyncContext.Provider value={{ syncing, sync, syncKey }}>{children}</SyncContext.Provider>;
}

export function useSync() {
  return useContext(SyncContext);
}
