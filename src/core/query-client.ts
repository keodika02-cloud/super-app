import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

// ─── Query Client (Offline-First) ────────────────────────────────────────────
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24,  // Giữ cache 24h
            staleTime: 1000 * 60 * 5,      // Stale sau 5 phút
            retry: (failureCount, error: any) => {
                // [HARDENING]: Không retry lỗi 4xx (validation/auth)
                if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
                    return false;
                }
                return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // [HARDENING]: Exponential backoff (max 30s)
            networkMode: 'offlineFirst',   // Luôn dùng cache trước khi fetch
        },
        mutations: {
            networkMode: 'offlineFirst',   // Cho phép bấm nút khi offline → queue
            retry: (failureCount, error: any) => {
                // [HARDENING]: Chỉ retry network error (có mã nội bộ custom là 0) hoặc 5xx
                if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
                    return false;
                }
                return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff max 10s
        },
    },
});

// ─── Persister (Lưu cache xuống AsyncStorage) ─────────────────────────────────
export const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
    throttleTime: 3000, // Chỉ lưu mỗi 3s để đỡ lag I/O
});

// ─── Auto refetch khi App focus lại ──────────────────────────────────────────
// [HARDENING]: Fix Memory Leak bằng cách khai báo function setup riêng biệt (export để gọi trong root _layout)
export function setupAppStateListener() {
    const subscription = AppState.addEventListener('change', (status) => {
        if (status === 'active') {
            // [PERFORMANCE_FIX]: Chỉ gửi request cho các API đã quá `staleTime`, tránh giật/lag khi mở lại máy
            queryClient.invalidateQueries({
                predicate: (query) => query.isStale(),
            });
        }
    });
    return subscription;
}
