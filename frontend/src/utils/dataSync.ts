import { useEffect, useRef } from 'react';

export type SyncEntity =
  | 'RAW_MATERIAL'
  | 'PRODUCT'
  | 'STOCK_MOVEMENT'
  | 'PRODUCTION_ORDER'
  | 'QUALITY_INSPECTION'
  | 'FINISHED_GOOD'
  | 'DISPATCH'
  | 'WAREHOUSE'
  | 'SUPPLIER'
  | 'BATCH'
  | 'EMPLOYEE'
  | 'ATTENDANCE'
  | 'LEAVE'
  | 'PAYROLL'
  | 'CUSTOMER'
  | 'LEAD'
  | 'SALES_ORDER'
  | 'INVOICE'
  | 'PAYMENT'
  | 'REPORTS'
  | 'DASHBOARD'
  | 'ALL';

type Listener = (entities: SyncEntity[]) => void;
const listeners = new Set<Listener>();

const SYNC_CHANNEL_NAME = 'lumirise_enterprise_data_sync_bus';
const STORAGE_SYNC_KEY = 'lumirise_sync_event';

// 1. BroadcastChannel for zero-latency cross-tab synchronization
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      if (event.data && Array.isArray(event.data.entities)) {
        dispatchToLocalListeners(event.data.entities);
      }
    };
  } catch (err) {
    console.warn('BroadcastChannel initialization error:', err);
  }
}

// 2. Storage event fallback for cross-tab communication
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_SYNC_KEY && event.newValue) {
      try {
        const payload = JSON.parse(event.newValue);
        if (payload && Array.isArray(payload.entities)) {
          dispatchToLocalListeners(payload.entities);
        }
      } catch {
        // ignore JSON parse errors
      }
    }
  });

  // 3. Tab focus & visibility reconnection triggers sync across all active views
  window.addEventListener('focus', () => {
    dispatchToLocalListeners(['ALL']);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      dispatchToLocalListeners(['ALL']);
    }
  });
}

function dispatchToLocalListeners(entities: SyncEntity[]) {
  listeners.forEach((listener) => {
    try {
      listener(entities);
    } catch (err) {
      console.error('Error in data sync listener:', err);
    }
  });
}

/**
 * Notifies all active dashboard and table subscribers that business data has changed.
 * Broadcasts across in-tab listeners, BroadcastChannel, and localStorage cross-tab event bus.
 */
export function notifyDataChange(entities: SyncEntity[]) {
  // Dispatch locally
  dispatchToLocalListeners(entities);

  // Broadcast to other tabs/windows
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        type: 'DATA_CHANGE',
        entities,
        timestamp: Date.now(),
      });
    } catch {
      // ignore channel post error
    }
  }

  // Cross-tab fallback via storage event
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(
        STORAGE_SYNC_KEY,
        JSON.stringify({ entities, timestamp: Date.now() })
      );
    } catch {
      // ignore storage quota / private mode errors
    }
  }
}

/**
 * Custom React hook that automatically calls onSync when any of the subscribed
 * business entities are mutated across ANY open tab or window in Lumirise.
 * Also performs periodic heartbeat sync (every 15s) and on tab focus.
 */
export function useDataSync(
  subscribedEntities: SyncEntity[],
  onSync: () => void,
  options: { pollingIntervalMs?: number; disablePolling?: boolean } = {}
) {
  const callbackRef = useRef(onSync);
  callbackRef.current = onSync;

  const entitiesRef = useRef(subscribedEntities);
  entitiesRef.current = subscribedEntities;

  useEffect(() => {
    const handleSync: Listener = (changedEntities) => {
      const hasMatch =
        changedEntities.includes('ALL') ||
        changedEntities.some((entity) => entitiesRef.current.includes(entity));
      if (hasMatch) {
        callbackRef.current();
      }
    };

    listeners.add(handleSync);

    // Periodic heartbeat to guarantee cross-device / cross-user consistency
    let timer: ReturnType<typeof setInterval> | null = null;
    if (!options.disablePolling) {
      const interval = options.pollingIntervalMs || 15000;
      timer = setInterval(() => {
        callbackRef.current();
      }, interval);
    }

    return () => {
      listeners.delete(handleSync);
      if (timer) clearInterval(timer);
    };
  }, [options.disablePolling, options.pollingIntervalMs]);
}
