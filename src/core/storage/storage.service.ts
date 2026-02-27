import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'AUTH_TOKEN';
const USER_PROFILE_KEY = 'USER_PROFILE';

// ─── TOKEN (Bảo mật) ────────────────────────────────────────────────────────

export async function setToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
        // Web/Antigravity fallback – không có SecureStore
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        return;
    }
    try {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    } catch {
        // Thiết bị quá cũ không hỗ trợ SecureStore
        console.warn('[StorageService] SecureStore không khả dụng, fallback về AsyncStorage');
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    }
}

export async function getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
        return AsyncStorage.getItem(AUTH_TOKEN_KEY);
    }
    try {
        const val = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        return val ?? null;
    } catch {
        return AsyncStorage.getItem(AUTH_TOKEN_KEY);
    }
}

export async function removeToken(): Promise<void> {
    if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        return;
    }
    try {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    } catch {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }
}

// ─── USER PROFILE (Không nhạy cảm) ──────────────────────────────────────────

export async function setUserProfile(user: object): Promise<void> {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
}

export async function getUserProfile<T>(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export async function removeUserProfile(): Promise<void> {
    await AsyncStorage.removeItem(USER_PROFILE_KEY);
}

// ─── CONFIG (Cài đặt không nhạy cảm) ────────────────────────────────────────

export async function setConfig(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(`CONFIG_${key}`, value);
}

export async function getConfig(key: string): Promise<string | null> {
    return AsyncStorage.getItem(`CONFIG_${key}`);
}

// ─── SESSION (Dọn sạch khi logout) ──────────────────────────────────────────

export async function clearSession(): Promise<void> {
    await Promise.allSettled([
        removeToken(),
        removeUserProfile(),
    ]);
}

const StorageService = {
    setToken,
    getToken,
    removeToken,
    setUserProfile,
    getUserProfile,
    removeUserProfile,
    setConfig,
    getConfig,
    clearSession,
};

export default StorageService;
