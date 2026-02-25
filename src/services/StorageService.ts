/**
 * src/services/StorageService.ts
 * SINGLE RESPONSIBILITY: Tất cả thao tác lưu trữ đi qua đây.
 *
 * Phân luồng:
 *   Token (nhạy cảm) → SecureStore (iOS/Android) | AsyncStorage (web/dev fallback)
 *   Config (không nhạy cảm) → AsyncStorage
 *
 * Nguyên tắc:
 *   - Không bao giờ throw – luôn return null nếu lỗi
 *   - Log lỗi tường minh thay vì silent fail
 *   - clearAll() phải xóa CẢ HAI kho
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const KEYS = {
    TOKEN: 'qvc_auth_token',
    USER: 'qvc_user_profile',
    THEME: 'qvc_theme',
    LAST_EMAIL: 'qvc_last_email',
    BIOMETRIC_ENABLED: 'qvc_biometric',
    ONBOARDING_DONE: 'qvc_onboarding',
} as const;

// ─── Tầng lưu trữ Token (SecureStore ưu tiên) ───────────────────────────────

async function saveToken(token: string): Promise<void> {
    try {
        if (Platform.OS === 'web') {
            // Web / Antigravity: SecureStore không hỗ trợ → fallback AsyncStorage
            await AsyncStorage.setItem(KEYS.TOKEN, token);
            console.warn('[StorageService] Web fallback: token lưu AsyncStorage (không an toàn trong prod)');
        } else {
            await SecureStore.setItemAsync(KEYS.TOKEN, token);
        }
    } catch (err) {
        console.error('[StorageService] saveToken lỗi, fallback AsyncStorage:', err);
        try { await AsyncStorage.setItem(KEYS.TOKEN, token); } catch { }
    }
}

async function getToken(): Promise<string | null> {
    try {
        if (Platform.OS === 'web') {
            return await AsyncStorage.getItem(KEYS.TOKEN);
        }
        return await SecureStore.getItemAsync(KEYS.TOKEN);
    } catch (err) {
        console.error('[StorageService] getToken lỗi, fallback AsyncStorage:', err);
        try { return await AsyncStorage.getItem(KEYS.TOKEN); } catch { }
        return null;
    }
}

async function deleteToken(): Promise<void> {
    try {
        if (Platform.OS !== 'web') {
            await SecureStore.deleteItemAsync(KEYS.TOKEN);
        }
        await AsyncStorage.removeItem(KEYS.TOKEN); // Xóa cả fallback
    } catch (err) {
        console.error('[StorageService] deleteToken lỗi:', err);
    }
}

// ─── Tầng lưu trữ Config (AsyncStorage) ─────────────────────────────────────

async function saveConfig<T>(key: string, value: T): Promise<void> {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
        console.error(`[StorageService] saveConfig(${key}) lỗi:`, err);
    }
}

async function getConfig<T>(key: string, fallback: T): Promise<T> {
    try {
        const raw = await AsyncStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw) as T;
    } catch (err) {
        console.error(`[StorageService] getConfig(${key}) lỗi, dùng fallback:`, err);
        return fallback;
    }
}

// ─── Helpers thường dùng ─────────────────────────────────────────────────────

const saveUser = (user: object) => saveConfig(KEYS.USER, user);
const getUser = <T>() => getConfig<T | null>(KEYS.USER, null);
const saveTheme = (theme: 'light' | 'dark') => saveConfig(KEYS.THEME, theme);
const getTheme = () => getConfig<'light' | 'dark'>(KEYS.THEME, 'light');
const saveLastEmail = (email: string) => saveConfig(KEYS.LAST_EMAIL, email);
const getLastEmail = () => getConfig<string | null>(KEYS.LAST_EMAIL, null);
const setBiometric = (enabled: boolean) => saveConfig(KEYS.BIOMETRIC_ENABLED, enabled);
const getBiometric = () => getConfig<boolean>(KEYS.BIOMETRIC_ENABLED, false);
const setOnboarding = () => saveConfig(KEYS.ONBOARDING_DONE, true);
const isOnboarded = () => getConfig<boolean>(KEYS.ONBOARDING_DONE, false);

// ─── Logout – xóa sạch TOÀN BỘ session ──────────────────────────────────────

async function clearSession(): Promise<void> {
    await deleteToken();
    await AsyncStorage.multiRemove([KEYS.USER, KEYS.BIOMETRIC_ENABLED]);
    console.info('[StorageService] Session đã xóa sạch');
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const StorageService = {
    KEYS,
    saveToken, getToken, deleteToken,
    saveConfig, getConfig,
    saveUser, getUser,
    saveTheme, getTheme,
    saveLastEmail, getLastEmail,
    setBiometric, getBiometric,
    setOnboarding, isOnboarded,
    clearSession,
};
