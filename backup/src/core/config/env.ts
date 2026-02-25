import { z } from 'zod';

const envSchema = z.object({
    // ✅ CRITICAL: Bắt buộc HTTPS (trừ localhost)
    API_URL: z.string()
        .url('API_URL không đúng định dạng URL')
        .refine(
            (url) => url.startsWith('http://') || url.startsWith('https://'),
            'API_URL phải bắt đầu bằng http:// hoặc https://'
        )
        .refine(
            (url) => {
                // Allow localhost/127.0.0.1 with http, force https for others
                if (url.includes('localhost') || url.includes('127.0.0.1')) {
                    return true;
                }
                return url.startsWith('https://');
            },
            'API_URL production phải dùng HTTPS (trừ localhost)'
        )
        .transform((url) => url.endsWith('/') ? url.slice(0, -1) : url),

    API_TIMEOUT: z.string()
        .default('30000')
        .transform(Number)
        .refine((n) => n > 0 && n <= 60000, 'API_TIMEOUT phải từ 1-60000ms'),

    // String 'true'/'false' -> Boolean
    USE_MOCK: z.enum(['true', 'false'])
        .default('false')
        .transform((v) => v === 'true'),
});

const _env = {
    API_URL: process.env.EXPO_PUBLIC_API_URL,
    API_TIMEOUT: process.env.EXPO_PUBLIC_API_TIMEOUT,
    USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK,
};

// ✅ Fail Fast Logic
const parsed = envSchema.safeParse(_env);

if (!parsed.success) {
    console.error('❌ FATAL ERROR: Invalid Environment Variables');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('App cannot start due to invalid .env config');
}

export const ENV = parsed.data;
