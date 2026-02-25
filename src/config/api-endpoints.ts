/**
 * src/config/api-endpoints.ts
 * Centralized API endpoints for the entire mobile app.
 * Mapping routes to maintain consistency between Frontend and Backend.
 */

import { z } from 'zod';

export interface EndpointConfig<TReq extends z.ZodTypeAny, TRes extends z.ZodTypeAny> {
    readonly path: string;
    readonly req: TReq;
    readonly res: TRes;
    readonly fallbackRes: any;
}

export const NotificationSchema = z.object({
    id: z.number(),
    title: z.string().catch('Thông báo'),
    body: z.string().catch(''),
    type: z.string().catch(''),
    is_read: z.boolean().catch(false),
    created_at: z.string().nullable().catch(null),
    payload: z.record(z.string(), z.unknown()).optional().catch(undefined),
});

export type AppNotification = z.infer<typeof NotificationSchema>;

// ─── SDUI BLOCKS (SERVER-DRIVEN UI) ──────────────────────────────────────
export const SduiActionSchema = z.string().catch('NONE');

const GridItemSchema = z.object({
    label: z.string().catch('Mục mới'),
    icon: z.string().catch('📱'),
    action: SduiActionSchema,
    bg_color: z.string().catch('#f1f5f9'),
});

const SummaryStatSchema = z.object({
    label: z.string().catch('Trạng thái'),
    value: z.string().catch('–'),
});

// Định nghĩa Schema dữ liệu riêng cho từng loại Block
const ProfileHeaderDataSchema = z.object({
    greeting: z.string().optional().catch(undefined),
}).catch({});
const GridMenuDataSchema = z.object({
    title: z.string().optional().catch(undefined),
    items: z.array(GridItemSchema).catch([]),
}).catch({ items: [] });

const BannerDataSchema = z.object({
    title: z.string().catch('Thông báo mới'),
    subtitle: z.string().catch('Nhấn để xem chi tiết'),
    action: SduiActionSchema,
}).catch({ title: 'Thông báo', subtitle: '', action: 'NONE' });

const SummaryCardDataSchema = z.object({
    title: z.string().catch('Báo cáo'),
    subtitle: z.string().catch('Dữ liệu hệ thống'),
    stats: z.array(SummaryStatSchema).catch([]),
}).catch({ title: 'Báo cáo', subtitle: '', stats: [] });

const PostComposerDataSchema = z.object({
    placeholder: z.string().catch('Bạn đang nghĩ gì?'),
}).catch({ placeholder: 'Bạn đang nghĩ gì?' });

const FeedActionDataSchema = z.object({
    items: z.array(GridItemSchema).catch([]),
}).catch({ items: [] });

const StoryItemSchema = z.object({
    label: z.string().catch('User'),
    avatar: z.string().optional(),
    is_seen: z.boolean().catch(false),
});

const StoryBlockDataSchema = z.object({
    items: z.array(StoryItemSchema).catch([]),
}).catch({ items: [] });

const SocialPostSchema = z.object({
    author: z.string().catch('QVC Admin'),
    avatar: z.string().optional(),
    content: z.string().catch(''),
    images: z.array(z.string()).catch([]),
    timestamp: z.string().optional(),
    likes: z.number().catch(0),
    comments: z.number().catch(0),
});

const SocialFeedDataSchema = z.object({
    posts: z.array(SocialPostSchema).catch([]),
}).catch({ posts: [] });

const NewsFeedResponseSchema = z.object({
    posts: z.array(SocialPostSchema).catch([]),
    current_page: z.number().catch(1),
    last_page: z.number().catch(1),
}).catch({ posts: [], current_page: 1, last_page: 1 });

const HtmlBlockDataSchema = z.object({
    html: z.string().catch(''),
    css: z.string().optional(),
    js: z.string().optional(),
    height: z.number().catch(300),
}).catch({ html: '', height: 300 });

