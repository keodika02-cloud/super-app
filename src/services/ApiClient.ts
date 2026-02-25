/**
 * src/services/ApiClient.ts
 * SINGLE RESPONSIBILITY: Mọi HTTP request đi qua đây.
 *
 * Tính năng:
 *   - Tự động thêm Bearer Token từ StorageService
 *   - Tự động bóc Envelope { code, data, message, trace_id }
 *   - 401 → tự động logout (gọi useAuthStore.logout)
 *   - Lỗi network → throw lỗi tường minh với trace_id
 *   - Timeout tự cấu hình từ .env
 *   - Không bao giờ để lỗi âm thầm
 */
import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Env } from '@config/env';
import { StorageService } from './StorageService';
import { z } from 'zod';
import { EndpointConfig } from '../config/api-endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiEnvelope<T = unknown> {
    code: number;
    status: 'success' | 'error' | 'fail';
    message: string;
    data: T;
    meta?: {
        page: number;
        limit: number;
        total: number;
        last_page: number;
    };
    trace_id: string;
    error?: {
        type: string;
        details: unknown;
    };
    errors?: Record<string, string[]>;
}

export class ApiError extends Error {
    code: number;
    trace_id: string;
    errors?: Record<string, string[]>;

    constructor(message: string, code: number, trace_id: string, errors?: Record<string, string[]>) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.trace_id = trace_id;
        this.errors = errors;
    }
}

// ─── Khởi tạo Axios instance ─────────────────────────────────────────────────

const instance: AxiosInstance = axios.create({
    baseURL: Env.EXPO_PUBLIC_API_URL,
    timeout: Env.EXPO_PUBLIC_API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-App-Version': Env.EXPO_PUBLIC_APP_VERSION,
        'X-Platform': 'mobile',
    },
});

// ─── Response Interceptor: Bóc Envelope + Xử lý lỗi ─────────────────────────

// Lazy import để tránh circular dependency với AuthStore
let _logoutFn: (() => void) | null = null;
export function registerLogoutHandler(fn: () => void) {
    _logoutFn = fn;
}

// ─── Token Refresh Queue & 429 Config & Circuit Breaker ───────────────
let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void; config: InternalAxiosRequestConfig }[] = [];

// [HARDENING] Circuit Breaker Pattern
let failureCount = 0;
let circuitOpen = false;
let circuitResetTime = 0;
const MAX_FAILURES = 5;
const RESET_TIMEOUT_MS = 30000; // 30s pause after 5 continuous failures

// Request Interceptor: Reject immediately if Circuit is OPEN
instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    if (circuitOpen) {
        if (Date.now() > circuitResetTime) {
            // Nửa mở (Half-Open): cho phép 1 request lọt qua thử
            circuitOpen = false;
        } else {
            return Promise.reject(new ApiError('Hệ thống đang quá tải hoặc mất mạng liên tục. Vui lòng đợi 30s.', 503, 'circuit-open'));
        }
    }

    const token = await StorageService.getToken();
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token && prom.config.headers) {
            prom.config.headers['Authorization'] = `Bearer ${token}`;
            prom.resolve(instance(prom.config));
        }
    });
    failedQueue = [];
};

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

