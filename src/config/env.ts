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
    console.error('\n🛑 =====================================================');
    console.error('🛑 LỖI CẤU HÌNH NGHIÊM TRỌNG – App không thể khởi động');
    console.error('🛑 =====================================================');
    console.error(JSON.stringify(errors, null, 2));
    console.error('📄 Tạo file .env từ .env.example và điền đầy đủ\n');
    throw new Error('⚠️  FATAL CONFIG ERROR: Kiểm tra file .env');
}

export const Env = parsed.data;
export const IS_DEV = Env.EXPO_PUBLIC_ENV === 'development';
export const IS_PROD = Env.EXPO_PUBLIC_ENV === 'production';