export const SduiBlockSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('ProfileHeaderBlock'), id: z.string().catch('prop_header'), data: ProfileHeaderDataSchema }),
    z.object({ type: z.literal('GridMenuBlock'), id: z.string().catch('grid_menu'), data: GridMenuDataSchema }),
    z.object({ type: z.literal('BannerBlock'), id: z.string().catch('banner'), data: BannerDataSchema }),
    z.object({ type: z.literal('SummaryCardBlock'), id: z.string().catch('summary'), data: SummaryCardDataSchema }),
    z.object({ type: z.literal('FeedActionBlock'), id: z.string().catch('feed_action'), data: FeedActionDataSchema }),
    z.object({ type: z.literal('SocialFeedBlock'), id: z.string().catch('social_feed'), data: SocialFeedDataSchema }),
    z.object({ type: z.literal('HtmlBlock'), id: z.string().catch('html_block'), data: HtmlBlockDataSchema }),
    z.object({ type: z.literal('StoryBlock'), id: z.string().catch('story'), data: StoryBlockDataSchema }),
    z.object({ type: z.literal('PostComposerBlock'), id: z.string().catch('composer'), data: PostComposerDataSchema }),
    // Block dự phòng cho tương lai (UnknownBlock)
    z.object({ type: z.string().catch('UnknownBlock'), id: z.string().catch('unknown'), data: z.any().catch({}) }),
]).catch((err) => {
    // Nếu một block bị lỗi cấu trúc nặng, trả về một block trống để không crash mảng cha
    console.error('[SduiBlockSchema] Invalid block structure caught:', err);
    return { type: 'GridMenuBlock', id: 'error_fallback', data: { items: [] } } as any;
});

// Cấu trúc trả về là một mảng các Block
export const SduiLayoutSchema = z.array(SduiBlockSchema).catch([]);
export type SduiBlock = z.infer<typeof SduiBlockSchema>;


const CheckInResultSchema = z.object({
    check_in_id: z.number().catch(0),
    check_in_time: z.string().catch(() => new Date().toISOString()),
    status: z.string().catch('UNKNOWN'), // Chấp nhận string bất kỳ để linh hoạt từ Backend
    message: z.string().catch(''),
    metadata: z.object({
        photo_before: z.string().optional(),
        photo_after: z.string().optional(),
        photo_document: z.string().optional(),
        is_flexible: z.boolean().default(true),
    }).optional().catch({ is_flexible: true }),
});

// ─── AUTH & SYSTEM SCHEMAS ──────────────────────────────────────────────────
export const UserDataSchema = z.object({
    id: z.number().catch(0),
    name: z.string().catch('User'),
    email: z.string().catch(''),
    avatar: z.string().nullable().catch(null),
});

export const LoginResultSchema = z.object({
    token: z.string().catch(''),
    user: UserDataSchema.optional(),
    requires_2fa: z.boolean().catch(false),
});

export const BootstrapDataSchema = z.object({
    version: z.string().catch('1.0.0'),
    force_update: z.boolean().catch(false),
    maintenance_mode: z.boolean().catch(false),
    maintenance_message: z.string().catch(''),
    features: z.record(z.string(), z.boolean()).optional().catch(undefined),
});

export const ConfigDataSchema = z.object({
    company_lat: z.number().catch(18.679585),
    company_long: z.number().catch(105.681335),
    allowed_radius: z.number().catch(5000),
    theme: z.string().catch('light'),
});

