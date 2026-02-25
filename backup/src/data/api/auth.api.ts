import { z } from 'zod';
import apiClient from '@/core/api/client';
import { Platform } from 'react-native';

/**
 * ✅ CRITICAL: Zod Schemas for Runtime Validation
 * Tại sao: TypeScript chỉ tồn tại compile-time. Runtime cần Zod để validate.
 */
export const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    role: z.string().optional(),
    avatar: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
});

export const AuthResponseSchema = z.object({
    access_token: z.string().min(1, 'Token không được rỗng'),
    user: UserSchema,
});

// Infer Types from Schemas (Single Source of Truth)
export type User = z.infer<typeof UserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export interface LoginPayload {
    email: string;
    password: string;
    device_name?: string;
}

export interface SocialLoginPayload {
    provider: 'google' | 'apple';
    id_token: string;
    device_name?: string;
}

export const AuthApi = {
    /**
     * Standard Email/Password Login
     * ✅ CRITICAL: Parse response với Zod để catch lỗi ngay
     */
    login: async (payload: LoginPayload): Promise<AuthResponse> => {
        const response = await apiClient.post('/app/login', {
            ...payload,
            device_name: payload.device_name || 'Mobile App',
        });

        // ✅ RUNTIME VALIDATION: Crash ngay nếu Server trả sai cấu trúc
        try {
            return AuthResponseSchema.parse(response);
        } catch (error) {
            console.error('❌ Auth Response Validation Failed:', error);
            throw new Error(
                'Server trả về dữ liệu không hợp lệ. ' +
                'Vui lòng liên hệ IT Support.'
            );
        }
    },

    /**
     * Social Login (Google/Apple)
     * ✅ ANTIGRAVITY GUARD: Mock khi Platform.OS === 'web'
     */
    loginSocial: async (payload: SocialLoginPayload): Promise<AuthResponse> => {
        // 🛡️ ANTIGRAVITY GUARD: Tránh crash khi gọi Native SDK trên Web
        if (Platform.OS === 'web') {
            console.warn('⚠️ Antigravity Mode: Mocking Social Login');

            // Fallback to standard login với test account
            return AuthApi.login({
                email: `test_${payload.provider}@quocviet.com`,
                password: '123456',
            });
        }

        // Mobile: Gọi API thật
        const endpoint = payload.provider === 'apple'
            ? '/auth/apple'
            : '/auth/google';

        const response = await apiClient.post(endpoint, {
            id_token: payload.id_token,
            device_name: payload.device_name || 'Mobile App',
        });

        return AuthResponseSchema.parse(response);
    },

    /**
     * Get Profile
     */
    getProfile: async (): Promise<User> => {
        const response = await apiClient.get('/user');

        try {
            // Unwrapping handled by Client Layer, response IS the data envelope data field (User object in this case, or User inside data?)
            // Based on client.ts, it returns envelope.data.
            // If API returns { data: User }, then UserSchema needs to handle it or we adjust path.
            // Assuming Standard Laravel Resource: { data: { id: ... } }
            // Let's assume client returns the content of 'data'.
            // If getProfile returns User directly, then fine.
            return UserSchema.parse(response);
        } catch (error) {
            console.error('❌ User Profile Validation Failed:', error);
            throw new Error('Dữ liệu profile không hợp lệ');
        }
    },

    /**
     * Logout
     */
    logout: async (): Promise<void> => {
        await apiClient.post('/app/logout');
    },

    /**
     * Delete Account (Apple Guideline 5.1.1 - REQUIRED)
     */
    deleteAccount: async (): Promise<void> => {
        await apiClient.delete('/app/account');
    },
};
