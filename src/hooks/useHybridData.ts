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

    // Lưu callbacks và fallback vào ref để tránh infinite loop khi component cha truyền unmemoized inline values/functions
    const fetchApiRef = useRef(fetchApi);
    const isValidDataRef = useRef(isValidData);
    const fallbackRef = useRef(hardcodedFallback);

    useEffect(() => {
        fetchApiRef.current = fetchApi;
        isValidDataRef.current = isValidData;
        fallbackRef.current = hardcodedFallback;
    }, [fetchApi, isValidData, hardcodedFallback]);

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
                    console.log(`[HybridData] 📦 CACHE_HIT for ${cacheKey}. Initial render with saved data.`);
                    setData(cachedData);
                    setStatus('success_cache');
                } else {
                    console.log(`[HybridData] 💨 CACHE_MISS for ${cacheKey}.`);
                }
            }

            // Step 2: Fetch from API
            if (!isManualRefresh) setStatus('loading_api');
            const apiData = await fetchApiRef.current();

            // Check if API data is valid
            if (isValidDataRef.current(apiData)) {
                // Step 3a: Success - update state and save to cache
                console.log(`[HybridData] 🔄 SYNC_SUCCESS for ${cacheKey}. Fresh data from server.`);
                setData(apiData);
                setStatus('success_api');
                await StorageService.saveConfig(cacheKey, apiData);
            } else {
                // Step 3b: API data invalid - fallback if we don't already have valid cached data
                console.warn(`[HybridData] ⚠️ API_DATA_INVALID for ${cacheKey}. Decisioning fallback...`);
                setStatus((prevStatus) => {
                    if (prevStatus !== 'success_cache' && prevStatus !== 'success_api') {
                        console.error(`[HybridData] 🚨 EMERGENCY_FALLBACK for ${cacheKey}. Rendering hardcoded layout.`);
                        setData(fallbackRef.current);
                        return 'fallback_hardcoded';
                    }
                    console.log(`[HybridData] 🛡️ SHIELDED: API failed but we kept the Good Cache for ${cacheKey}.`);
                    return prevStatus;
                });
            }
        } catch (error: any) {
            console.error(`[HybridData] ❌ API_FETCH_ERROR for ${cacheKey}:`, error.message);
            // On error, fallback if we don't have valid cache
            setStatus((prevStatus) => {
                if (prevStatus !== 'success_cache' && prevStatus !== 'success_api') {
                    console.error(`[HybridData] 🚨 EMERGENCY_FALLBACK for ${cacheKey}. Rendering hardcoded layout.`);
                    setData(fallbackRef.current);
                    return 'fallback_hardcoded';
                }
                console.log(`[HybridData] 🛡️ SHIELDED: Network error but we kept the Good Cache for ${cacheKey}.`);
                return prevStatus;
            });
        } finally {
            if (isManualRefresh) {
                console.log(`[HybridData] 🏁 Manual refresh completed for ${cacheKey}.`);
                setIsRefreshing(false);
            }
        }
    }, [cacheKey]);

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