export const API_ENDPOINTS = {
    // ─── AUTHENTICATION ──────────────────────────────────────────────────────────
    AUTH: {
        LOGIN: {
            path: '/v3/app/login',
            req: z.object({ email: z.string(), password: z.string(), device_id: z.string(), device_name: z.string().optional() }),
            res: LoginResultSchema,
            fallbackRes: { token: '' },
        },
        LOGOUT: {
            path: '/v3/app/logout',
            req: z.any(),
            res: z.any(),
            fallbackRes: {},
        },
        REGISTER_DEVICE: {
            path: '/v3/app/device-token',
            req: z.object({ token: z.string(), os: z.string() }),
            res: z.any(),
            fallbackRes: {},
        },
        PROFILE: {
            ME: {
                path: '/v3/app/user',
                req: z.any(),
                res: UserDataSchema,
                fallbackRes: { id: 0, name: 'Offline User', email: '' },
            },
            UPDATE: {
                path: '/v3/app/user/profile',
                req: z.any(),
                res: z.any(),
                fallbackRes: {},
            },
            DELETE_ACCOUNT: {
                path: '/v3/app/user/account',
                req: z.any(),
                res: z.any(),
                fallbackRes: {},
            },
        },
        VERIFY_2FA: {
            path: '/v3/app/auth/2fa/verify',
            req: z.any(),
            res: z.any(),
            fallbackRes: {},
        },
        RESEND_2FA: {
            path: '/v3/app/auth/2fa/resend',
            req: z.any(),
            res: z.any(),
            fallbackRes: {},
        },
        SOCIAL: {
            GOOGLE_CALLBACK: {
                path: '/v3/app/auth/google/callback',
                req: z.any(),
                res: z.any(),
                fallbackRes: {},
            },
            FACEBOOK_CALLBACK: {
                path: '/v3/app/auth/facebook/callback',
                req: z.any(),
                res: z.any(),
                fallbackRes: {},
            },
        },
    },

    // ─── APP V3 HARDENED (API v3) ────────────────────────────────────────────────
    // These routes are specialized for Zero-Crash & Offline-First behavior
    // Validated 100% via Zod. If response is modified externally, it uses fallbackRes and reports err.
    V3: {
        APP: {
            UI_LAYOUT: {
                path: '/v3/app/ui-layout',
                req: z.any(),
                res: z.lazy(() => SduiLayoutSchema), // Sử dụng lazy load nếu schema chưa init kịp (hoặc đặt nó ở trên)
                fallbackRes: [], // Giao diện màn hình chính mảng rỗng nếu Crash
            },
            NOTIFICATIONS: {
                path: '/v3/app/notifications',
                req: z.any(),
                res: z.array(NotificationSchema),
                fallbackRes: [],
            },
            NOTIFICATIONS_READ: {
                path: '/v3/app/notifications/read',
                req: z.any(),
                res: z.any(),
                fallbackRes: {},
            },
            CHECKIN_TODAY: {
                path: '/v3/app/checkin/today',
                req: z.any(),
                res: z.array(CheckInResultSchema),
                fallbackRes: [],
            },
            CHECKIN_SUBMIT: {
                path: '/v3/app/checkin',
                req: z.any(),
                res: CheckInResultSchema,
                fallbackRes: {
                    check_in_id: 0,
                    check_in_time: new Date().toISOString(),
                    status: 'ON_TIME',
                    message: 'Chấm công ngoại tuyến hoặc phản hồi lỗi',
                },
            },
            LOGS: {
                path: '/v3/app/logs',
                req: z.object({
                    level: z.string(),
                    message: z.string(),
                    context: z.any(),
                }),
                res: z.any(),
                fallbackRes: {},
            },
            NEWS_FEED: {
                path: '/v3/app/news-feed',
                req: z.any(),
                res: NewsFeedResponseSchema,
                fallbackRes: { posts: [], current_page: 1, last_page: 1 },
            },
        },
    },

    // ─── SYSTEM & CONFIG ─────────────────────────────────────────────────────────
    SYSTEM: {
        BOOTSTRAP: {
            path: '/v3/app/bootstrap',
            req: z.any(),
            res: BootstrapDataSchema,
            fallbackRes: { version: '1.0.0', force_update: false, maintenance_mode: false, maintenance_message: '' },
        },
        CONFIG: {
            path: '/v3/app/config',
            req: z.any(),
            res: ConfigDataSchema,
            fallbackRes: { company_lat: 18.679585, company_long: 105.681335, allowed_radius: 5000, theme: 'light' },
        },
    },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
