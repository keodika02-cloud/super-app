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
import { EndpointConfig, ApiDomain } from '../config/api-endpoints';

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

// ─── Khởi tạo Axios instances ───────────────────────────────────────────────
const commonConfig = {
    timeout: Env.EXPO_PUBLIC_API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-App-Version': Env.EXPO_PUBLIC_APP_VERSION,
        'X-Platform': 'mobile',
    },
};

const crmInstance: AxiosInstance = axios.create({
    ...commonConfig,
    baseURL: Env.EXPO_PUBLIC_API_URL,
});

const chatInstance: AxiosInstance = axios.create({
    ...commonConfig,
    baseURL: Env.EXPO_PUBLIC_CHAT_API_URL,
});

/**
 * Resolver để lấy axios instance theo domain
 */
function getDelegate(domain?: string): AxiosInstance {
    return domain === 'CHAT' ? chatInstance : crmInstance;
}


// ─── Response Interceptor: Bóc Envelope + Xử lý lỗi ─────────────────────────

// Lazy import để tránh circular dependency với AuthStore
let _logoutFn: (() => void) | null = null;
export function registerLogoutHandler(fn: () => void) {
    _logoutFn = fn;
}

// ─── Tầng Kiểm duyệt Token Đa Tên Miền (White-list) ─────────────────────────
let _dynamicAuthDomains: string[] = [];
export function setDynamicAuthDomains(domains: string[]) {
    _dynamicAuthDomains = domains;
    console.log(`[ApiClient] 🛡️ Dynamic Auth Domains updated:`, domains);
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

// ─── Lựa chọn hiển thị Debug trên Terminal ────────────────────────────────────
export const API_LOG_CONFIG = {
    request: false,         // Bật/tắt log khi bắn request mới (TẮT ĐỂ APP NHANH HƠN)
    response: false,        // Bật/tắt log báo nhận thành công envelope.
    schemaValidation: false,// Bật/tắt log parse ZOD thành công (TẮT ĐỂ TRÁNH LAG TRÊN JS THREAD)
    errors: true,           // Bật/tắt log show chi tiết trace lỗi mạng (NÊN BẬT)
};

/**
 * Setup Interceptors cho từng instance
 */
function setupInterceptors(targetInstance: AxiosInstance) {
    targetInstance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
        if (circuitOpen) {
            if (Date.now() > circuitResetTime) {
                // Nửa mở (Half-Open): cho phép 1 request lọt qua thử
                circuitOpen = false;
            } else {
                return Promise.reject(new ApiError('Hệ thống CRM đang bị nghẽn (Block 30s). Vui lòng đợi.', 503, 'circuit-open'));
            }
        }

        if (API_LOG_CONFIG.request) {
            console.log(`[ApiClient] 📡 Requesting: ${config.url?.startsWith('http') ? config.url : (config.baseURL || '') + (config.url || '')}`);
        }

        const token = await StorageService.getToken();

        // [HARDENING] Yêu cầu Bảo Mật Trọng Tâm:
        // App gọi tự do đa hệ sinh thái. Nhưng Token nội bộ (CRM) CHỈ truyền cho danh sách an toàn:
        // 1. Mặc định cứng: maytinhquocviet.com (luôn luôn)
        // 2. Linh hoạt: Do Backend cấu hình trong mảng `auth_domains` của UserProfile
        const fullUrl = config.url?.startsWith('http') ? config.url : `${config.baseURL || ''}${config.url || ''}`;

        const isCoreDomain = !fullUrl.startsWith('http')
            || fullUrl.includes('.maytinhquocviet.com')
            || fullUrl.includes('//maytinhquocviet.com');

        const isDynamicDomain = Array.isArray(_dynamicAuthDomains) && _dynamicAuthDomains.some(domain => domain && domain.trim() !== '' && fullUrl.includes(domain));

        if (token && config.headers && (isCoreDomain || isDynamicDomain)) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    targetInstance.interceptors.response.use(
        (response: AxiosResponse<ApiEnvelope>) => {
            // [HARDENING] Circuit Breaker: Request thành công -> Xóa lỗi
            failureCount = 0;
            circuitOpen = false;

            const envelope = response.data;

            // Guard: PHP 500 trả HTML thay vì JSON
            if (typeof envelope !== 'object' || envelope === null) {
                throw new ApiError('Server trả dữ liệu không hợp lệ (không phải JSON). Liên hệ admin.', 500, 'invalid-response-type');
            }

            // HTTP 2xx nhưng business logic có thể trả code khác 200 (vd: 201 Created)
            const isSuccess = envelope.code !== undefined && envelope.code >= 200 && envelope.code < 300;

            if (envelope.code !== undefined && !isSuccess) {
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
            const isSilentLog = originalRequest?.url?.includes('/v3/app/logs');

            // [HARDENING] Circuit Breaker
            if (!status || status >= 500) {
                if (!isSilentLog) {
                    failureCount++;
                    if (failureCount >= MAX_FAILURES) {
                        console.error(`[CircuitBreaker] OPEN: Quá ${MAX_FAILURES} lỗi liên tiếp. Tạm dừng request trong 30s.`);
                        circuitOpen = true;
                        circuitResetTime = Date.now() + RESET_TIMEOUT_MS;
                    }
                }
            } else if (status < 500 && status !== 429) {
                failureCount = 0;
                circuitOpen = false;
            }

            if (API_LOG_CONFIG.errors && !isSilentLog) {
                console.warn(`[ApiClient] Request inhibited ${status} | trace: ${traceId} | ${message}`);
            }

            // 429 Rate Limit
            if (status === 429 && originalRequest && !originalRequest._retry) {
                originalRequest._retry = true;
                const retryAfterStr = error.response?.headers['retry-after'];
                const retryAfterMs = retryAfterStr ? parseInt(retryAfterStr) * 1000 : 5000;
                await sleep(retryAfterMs);
                return targetInstance(originalRequest);
            }

            // 401 Unauthorized
            if (status === 401 && originalRequest && !originalRequest._retry) {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject, config: originalRequest });
                    });
                }
                originalRequest._retry = true;
                isRefreshing = true;
                try {
                    const currentToken = await StorageService.getToken();
                    const refreshResponse = await axios.post(`${Env.EXPO_PUBLIC_API_URL}/auth/refresh`, {}, {
                        headers: { 'Authorization': `Bearer ${currentToken}` }
                    });
                    const newToken = refreshResponse.data?.data?.access_token;
                    if (newToken) {
                        await StorageService.saveToken(newToken);
                        failedQueue.forEach(prom => {
                            if (prom.config.headers) prom.config.headers['Authorization'] = `Bearer ${newToken}`;
                            prom.resolve(targetInstance(prom.config));
                        });
                        failedQueue = [];
                        if (originalRequest.headers) originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        return targetInstance(originalRequest);
                    }
                    throw new Error('Refresh failed');
                } catch (refreshError) {
                    failedQueue.forEach(prom => prom.reject(refreshError));
                    failedQueue = [];
                    await StorageService.clearSession();
                    _logoutFn?.();
                    throw new ApiError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 401, traceId);
                } finally {
                    isRefreshing = false;
                }
            }

            if (status === 401) {
                await StorageService.clearSession();
                _logoutFn?.();
                throw new ApiError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 401, traceId);
            }
            if (status === 403) {
                throw new ApiError(message, 403, traceId);
            }
            if (status === 426) {
                throw new ApiError('Đã có phiên bản mới. Vui lòng cập nhật App.', 426, traceId);
            }

            // 503 → Bảo trì
            if (status === 503) {
                throw new ApiError('Hệ thống đang bảo trì. Vui lòng thử lại sau.', 503, traceId);
            }
            if (!error.response) {
                if (isSilentLog) return Promise.reject(new ApiError('Silent Logger Error', 0, 'none'));
                throw new ApiError('Không có kết nối mạng. Kiểm tra Wifi hoặc 4G.', 0, 'network-error');
            }
            if (isSilentLog) return Promise.reject(new ApiError('Silent', status ?? 500, traceId));
            throw new ApiError(message, status ?? 500, traceId, envelope?.errors);
        }
    );
}

