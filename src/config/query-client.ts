/**
 * src/config/query-client.ts
 * TanStack Query v5 – Offline-First configuration.
 * Mọi query/mutation đều có networkMode: offlineFirst để chạy khi mất mạng.
 */
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24,   // Giữ cache 24h
            staleTime: 1000 * 60 * 5,       // Dữ liệu cũ sau 5 phút
            retry: 2,
            networkMode: 'offlineFirst',     // Hiện cache cũ khi offline
        },
        mutations: {
            networkMode: 'offlineFirst',     // Cho phép bấm nút khi offline
            retry: 3,
        },
    },
});

// Lưu cache xuống đĩa (offline persistence)
export const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: 'qvc-app-cache',
    throttleTime: 3000, // Ghi xuống đĩa mỗi 3s
});

// Tự động refresh khi app được focus trở lại
let appStateListener: ReturnType<typeof AppState.addEventListener> | null = null;

export function setupQueryClientListeners() {
    if (appStateListener) return; // Chỉ setup 1 lần
    appStateListener = AppState.addEventListener('change', (status) => {
        if (status === 'active') {
            queryClient.invalidateQueries();
        }
    });
}
