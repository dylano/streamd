import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSync } from "../context/SyncContext";

export function useAutoSync(onSynced?: () => void) {
  const { sync, syncKey } = useSync();
  const { pathname } = useLocation();
  const onSyncedRef = useRef(onSynced);
  onSyncedRef.current = onSynced;

  useEffect(() => {
    const lastSync = localStorage.getItem(syncKey);
    const isStale = !lastSync || Date.now() - Number(lastSync) > 24 * 60 * 60 * 1000;
    if (isStale) {
      void sync().then(() => onSyncedRef.current?.());
    }
  }, [sync, syncKey, pathname]);
}
