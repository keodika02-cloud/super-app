import * as Network from 'expo-network';
import { onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Hook lắng nghe trạng thái mạng và báo cho React Query
 * để tự động pause/resume requests khi offline/online.
 */
export function useNetworkStatus() {
    useEffect(() => {
        // Poll mỗi 5 giây (Expo Go chưa hỗ trợ addEventListener cho Network)
        const interval = setInterval(async () => {
            try {
                const status = await Network.getNetworkStateAsync();
                const isOnline = !!status.isConnected && !!status.isInternetReachable;
                onlineManager.setOnline(isOnline);
            } catch {
                // Trên Web preview, Network API có thể throw – bỏ qua
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);
}
