import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { processSyncQueue } from '../storage/sync/syncManager';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable !== false;
      
      // If we just came back online, trigger the sync manager
      if (online && !isOnline) {
        processSyncQueue().catch(e => console.error('Sync queue failed on reconnect', e));
      }
      
      setIsOnline(online);
    });

    return () => unsubscribe();
  }, [isOnline]);

  return isOnline;
}
