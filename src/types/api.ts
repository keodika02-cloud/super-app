/**
 * src/types/api.ts
 * Định nghĩa types cho API envelope và response chuẩn.
 * Zod v3.23+: z.record() yêu cầu 2 args (keyType, valueType)
 */
import { z } from 'zod';

// ─── Zod Schema cho Envelope ─────────────────────────────────────────────────

export const ApiMetaSchema = z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    last_page: z.number(),
});

export function createEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
    return z.object({
        code: z.number(),
        status: z.enum(['success', 'error', 'fail'] as const),
        message: z.string(),
        data: dataSchema,
        meta: ApiMetaSchema.optional(),
        trace_id: z.string(),
        error: z.object({ type: z.string(), details: z.unknown() }).optional(),
        errors: z.record(z.string(), z.array(z.string())).optional(),
    });
}

export type ApiMeta = z.infer<typeof ApiMetaSchema>;

export interface PaginatedList<T> {
    items: T[];
    meta: ApiMeta;
}

// ─── Action Types (SDUI) ─────────────────────────────────────────────────────

const APP_ACTION_TYPES = ['NAVIGATE', 'NAVIGATE_TAB', 'API_CALL', 'OPEN_URL', 'OPEN_WEBVIEW'] as const;

export const AppActionSchema = z.object({
    type: z.enum(APP_ACTION_TYPES),
    target: z.string(),
    payload: z.record(z.string(), z.unknown()).optional(),
    requires_auth: z.boolean().optional(),
});

export type AppAction = z.infer<typeof AppActionSchema>;

// ─── SDUI Block Types ────────────────────────────────────────────────────────

const BLOCK_TYPES = [
    'BANNER_CAROUSEL', 'QUICK_ACTION_GRID', 'STATS_WIDGET',
    'VERTICAL_LIST', 'HEADER_BANNER', 'GRID_MENU', 'NEWS_LIST', 'CHART_PIE',
] as const;

export const BlockTypeSchema = z.enum(BLOCK_TYPES);
export type BlockType = z.infer<typeof BlockTypeSchema>;

// UIBlock dùng interface để tránh circular ref với strict mode
export interface UIBlock {
    id: string | number;
    type: string;
    order?: number;
    style?: Record<string, unknown>;
    data?: Record<string, unknown>;
    action?: AppAction;
    children?: UIBlock[];
}

export const UIBlockSchema: z.ZodType<UIBlock> = z.lazy(() =>
    z.object({
        id: z.union([z.string(), z.number()]),
        type: z.string(),
        order: z.number().optional(),
        style: z.record(z.string(), z.unknown()).optional(),
        data: z.record(z.string(), z.unknown()).optional(),
        action: AppActionSchema.optional(),
        children: z.array(UIBlockSchema).optional(),
    }),
);

export const ScreenDataSchema = z.object({
    screen_code: z.string(),
    version: z.string().optional(),
    title: z.string().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    blocks: z.array(UIBlockSchema),
});

export type ScreenData = z.infer<typeof ScreenDataSchema>;
