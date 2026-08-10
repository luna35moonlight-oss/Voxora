import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

export type ConnectivityState = 'online' | 'offline' | 'unknown';

export function useConnectivity(): ConnectivityState {
  const [state, setState] = useState<ConnectivityState>('unknown');

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const status = await Network.getNetworkStateAsync();
        if (!mounted) return;
        setState(status.isConnected ? 'online' : 'offline');
      } catch {
        if (mounted) setState('unknown');
      }
    };
    void check();
    const id = setInterval(check, 10_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return state;
}
