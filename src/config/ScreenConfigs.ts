import { API_ENDPOINTS, SduiBlock, ApiDomain, EndpointConfig, SduiBlockInput } from './api-endpoints';

export interface ScreenConfig {
    readonly id: string;
    readonly title: string;
    readonly apiEndpoint: EndpointConfig<any, any>;
    readonly cacheKey: string;
    readonly fallbackLayout: SduiBlockInput[];
    readonly domain?: ApiDomain;
    readonly queryParams?: Record<string, string>;
}

export const SCREEN_CONFIGS: Record<string, ScreenConfig> = {
    HOME: {
        id: 'home',
        title: 'Bảng tin',
        apiEndpoint: API_ENDPOINTS.V3.APP.UI_LAYOUT,
        cacheKey: 'sdui_home_layout_v3',
        fallbackLayout: [
            { id: 'fb_header', type: 'ProfileHeaderBlock', data: { greeting: 'Chào bạn!' } },
            { id: 'fb_gps', type: 'GpsBlock', data: { label: 'Vị trí hiện tại của bạn' } },
            { id: 'fb_banner', type: 'BannerBlock', data: { title: 'Đang ngoại tuyến', subtitle: 'Kiểm tra kết nối của bạn', action: 'NONE' } },
            { id: 'fb_camera', type: 'CameraBlock', data: { label: 'Bấm để báo cáo nhanh', description: 'Gửi ảnh về trung tâm khi có sự cố' } }
        ]
    },
    REPORTS: {
        id: 'reports',
        title: 'Báo cáo',
        apiEndpoint: API_ENDPOINTS.V3.APP.UI_LAYOUT,
        cacheKey: 'sdui_reports_layout_v3',
        queryParams: { screen_slug: 'goto_reports' },
        fallbackLayout: [
            { id: 'fb_reports', type: 'SummaryCardBlock', data: { title: 'Báo cáo', subtitle: 'Dữ liệu tạm thời', stats: [] } }
        ]
    },
    CHAT: {
        id: 'chat',
        title: 'Hội thoại',
        apiEndpoint: API_ENDPOINTS.CHAT.INTERNAL.CONVERSATIONS,
        cacheKey: 'real_internal_conversations',
        domain: 'CHAT',
        fallbackLayout: [] // Native screens handle empty states differently
    },
    MORE: {
        id: 'more',
        title: 'Khám phá',
        apiEndpoint: API_ENDPOINTS.V3.APP.UI_LAYOUT,
        cacheKey: 'sdui_more_layout_v3',
        queryParams: { screen_slug: 'goto_more' },
        fallbackLayout: [
            { id: 'fb_more_banner', type: 'BannerBlock', data: { title: 'Tiện ích & Ứng dụng', subtitle: 'Tất cả các tính năng nghiệp vụ của QVC', action: 'NONE' } },
            {
                id: 'fb_more_grid',
                type: 'GridMenuBlock',
                data: {
                    title: 'Tính năng chính',
                    items: [
                        { label: 'Chấm công', icon: '📍', action: 'OPEN_APP_CHECKIN', bg_color: '#dcfce7' },
                        { label: 'Công việc', icon: '📋', action: 'OPEN_FEATURE_TASKS', bg_color: '#fef3c7' },
                        { label: 'Báo cáo', icon: '📊', action: 'OPEN_FEATURE_REPORTS', bg_color: '#e0f2fe' },
                        { label: 'Thông báo', icon: '🔔', action: 'OPEN_FEATURE_NOTIFICATIONS', bg_color: '#fce7f3' },
                        { label: 'Khách hàng', icon: '👥', action: 'OPEN_WEB_CRM', bg_color: '#ede9fe' },
                        { label: 'Bảng lương', icon: '💰', action: 'OPEN_FEATURE_SALARY', bg_color: '#ffedd5' },
                    ]
                }
            }
        ]
    },
    TASKS: {
        id: 'tasks',
        title: 'Chi tiết Công việc',
        apiEndpoint: API_ENDPOINTS.V3.APP.UI_LAYOUT,
        cacheKey: 'demo_task_2026',
        fallbackLayout: [
            { id: 'task_banner', type: 'BannerBlock', data: { title: 'Báo cáo hiện trường', subtitle: 'Mã công việc: #2026', action: 'OPEN_WEB_RATING', action_label: 'Hỗ trợ 📞' } },
            { id: 'task_gps', type: 'GpsBlock', data: { label: 'Xác nhận vị trí làm việc' } },
            { id: 'task_img', type: 'ImageBlock', data: { url: '', aspect_ratio: 2 } },
            { id: 'task_camera', type: 'CameraBlock', data: { label: 'Chụp ảnh nghiệm thu', context_type: 'TASK', context_id: 2026, required: true } },
            { id: 'task_upload', type: 'UploadBlock', data: { label: 'Tải lên Biên bản (PDF/DOC)', context_type: 'TASK', context_id: 2026, max_size_mb: 20 } },
            { id: 'task_chat', type: 'CommentBlock', data: { context_type: 'TASK', context_id: 2026, placeholder: 'Gửi báo cáo hoặc trao đổi...' } }
        ]
    }
};
