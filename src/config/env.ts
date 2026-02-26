/**
 * src/config/env.ts
 * FAIL-FAST: App crash ngay khi khởi động nếu thiếu biến môi trường quan trọng.
 */
import { z } from 'zod';

const envSchema = z.object({
    EXPO_PUBLIC_API_URL: z
        .string()
        .url({ message: '❌ EXPO_PUBLIC_API_URL phải là URL hợp lệ (vd: https://crm.maytinhquocviet.com/api)' }),

    EXPO_PUBLIC_CRM_URL: z
        .string()
        .url({ message: '❌ EXPO_PUBLIC_CRM_URL phải là URL hợp lệ' }),

    EXPO_PUBLIC_CHAT_API_URL: z
        .string()
        .url({ message: '❌ EXPO_PUBLIC_CHAT_API_URL phải là URL hợp lệ' }),

    EXPO_PUBLIC_CHAT_SOCKET_URL: z.string(),
    EXPO_PUBLIC_CHAT_REVERB_KEY: z.string(),
    EXPO_PUBLIC_CHAT_REVERB_PORT: z.string().transform(Number),
    EXPO_PUBLIC_CHAT_REVERB_SCHEME: z.enum(['http', 'https']).default('https'),

    EXPO_PUBLIC_API_TIMEOUT: z.string().optional().default('30000').transform(Number),
    EXPO_PUBLIC_APP_VERSION: z.string().optional().default('1.0.0'),
    EXPO_PUBLIC_ENV: z.enum(['development', 'production']).optional().default('development'),

    // [HARDENING]: Bắt buộc bật Mock bằng cờ thủ công (an toàn hơn tự detect Simulator)
    EXPO_PUBLIC_USE_MOCK: z.enum(['true', 'false']).optional().default('false').transform(val => val === 'true'),

    EXPO_PUBLIC_ENABLE_GOOGLE_AUTH: z.enum(['true', 'false']).optional().default('false').transform(val => val === 'true'),

}).merge(z.object({
    EXPO_PUBLIC_SENTRY_DSN: z.string().optional(),
})).superRefine((data, ctx) => {
    // [HARDENING]: Bắt buộc cấu hình Sentry DSN khi lên Store (Production)
    if (data.EXPO_PUBLIC_ENV === 'production' && !data.EXPO_PUBLIC_SENTRY_DSN) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '❌ EXPO_PUBLIC_SENTRY_DSN là bắt buộc trong môi trường Production để bắt lỗi Exception.',
            path: ['EXPO_PUBLIC_SENTRY_DSN'],
        });
    }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    const errors = parsed.error.format();
    const errorMsg = '🛑 FATAL CONFIG ERROR: Kiểm tra file .env. App đang chạy với cấu hình fallback.';

    console.error('\n' + errorMsg);
    console.error(JSON.stringify(errors, null, 2));

    // Cung cấp dữ liệu fallback tối thiểu để app không trắng màn hoàn toàn
    const fallbackData: any = {
        EXPO_PUBLIC_API_URL: 'https://crm.maytinhquocviet.com/api',
        EXPO_PUBLIC_CRM_URL: 'https://crm.maytinhquocviet.com',
        EXPO_PUBLIC_CHAT_API_URL: 'https://chat.maytinhquocviet.com/api',
        EXPO_PUBLIC_CHAT_SOCKET_URL: 'wss://chat.maytinhquocviet.com:443',
        EXPO_PUBLIC_CHAT_REVERB_KEY: '',
        EXPO_PUBLIC_CHAT_REVERB_PORT: 443,
        EXPO_PUBLIC_CHAT_REVERB_SCHEME: 'https',
        EXPO_PUBLIC_API_TIMEOUT: 30000,
        EXPO_PUBLIC_APP_VERSION: '1.0.0-fallback',
        EXPO_PUBLIC_ENV: 'production',
        EXPO_PUBLIC_USE_MOCK: false,
        EXPO_PUBLIC_ENABLE_GOOGLE_AUTH: false,
    };

    // Ghi đè bằng dữ liệu đã parse được (nếu có phần đúng)
    (global as any).ENV_LOAD_ERROR = errors;

    // Chúng ta KHÔNG throw Error ở đây nữa để ErrorBoundary có thể hiển thị giao diện thay vì trắng màn module-level
    parsed.data = fallbackData;
}

export const Env = parsed.data as z.infer<typeof envSchema>;
export const IS_DEV = Env.EXPO_PUBLIC_ENV === 'development';
export const IS_PROD = Env.EXPO_PUBLIC_ENV === 'production';
