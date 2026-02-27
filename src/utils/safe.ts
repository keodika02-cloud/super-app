/**
 * src/utils/safe.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * SAFE HELPERS – Toàn bộ thao tác nguy hiểm phải đi qua đây.
 * Không bao giờ throw. Luôn có fallback rõ ràng.
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ─── Date ─────────────────────────────────────────────────────────────────────

/**
 * Parse ngày giờ an toàn – không bao giờ hiển thị "Invalid Date"
 * @example safeDate(null)        → null
 * @example safeDate('xxx')       → null
 * @example safeDate('2026-01-01') → Date object
 */
export function safeDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    try {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    } catch {
        return null;
    }
}

/**
 * Format ngày giờ cho UI – fallback về '–' nếu invalid
 */
export function formatDate(
    value: string | null | undefined,
    options?: Intl.DateTimeFormatOptions,
): string {
    const d = safeDate(value);
    if (!d) return '–';
    try {
        return d.toLocaleDateString('vi-VN', options ?? { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '–';
    }
}

export function formatTime(value: string | null | undefined): string {
    const d = safeDate(value);
    if (!d) return '–';
    try {
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '–';
    }
}

export function formatDateTime(value: string | null | undefined): string {
    const d = safeDate(value);
    if (!d) return '–';
    try {
        return d.toLocaleString('vi-VN');
    } catch {
        return '–';
    }
}

// ─── Number ───────────────────────────────────────────────────────────────────

/** Parse số – fallback 0 nếu NaN/null/undefined */
export function safeNumber(value: unknown, fallback = 0): number {
    const n = Number(value);
    return isNaN(n) ? fallback : n;
}

// ─── String ───────────────────────────────────────────────────────────────────

/** Trim + fallback nếu rỗng/null/undefined */
export function safeStr(value: unknown, fallback = '–'): string {
    if (value === null || value === undefined || value === '') return fallback;
    return String(value).trim() || fallback;
}

// ─── JSON ─────────────────────────────────────────────────────────────────────

/** Parse JSON không throw – fallback về null */
export function safeJSON<T = unknown>(raw: string | null | undefined): T | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

/** Stringify JSON không throw */
export function safeStringify(value: unknown, fallback = '{}'): string {
    try {
        return JSON.stringify(value) ?? fallback;
    } catch {
        return fallback;
    }
}

// ─── URL ──────────────────────────────────────────────────────────────────────

/** Parse URL không throw – trả null nếu invalid */
export function safeURL(url: string | null | undefined): URL | null {
    if (!url) return null;
    try {
        return new URL(url);
    } catch {
        return null;
    }
}

/** Kiểm tra URL có cùng hostname không – không bao giờ crash */
export function isSameHost(url1: string, url2: string): boolean {
    const a = safeURL(url1);
    const b = safeURL(url2);
    if (!a || !b) return false;
    return a.hostname === b.hostname;
}

// ─── Array ────────────────────────────────────────────────────────────────────

/** Chắc chắn trả về array – không bao giờ undefined/null */
export function safeArray<T>(value: T[] | null | undefined): T[] {
    return Array.isArray(value) ? value : [];
}

// ─── Promise ──────────────────────────────────────────────────────────────────

/**
 * Promise với timeout – throw sau N ms nếu chưa xong
 * @example await withTimeout(fetch(url), 10000, 'API_TIMEOUT')
 */
export function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    errorMessage = 'Yêu cầu quá thời gian chờ',
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(errorMessage));
        }, ms);

        promise.then(
            (val) => { clearTimeout(timer); resolve(val); },
            (err) => { clearTimeout(timer); reject(err); },
        );
    });
}

// ─── Zod safe parse wrapper ───────────────────────────────────────────────────

import { ZodType, ZodError } from 'zod';

/**
 * Parse với Zod – log lỗi nhưng không throw, fallback về null
 * An toàn hơn .safeParse() vì tự log lỗi
 */
export function zodParse<T>(
    schema: ZodType<T>,
    data: unknown,
    label = 'unknown',
): T | null {
    const result = schema.safeParse(data);
    if (!result.success) {
        console.error(`[ZodParse] ${label} validation failed:`, result.error.format());
        return null;
    }
    return result.data;
}