instance.interceptors.response.use(
    (response: AxiosResponse<ApiEnvelope>) => {
        // [HARDENING] Circuit Breaker: Request thành công -> Xóa lỗi
        failureCount = 0;
        circuitOpen = false;

        const envelope = response.data;

        // Guard: PHP 500 trả HTML thay vì JSON → bắt ngay thay vì crash downstream
        if (typeof envelope !== 'object' || envelope === null) {
            throw new ApiError('Server trả dữ liệu không hợp lệ (không phải JSON). Liên hệ admin.', 500, 'invalid-response-type');
        }

        // HTTP 200 nhưng business logic lỗi (envelope.code !== 200)
        if (envelope.code !== undefined && envelope.code !== 200) {
            const msg = envelope.message ?? 'Dữ liệu không hoàn thiện';
            console.warn(`[ApiClient] Business logic notice ${envelope.code} | trace: ${envelope.trace_id ?? 'no-trace'} | ${msg}`);
            throw new ApiError(msg, envelope.code, envelope.trace_id ?? 'no-trace', envelope.errors);
        }

        return { ...response, data: envelope.data ?? {} } as any;
    },
    async (error: AxiosError<ApiEnvelope>) => {
        const status = error.response?.status;
        const envelope = error.response?.data;
        const traceId = envelope?.trace_id ?? 'no-trace';
        const message = envelope?.message ?? error.message ?? 'Lỗi kết nối máy chủ';
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // [HARDENING] Circuit Breaker: Tính lỗi network hoặc 5xx
        if (!status || status >= 500) {
            failureCount++;
            if (failureCount >= MAX_FAILURES) {
                console.error(`[CircuitBreaker] OPEN: Quá ${MAX_FAILURES} lỗi liên tiếp. Tạm dừng request trong 30s.`);
                circuitOpen = true;
                circuitResetTime = Date.now() + RESET_TIMEOUT_MS;
            }
        } else if (status < 500 && status !== 429) {
            // Nếu lỗi 4xx client (auth, validation) -> Không tính là lỗi hệ thống sập
            failureCount = 0;
            circuitOpen = false;
        }

        console.warn(`[ApiClient] Request inhibited ${status} | trace: ${traceId} | ${message}`);

        // ─── 429 Rate Limit (DDoS Protection) ──────────────────────────────────
        if (status === 429 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            // Parse Retry-After header (seconds) or fallback to 5 seconds
            const retryAfterStr = error.response?.headers['retry-after'];
            const retryAfterMs = retryAfterStr ? parseInt(retryAfterStr) * 1000 : 5000;

            console.warn(`[ApiClient] 429 Rate Limit - Tạm dừng request trong ${retryAfterMs}ms`);
            await sleep(retryAfterMs);
            return instance(originalRequest);
        }

        // ─── 401 Unauthorized & Token Refresh ──────────────────────────────────
        if (status === 401 && originalRequest && !originalRequest._retry) {
            if (isRefreshing) {
                // Đang refresh -> Đẩy request hiện tại vào queue chờ
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject, config: originalRequest });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Gọi tới endpoint auth/refresh (Giả định là /auth/refresh)
                // Trong môi trường Antigravity thường không có refresh token, 
                // nhưng pattern này chuẩn để dev thật có thể integrate backend
                console.info('[ApiClient] Bắt đầu Refresh Token...');
                const currentToken = await StorageService.getToken();

                // NOTE: Thay URL này bằng endpoint thật nếu backend có support
                const refreshResponse = await axios.post(`${Env.EXPO_PUBLIC_API_URL}/auth/refresh`, {}, {
                    headers: { 'Authorization': `Bearer ${currentToken}` }
                });

                const newToken = refreshResponse.data?.data?.access_token;

                if (newToken) {
                    await StorageService.saveToken(newToken);
                    processQueue(null, newToken);

                    // Đừng quên thử lại request gốc
                    if (originalRequest.headers) {
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    }
                    return instance(originalRequest);
                } else {
                    throw new Error('Refresh Token response missing token');
                }
            } catch (refreshError) {
                console.warn('[ApiClient] Refresh Token thất bại → Tiến hành Logout', refreshError);
                processQueue(refreshError as Error, null);
                await StorageService.clearSession();
                _logoutFn?.();
                throw new ApiError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 401, traceId);
            } finally {
                isRefreshing = false;
            }
        }

        // Nếu 401 mà _retry = true (đã thử refresh mà vẫn tịt)
        if (status === 401) {
            await StorageService.clearSession();
            _logoutFn?.();
            throw new ApiError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 401, traceId);
        }

        // 403 → Bị ban / Không có quyền
        if (status === 403) {
            throw new ApiError(message, 403, traceId);
        }

        // 426 → Bắt buộc cập nhật app
        if (status === 426) {
            throw new ApiError('Đã có phiên bản mới. Vui lòng cập nhật App.', 426, traceId);
        }

        // 503 → Bảo trì
        if (status === 503) {
            throw new ApiError('Hệ thống đang bảo trì. Vui lòng thử lại sau.', 503, traceId);
        }

        // Network error (không có internet)
        if (!error.response) {
            throw new ApiError('Không có kết nối mạng. Kiểm tra Wifi hoặc 4G.', 0, 'network-error');
        }

        throw new ApiError(message, status ?? 500, traceId, envelope?.errors);
    },
);