// Khởi chạy interceptors cho cả 2 đầu
setupInterceptors(crmInstance);
setupInterceptors(chatInstance);

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Helper methods ───────────────────────────────────────────────────────────

async function get<T>(url: string, params?: Record<string, unknown>, domain: ApiDomain = 'CRM'): Promise<T> {
    const delegate = getDelegate(domain);
    const res = await delegate.get<T>(url, { params });
    return res.data as T;
}

async function post<T>(url: string, data?: unknown, domain: ApiDomain = 'CRM'): Promise<T> {
    const delegate = getDelegate(domain);
    const res = await delegate.post<T>(url, data);
    return res.data as T;
}

async function fetchSafe<TReq extends z.ZodTypeAny, TRes extends z.ZodTypeAny>(
    endpoint: EndpointConfig<TReq, TRes>,
    data?: z.infer<TReq>,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
): Promise<z.infer<TRes>> {
    const delegate = getDelegate(endpoint.domain);

    // 1. Validate Request
    const parsedReq = endpoint.req.safeParse(data);
    if (!parsedReq.success) {
        if (API_LOG_CONFIG.errors) console.warn(`[ApiClient] Request Validation Failed for ${endpoint.path}`, parsedReq.error);
    }
    const payload = parsedReq.success ? parsedReq.data : data;

    // [HARDENING] Path Parameters replacement (e.g. /users/{id} -> /users/123)
    let finalPath: string = endpoint.path;
    if (payload && typeof payload === 'object') {
        Object.keys(payload).forEach(key => {
            const placeholder = `{${key}}`;
            if (finalPath.includes(placeholder)) {
                finalPath = finalPath.replace(placeholder, String((payload as any)[key]));
            }
        });
    }

    // [MEDIA] Handle Multipart Form Data
    const isMultipart = (endpoint as any).isMultipart || false;
    let requestPayload: any = payload;
    let requestHeaders: Record<string, string> = {};

    if (isMultipart && payload && typeof payload === 'object') {
        const formData = new FormData();
        Object.keys(payload).forEach(key => {
            const value = (payload as any)[key];
            if (value !== undefined && value !== null) {
                // Nếu là file của React Native (có uri)
                if (typeof value === 'object' && value.uri) {
                    formData.append(key, value as any);
                } else {
                    formData.append(key, String(value));
                }
            }
        });
        requestPayload = formData;
        requestHeaders['Content-Type'] = 'multipart/form-data';
    }

    // 2. Execute Request
    let axiosRes: AxiosResponse<any>;
    try {
        if (method === 'GET') axiosRes = await delegate.get(finalPath, { params: payload });
        else if (method === 'POST') axiosRes = await delegate.post(finalPath, requestPayload as any, { headers: requestHeaders });
        else if (method === 'PUT') axiosRes = await delegate.put(finalPath, requestPayload as any, { headers: requestHeaders });
        else axiosRes = await delegate.delete(finalPath);
    } catch (err: any) {
        if (API_LOG_CONFIG.errors) {
            console.warn(`[ApiClient] ❌ Lỗi gọi API [${method}] tới: ${finalPath}`);
            const errorMsg = err?.message || String(err);
            console.warn(`Chi tiết lỗi RAW:`, errorMsg, err?.response?.data || '');
        }

        // [HARDENING] Phản hồi lỗi trực tiếp lên UI nếu là mảng Layout
        if (Array.isArray(endpoint.fallbackRes)) {
            return [
                {
                    type: 'UnknownBlock',
                    id: 'api-network-error',
                    data: {
                        error: `LỖI MẠNG ĐẾN: ${finalPath}`,
                        details: `Network Info: ${err?.message || String(err)}`
                    }
                },
                ...endpoint.fallbackRes
            ] as any;
        }

        return endpoint.fallbackRes;
    }

    // 3. Validate Response
    if (API_LOG_CONFIG.response) {
        console.log(`[ApiClient] ✅ Received response from ${endpoint.path}. Validating schema...`);
    }

    const parsedRes = endpoint.res.safeParse(axiosRes.data);
    if (!parsedRes.success) {
        console.group(`[ApiClient] ❌ SCHEMA MISMATCH for ${endpoint.path}`);
        console.warn('The backend returned data that does not match the app schema.');
        console.warn('Issues:', JSON.stringify(parsedRes.error.format(), null, 2));
        console.groupEnd();

        // [HARDENING] Gửi log lỗi cấu trúc về Backend
        delegate.post('/v3/app/logs', {
            level: 'error',
            message: `[Schema Mismatch GET] API: ${endpoint.path}`,
            context: {
                issues: parsedRes.error.format(),
                actual_data: axiosRes.data,
            }
        }).catch(() => { });

        // [HARDENING] Phản hồi lỗi trực tiếp lên UI nếu là mảng Layout
        if (Array.isArray(endpoint.fallbackRes)) {
            return [
                {
                    type: 'UnknownBlock',
                    id: 'api-error',
                    data: {
                        error: `LỖI SAI CẤU TRÚC TỪ: ${endpoint.path}`,
                        details: JSON.stringify(parsedRes.error.format(), null, 2)
                    }
                },
                ...endpoint.fallbackRes
            ] as any;
        }

        return endpoint.fallbackRes;
    }

    if (API_LOG_CONFIG.schemaValidation) {
        console.log(`[ApiClient] ✨ ${endpoint.path} parse successful. Data is safe.`);
    }
    return parsedRes.data;
}

