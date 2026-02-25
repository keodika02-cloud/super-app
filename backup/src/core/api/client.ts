import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { DeviceEventEmitter } from 'react-native';
import { ENV } from '@/core/config/env';
import { SecureStorage, STORAGE_KEYS } from '@/core/storage';

/**
 * Envelope Response Type (Laravel ApiResponse trait)
 */
export interface EnvelopeResponse<T = any> {
    code: number;
    status: 'success' | 'error';
    message: string;
    data: T;
    trace_id?: string;
    errors?: Record<string, string[]>; // Laravel validation errors
}

/**
 * Create Axios Instance
 */
export const apiClient = axios.create({
    baseURL: ENV.API_URL,
    timeout: ENV.API_TIMEOUT || 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

/**
 * REQUEST INTERCEPTOR: Attach Bearer Token
 */
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await SecureStorage.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (__DEV__) {
            console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR: THE GATEKEEPER
 * ✅ CRITICAL: Strict Unwrap Strategy
 * - Hoặc unwrap thành công → return data thật
 * - Hoặc throw error → không có trạng thái lửng lơ
 */
apiClient.interceptors.response.use(
    (response) => {
        const contentType = response.headers['content-type'];

        // 1. Guard: Check JSON Content-Type (HTML Guard)
        if (!contentType?.includes('application/json')) {
            throw new Error(
                'Invalid Response: Server returned HTML (Possible 500 Error or Maintenance Mode)'
            );
        }

        const envelope = response.data as EnvelopeResponse;

        // 2. Guard: Check Envelope Structure
        if (envelope && typeof envelope.code === 'number') {
            // Business Error Check (code !== 200 trong body 200)
            if (envelope.code !== 200) {
                // Ném lỗi để error handler xử lý
                const error: any = new Error(envelope.message || 'Business Error');
                error.response = response;
                error.isBusinessError = true;
                error.businessCode = envelope.code;
                return Promise.reject(error);
            }

            // ✅ SUCCESS: Strict Unwrap
            // CRITICAL: Trả về DATA THẬT, không còn vỏ envelope
            // Điều này có nghĩa là ở API layer, bạn nhận được User object trực tiếp
            return envelope.data;
        }

        // 3. Fallback: API cũ chưa chuẩn Envelope
        return response.data;
    },
    async (error: AxiosError) => {
        // 🛑 KILL SWITCH: 401 Unauthorized
        if (error.response?.status === 401) {
            const originalRequest = error.config as InternalAxiosRequestConfig;

            // Avoid loop if already on login or check-session endpoints
            if (!originalRequest.url?.includes('/login') && !originalRequest.url?.includes('/user')) {
                console.warn('🔒 Session expired. Logging out...');

                await SecureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                await SecureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
                await SecureStorage.removeItem(STORAGE_KEYS.USER_INFO);

                DeviceEventEmitter.emit('auth:session-expired');
            }
        }

        // 🛑 NORMALIZE ERROR: Laravel Validation (422)
        const data = error.response?.data as any;
        if (error.response?.status === 422 && data?.errors) {
            // Chuẩn hóa lỗi Laravel { message, errors } thành format dễ đọc
            error.message = data.message || 'Dữ liệu không hợp lệ';

            // Attach validation errors để UI có thể hiển thị chi tiết
            (error as any).validationErrors = data.errors;
        }

        // Parse error message from envelope (nếu có)
        const envelope = error.response?.data as EnvelopeResponse;
        if (envelope?.message) {
            error.message = envelope.message;
        }

        if (__DEV__) {
            console.error(`❌ API Error: ${error.response?.status} - ${error.message}`);
        }

        return Promise.reject(error);
    }
);

export default apiClient;
