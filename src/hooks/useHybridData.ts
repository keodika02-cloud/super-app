import { useState, useEffect, useCallback, useRef } from 'react';
import { StorageService } from '../services/StorageService';

type DataStatus = 'loading_cache' | 'loading_api' | 'success_api' | 'success_cache' | 'fallback_hardcoded';

interface HybridDataOptions<T> {
    cacheKey: string;
    fetchApi: () => Promise<T>;
    hardcodedFallback: T;
    // Optional function to determine if the API response is valid/sufficient.
    // E.g., for arrays, it could check if length >= 3.
    isValidData?: (data: T) => boolean;
}

interface HybridDataResult<T> {
    data: T;
    status: DataStatus;
    isRefreshing: boolean;
    refetch: () => Promise<void>;
}

/**
 * useHybridData hook implements the 3-layer anti-crash data strategy.
 * 1. Cache: Load data from AsyncStorage (fast initial render).
 * 2. API: Fetch fresh data in the background. If valid, overwrite cache and state.
 * 3. Fallback: If API fails or data is invalid, and no cache exists (or cache is also invalid), use hardcoded data.
 */
export function useHybridData<T>({
    cacheKey,
    fetchApi,
    hardcodedFallback,
    isValidData = (data) => data !== null && data !== undefined,
}: HybridDataOptions<T>): HybridDataResult<T> {
    const [data, setData] = useState<T>(hardcodedFallback);
    const [status, setStatus] = useState<DataStatus>('loading_cache');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Lưu callbacks vào ref để tránh infinite loop khi component cha truyền unmemoized inline functions
    const fetchApiRef = useRef(fetchApi);
    const isValidDataRef = useRef(isValidData);

    useEffect(() => {
        fetchApiRef.current = fetchApi;
        isValidDataRef.current = isValidData;
    }, [fetchApi, isValidData]);

    const loadData = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setIsRefreshing(true);
        }

        try {
            // Step 1: Attempt to load from Cache first
            if (!isManualRefresh) {
                setStatus('loading_cache');
                const cachedData = await StorageService.getConfig<T | null>(cacheKey, null);
                if (cachedData && isValidDataRef.current(cachedData)) {
                    setData(cachedData);
                    setStatus('success_cache');
                }
            }

            // Step 2: Fetch from API
            if (!isManualRefresh) setStatus('loading_api');
            const apiData = await fetchApiRef.current();

            // Check if API data is valid
            if (isValidDataRef.current(apiData)) {
                // Step 3a: Success - update state and save to cache
                setData(apiData);
                setStatus('success_api');
                await StorageService.saveConfig(cacheKey, apiData);
            } else {
                // Step 3b: API data invalid - fallback if we don't already have valid cached data
                console.warn(`[useHybridData] API data for ${cacheKey} is invalid or insufficient.`);
                setStatus((prevStatus) => {
                    if (prevStatus !== 'success_cache') {
                        setData(hardcodedFallback);
                        return 'fallback_hardcoded';
                    }
                    return prevStatus;
                });
            }
        } catch (error) {
            console.error(`[useHybridData] Error fetching ${cacheKey}:`, error);
            // On error, fallback if we don't have valid cache
            setStatus((prevStatus) => {
                if (prevStatus !== 'success_cache') {
                    setData(hardcodedFallback);
                    return 'fallback_hardcoded';
                }
                return prevStatus;
            });
        } finally {
            if (isManualRefresh) {
                setIsRefreshing(false);
            }
        }
    }, [cacheKey, hardcodedFallback]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        data,
        status,
        isRefreshing,
        refetch: () => loadData(true),
    };
}