// Hàm dành riêng cho các Action / Submit Form (Login, Checkin, Bắn tin nhắn...)
// Sẽ quăng lỗi ApiError ra ngoài để UI catch và hiển thị cảnh báo (toast/alert) thay vì ỉm đi.
async function actionSafe<TReq extends z.ZodTypeAny, TRes extends z.ZodTypeAny>(
    endpoint: EndpointConfig<TReq, TRes>,
    data?: z.infer<TReq>,
    method: 'POST' | 'PUT' | 'DELETE' = 'POST'
): Promise<z.infer<TRes>> {
    const delegate = getDelegate(endpoint.domain);

    const parsedReq = endpoint.req.safeParse(data);
    if (!parsedReq.success && API_LOG_CONFIG.errors) {
        console.warn(`[ApiClient] Request Validation Failed for ${endpoint.path}`, parsedReq.error);
    }
    const payload = parsedReq.success ? parsedReq.data : data;

    let finalPath: string = endpoint.path;
    if (payload && typeof payload === 'object') {
        Object.keys(payload).forEach(key => {
            const placeholder = `{${key}}`;
            if (finalPath.includes(placeholder)) {
                finalPath = finalPath.replace(placeholder, String((payload as any)[key]));
            }
        });
    }

    const isMultipart = (endpoint as any).isMultipart || false;
    let requestPayload: any = payload;
    let requestHeaders: Record<string, string> = {};

    if (isMultipart && payload && typeof payload === 'object') {
        const formData = new FormData();
        Object.keys(payload).forEach(key => {
            const value = (payload as any)[key];
            if (value !== undefined && value !== null) {
                if (typeof value === 'object' && value.uri) {
                    formData.append(key, value as any);
                } else {
                    formData.append(key, String(value));
                }
            }
        });
        requestPayload = formData;
        requestHeaders['Content-Type'] = 'multipart/form-data';
    }

    // Không dùng try-catch ở đây để quăng lỗi lên Store / Screen
    let axiosRes: AxiosResponse<any>;
    if (method === 'POST') axiosRes = await delegate.post(finalPath, requestPayload as any, { headers: requestHeaders });
    else if (method === 'PUT') axiosRes = await delegate.put(finalPath, requestPayload as any, { headers: requestHeaders });
    else axiosRes = await delegate.delete(finalPath);

    const parsedRes = endpoint.res.safeParse(axiosRes.data);
    if (!parsedRes.success) {
        console.group(`[ApiClient] ❌ SCHEMA MISMATCH for ${endpoint.path}`);
        console.error('Issues:', JSON.stringify(parsedRes.error.format(), null, 2));
        console.groupEnd();

        // Gửi log lỗi lên Server để Backend Fix
        delegate.post('/v3/app/logs', {
            level: 'error',
            message: `[Schema Mismatch POST/PUT] API: ${endpoint.path}`,
            context: {
                issues: parsedRes.error.format(),
                actual_data: axiosRes.data,
            }
        }).catch(() => { });

        throw new ApiError('Dữ liệu từ máy chủ không hợp lệ (Lỗi lập trình Backend).', 500, 'schema-mismatch');
    }

    return parsedRes.data;
}

async function uploadFormData<T>(
    url: string,
    formData: FormData,
    timeout = 120000,
    onProgress?: (percent: number) => void
): Promise<T> {
    const delegate = crmInstance; // Mặc định upload qua CRM
    const res = await delegate.post<ApiEnvelope<T>>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout,
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percent);
            }
        },
    });
    return res.data.data;
}

export const ApiClient = {
    crm: crmInstance,
    chat: chatInstance,
    get,
    post,
    fetchSafe,
    actionSafe,
    postSafe: <TReq extends z.ZodTypeAny, TRes extends z.ZodTypeAny>(endpoint: EndpointConfig<TReq, TRes>, data?: z.infer<TReq>) => fetchSafe(endpoint, data, 'POST'),
    uploadFormData,
    registerLogoutHandler,
};