// ─── Helper methods ───────────────────────────────────────────────────────────

async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const res = await instance.get<T>(url, { params });
    return res.data as T;
}

async function post<T>(url: string, data?: unknown): Promise<T> {
    const res = await instance.post<T>(url, data);
    return res.data as T;
}

async function put<T>(url: string, data?: unknown): Promise<T> {
    const res = await instance.put<T>(url, data);
    return res.data as T;
}

async function del<T>(url: string): Promise<T> {
    const res = await instance.delete<T>(url);
    return res.data as T;
}

async function reportParseError(endpointPath: string, errorType: 'Request' | 'Response', error: z.ZodError, rawData: any) {
    try {
        await instance.post('/v3/app/logs', {
            level: 'error',
            message: `Zod Parse Error on ${endpointPath} (${errorType})`,
            context: {
                issues: error.issues,
                raw_data: rawData
            }
        });
    } catch (e) {
        console.warn('[ApiClient] Failed to report parse error', e);
    }
}

async function fetchSafe<TReq extends z.ZodTypeAny, TRes extends z.ZodTypeAny>(
    endpoint: EndpointConfig<TReq, TRes>,
    data?: z.infer<TReq>,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
): Promise<z.infer<TRes>> {
    // 1. Validate Request
    const parsedReq = endpoint.req.safeParse(data);
    if (!parsedReq.success) {
        console.error(`[ApiClient] Request Validation Failed for ${endpoint.path}`, parsedReq.error);
        reportParseError(endpoint.path, 'Request', parsedReq.error, data);
    }
    const payload = parsedReq.success ? parsedReq.data : data;

    // 2. Execute Request
    let axiosRes: AxiosResponse<any>;
    if (method === 'GET') axiosRes = await instance.get(endpoint.path, { params: payload });
    else if (method === 'POST') axiosRes = await instance.post(endpoint.path, payload);
    else if (method === 'PUT') axiosRes = await instance.put(endpoint.path, payload);
    else axiosRes = await instance.delete(endpoint.path);

    // 3. Validate Response
    const parsedRes = endpoint.res.safeParse(axiosRes.data);
    if (!parsedRes.success) {
        console.error(`[ApiClient] Response Validation Failed for ${endpoint.path}. Using fallback.`, parsedRes.error);
        reportParseError(endpoint.path, 'Response', parsedRes.error, axiosRes.data);
        return endpoint.fallbackRes; // Zero-Crash Guarantee
    }

    return parsedRes.data;
}

// [HARDENING]: Implementation of real upload progress via Axios (Safe Version)
async function uploadFormDataSafe<TReq extends z.ZodTypeAny, TRes extends z.ZodTypeAny>(
    endpoint: EndpointConfig<TReq, TRes>,
    formData: FormData,
    timeoutMs = 120000,
    onProgress?: (progress: number) => void
): Promise<z.infer<TRes>> {
    const axiosRes = await instance.post(endpoint.path, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: timeoutMs,
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted);
            }
        },
    });

    const parsedRes = endpoint.res.safeParse(axiosRes.data);
    if (!parsedRes.success) {
        console.error(`[ApiClient] Response Validation Failed for ${endpoint.path} (Upload)`, parsedRes.error);
        reportParseError(endpoint.path, 'Response', parsedRes.error, axiosRes.data);
        return endpoint.fallbackRes;
    }
    return parsedRes.data;
}

// [HARDENING]: Mẫu cho code cũ (Legacy)
async function uploadFormData<T>(url: string, formData: FormData, timeoutMs = 120000, onProgress?: (progress: number) => void): Promise<T> {
    const res = await instance.post<T>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: timeoutMs,
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted);
            }
        },
    });
    return res.data as T;
}

export const ApiClient = {
    instance,
    get, post, put, delete: del, uploadFormData,
    fetchSafe, uploadFormDataSafe,
    registerLogoutHandler,
};
