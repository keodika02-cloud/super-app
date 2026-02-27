/**
 * src/stores/useAuthStore.ts
 * Zustand Auth Store – single source of truth cho session người dùng.
 *
 * Quan trọng: Khi store hydrate xong → isHydrated = true.
 * SplashScreen ẩn sau khi isHydrated = true để tránh nhấp nháy.
 */
import { create } from 'zustand';
import { ApiClient, registerLogoutHandler, setDynamicAuthDomains } from '@services/ApiClient';
import { StorageService } from '@services/StorageService';
import { HardwareService } from '@services/HardwareService';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { LoginDataSchema } from '../types/auth';
import type { User } from '../types/auth';
import { NotificationService } from '../services/NotificationService';

interface AuthState {
    user: User | null;
    token: string | null;
    isHydrated: boolean; // Đã load từ storage chưa?
    isLoggedIn: boolean;
    require2FA: boolean;
    tempUserId: number | null; // For 2FA process

    // Actions
    login: (email: string, password: string) => Promise<void>;
    verify2FA: (code: string, rememberDevice: boolean) => Promise<void>;
    resend2FA: () => Promise<void>;
    loginSocial: (provider: 'google' | 'facebook', token: string) => Promise<void>;
    finalizeLogin: (raw: any) => Promise<void>;
    logout: () => Promise<void>;
    loadFromStorage: () => Promise<void>;
    updateUser: (partial: Partial<User>) => void;
    cancel2FA: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    isHydrated: false,
    isLoggedIn: false,
    require2FA: false,
    tempUserId: null,

    // ─── Hydrate từ storage khi app khởi động ──────────────────────────────────
    loadFromStorage: async () => {
        try {
            const [token, user] = await Promise.all([
                StorageService.getToken(),
                StorageService.getUser<User>(),
            ]);
            set({
                token: token ?? null,
                user: user ?? null,
                isLoggedIn: !!token && !!user,
                isHydrated: true,
            });
            if (user?.auth_domains && Array.isArray(user.auth_domains)) {
                setDynamicAuthDomains(user.auth_domains);
            }
        } catch (err) {
            console.error('[AuthStore] loadFromStorage lỗi:', err);
            set({ isHydrated: true });
        }
    },

    // ─── Đăng nhập ─────────────────────────────────────────────────────────────
    login: async (email, password) => {
        const deviceInfo = HardwareService.getDeviceInfo();

        // Mismatch fix: Backend loginApp yêu cầu device_id
        // Sử dụng actionSafe để Đẩy Exception lên LoginScreen bắt lại.
        const raw = await ApiClient.actionSafe(API_ENDPOINTS.AUTH.LOGIN, {
            email,
            password,
            device_id: deviceInfo.device_id,
            device_name: deviceInfo.model,
        }, 'POST');

        // ─── Case 1: Require 2FA ──────────────────────────────────────────────
        if (raw?.requires_2fa) {
            set({ require2FA: true, tempUserId: raw.user?.id });
            return;
        }

        // ─── Case 2: Direct Login (Trusted Device) ────────────────────────────
        await get().finalizeLogin(raw);
    },

    verify2FA: async (code, rememberDevice) => {
        const { tempUserId } = get();
        if (!tempUserId) throw new Error('Phiên xác thực không hợp lệ.');

        const raw = await ApiClient.actionSafe(API_ENDPOINTS.AUTH.VERIFY_2FA, {
            user_id: tempUserId,
            code,
            remember_device: rememberDevice,
        }, 'POST');

        await get().finalizeLogin(raw);
        set({ require2FA: false, tempUserId: null });
    },

    resend2FA: async () => {
        const { tempUserId } = get();
        if (!tempUserId) return;
        await ApiClient.fetchSafe(API_ENDPOINTS.AUTH.RESEND_2FA, { user_id: tempUserId }, 'POST');
    },

    cancel2FA: () => set({ require2FA: false, tempUserId: null }),

    loginSocial: async (provider, socialToken) => {
        // [HARDENING]: Use centralized endpoints instead of hardcoded strings
        const endpoint = provider === 'google'
            ? API_ENDPOINTS.AUTH.SOCIAL.GOOGLE_CALLBACK
            : API_ENDPOINTS.AUTH.SOCIAL.FACEBOOK_CALLBACK;

        const raw = await ApiClient.fetchSafe(endpoint as any, {
            token: socialToken,
            device_id: HardwareService.getDeviceInfo().device_id,
        }, 'POST');
        await get().finalizeLogin(raw);
    },

    finalizeLogin: async (raw: any) => {
        const parsed = LoginDataSchema.safeParse(raw);
        let access_token = '';
        let user = null;

        if (parsed.success) {
            access_token = parsed.data.access_token;
            user = parsed.data.user;
        } else {
            // Zero-Crash Fallback
            access_token = raw.token || raw.access_token;
            user = raw.user?.user || raw.user || {};
            if (!access_token) throw new Error('Dữ liệu server không hợp lệ (Missing Token).');
        }

        await StorageService.saveToken(access_token);
        await StorageService.saveUser(user);

        if (user?.auth_domains && Array.isArray(user.auth_domains)) {
            setDynamicAuthDomains(user.auth_domains);
        }

        set({ token: access_token, user: user as any, isLoggedIn: true });

        // Tự động đăng ký Push Token sau khi đăng nhập thành công
        NotificationService.registerDevice().catch(err =>
            console.error('[AuthStore] registerDevice sau login lỗi:', err)
        );
    },

    // ─── Đăng xuất ─────────────────────────────────────────────────────────────
    logout: async () => {
        try {
            await ApiClient.fetchSafe(API_ENDPOINTS.AUTH.LOGOUT, undefined, 'POST');
        } catch { }
        await StorageService.clearSession();
        setDynamicAuthDomains([]); // Reset the whitelist on logout
        set({ token: null, user: null, isLoggedIn: false, require2FA: false, tempUserId: null });
    },

    // ─── Cập nhật user (từ profile screen) ────────────────────────────────────
    updateUser: (partial) => {
        const currentUser = get().user;
        if (!currentUser) return;
        const updated = { ...currentUser, ...partial };
        set({ user: updated });
        if (updated.auth_domains && Array.isArray(updated.auth_domains)) {
            setDynamicAuthDomains(updated.auth_domains);
        }
        StorageService.saveUser(updated).catch(err => console.error('[AuthStore] updateUser persist lỗi:', err));
    },
}));

// ─── Đăng ký logout handler cho ApiClient (401 interceptor) ──────────────────
registerLogoutHandler(() => {
    useAuthStore.getState().logout();
});
