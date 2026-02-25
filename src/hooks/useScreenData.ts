/**
 * src/hooks/useScreenData.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * OFFLINE-FIRST HOOK: Cache-then-Network Pattern.
 * Đảm bảo dữ liệu từ cache luôn hiện ngay lập tức, refresh ngầm.
 * ──────────────────────────────────────────────────────────────────────────────
 */
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import { useMemo } from 'react';

export type ScreenDataResult<T> = UseQueryResult<T, Error> & {
    /** Đang tải lần đầu tiên và chưa có dữ liệu trong cache */
    isFirstLoad: boolean;
    /** Đang offline và đang hiển thị dữ liệu cũ từ cache */
    isOfflineData: boolean;
    /** Dữ liệu đang hiển thị là dữ liệu cũ (stale) và đang được refresh ngầm */
    isRefreshing: boolean;
};

/**
 * Hook bọc useQuery để xử lý logic offline-first đồng nhất.
 * 
 * @param queryKey - Key của query
 * @param queryFn - Hàm fetch dữ liệu
 * @param options - Tùy chọn TanStack Query
 */
export function useScreenData<T>(
    queryKey: any[],
    queryFn: () => Promise<T>,
    options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>
): ScreenDataResult<T> {
    const netInfo = useNetInfo();
    const isOffline = netInfo.isConnected === false;

    const query = useQuery<T, Error>({
        queryKey,
        queryFn,
        // Luôn cho phép chạy khi offline (trả về cache)
        networkMode: 'offlineFirst',
        // Giữ dữ liệu cũ trong khi lấy dữ liệu mới (SWR)
        placeholderData: (previousData) => previousData,
        ...options,
    });

    const result = useMemo((): ScreenDataResult<T> => {
        // isFirstLoad: Không có dữ liệu (kể cả cache) + đang fetch lần đầu
        const isFirstLoad = !query.data && query.isLoading;

        // isOfflineData: Đang offline + có dữ liệu hiển thị (từ cache)
        const isOfflineData = isOffline && !!query.data;

        // isRefreshing: Đang có dữ liệu cũ + đang fetch lại ngầm (revalidating)
        const isRefreshing = !!query.data && query.isFetching && !query.isLoading;

        return {
            ...query,
            isFirstLoad,
            isOfflineData,
            isRefreshing,
        } as any;
    }, [query, isOffline]);

    return result;
}
