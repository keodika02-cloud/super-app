import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Smart Storage Facade
 * ✅ Auto-detects Platform (Mobile vs Web)
 * ✅ Auto-stringifies Objects
 * ✅ Auto-parses JSON when retrieving
 */

const isSecureStoreAvailable = Platform.OS !== 'web';

export const SecureStorage = {
    /**
     * Store data (Auto-detects String vs Object)
     * ✅ SMART: Tự động chuyển Object/Number thành String
     */
    async setItem(key: string, value: any): Promise<void> {
        try {
            if (value === null || value === undefined) {
                console.warn(`SecureStorage.setItem: Skipping null/undefined value for key: ${key}`);
                return;
            }

            // ✅ SMART: Tự động stringify nếu không phải string
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

            if (isSecureStoreAvailable) {
                await SecureStore.setItemAsync(key, stringValue);
            } else {
                // Antigravity/Web Fallback
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem(key, stringValue);
                } else {
                    await AsyncStorage.setItem(key, stringValue);
                }
            }
        } catch (error) {
            console.error(`❌ SecureStorage.setItem(${key}) failed:`, error);
            throw error;
        }
    },

    /**
     * Get data (Auto-parse JSON if possible)
     * ✅ SMART: Thử Parse JSON, nếu lỗi thì trả về chuỗi gốc
     * ✅ OPTIMIZED: Check startsWith để tránh parse không cần thiết
     */
    async getItem<T = string>(key: string): Promise<T | null> {
        try {
            let result: string | null = null;

            if (isSecureStoreAvailable) {
                result = await SecureStore.getItemAsync(key);
            } else {
                if (typeof window !== 'undefined' && window.localStorage) {
                    result = window.localStorage.getItem(key);
                } else {
                    result = await AsyncStorage.getItem(key);
                }
            }

            if (!result) return null;

            // ✅ PERFORMANCE: Chỉ parse nếu chuỗi có dạng JSON
            // Tránh ném mọi chuỗi vào JSON.parse (tốn CPU)
            if (result.startsWith('{') || result.startsWith('[')) {
                try {
                    return JSON.parse(result) as T;
                } catch {
                    // Parse failed, return as-is
                    return result as unknown as T;
                }
            }

            // Plain string, return directly
            return result as unknown as T;
        } catch (error) {
            console.error(`❌ SecureStorage.getItem(${key}) failed:`, error);
            return null;
        }
    },

    /**
     * Remove item
     */
    async removeItem(key: string): Promise<void> {
        try {
            if (isSecureStoreAvailable) {
                await SecureStore.deleteItemAsync(key);
            } else {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.removeItem(key);
                } else {
                    await AsyncStorage.removeItem(key);
                }
            }
        } catch (error) {
            console.error(`❌ SecureStorage.removeItem(${key}) failed:`, error);
        }
    },

    /**
     * Clear all (use with caution)
     */
    async clearAll(): Promise<void> {
        try {
            if (isSecureStoreAvailable) {
                console.warn('⚠️ SecureStore does not support clearAll. Clear keys individually.');
            } else {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.clear();
                } else {
                    await AsyncStorage.clear();
                }
            }
        } catch (error) {
            console.error('❌ SecureStorage.clearAll() failed:', error);
        }
    },
};

/**
 * Storage Keys (Centralized)
 */
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_ID: 'user_id',
    USER_INFO: 'user_info',
} as const;
