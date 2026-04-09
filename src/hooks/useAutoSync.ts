import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSync, SYNC_KEY } from "../context/SyncContext";

function isSyncStale() {
  const lastSync = localStorage.getItem(SYNC_KEY);
  return !lastSync || Date.now() - Number(lastSync) > 24 * 60 * 60 * 1000;
}

export function useAutoSync(onSynced?: () => void) {
  const { sync } = useSync();
  const { pathname } = useLocation();
  const onSyncedRef = useRef(onSynced);
  onSyncedRef.current = onSynced;

  useEffect(() => {
    if (isSyncStale()) {
      void sync().then(() => onSyncedRef.current?.());
    }
  }, [sync, pathname]);
}
