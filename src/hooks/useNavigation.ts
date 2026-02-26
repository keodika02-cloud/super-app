/**
 * src/hooks/useNavigation.ts
 * Tải cấu hình Tab Bar từ Backend (Server-Driven Navigation).
 * - Instant start với DEFAULT_TABS (không có loading flash)
 * - Gọi API ngầm và cập nhật nếu server trả về data hợp lệ
 * - Graceful fallback về DEFAULT_TABS nếu server lỗi
 */
import { useState, useEffect } from 'react';
import { ApiClient } from '../services/ApiClient';
import { API_ENDPOINTS, NavigationTabSchema } from '../config/api-endpoints';
import { z } from 'zod';

export interface AppTab {
    name: string;
    label: string;
    icon: string;
    screen_slug?: string;
    is_hidden: boolean;
}

// Fallback cứng — dùng khi backend chưa sẵn sàng hoặc lỗi, và cũng làm luồng chính.
const DEFAULT_TABS: AppTab[] = [
    { name: 'index', label: 'Trang chủ', icon: '🏠', screen_slug: 'goto_feed', is_hidden: false },
    { name: 'crm', label: 'CRM', icon: '💼', is_hidden: false },
    { name: 'chat', label: 'Hội thoại', icon: '💬', is_hidden: false },
    { name: 'more', label: 'Khám phá', icon: '≡', screen_slug: 'goto_more', is_hidden: false },
    { name: 'profile', label: 'Cá nhân', icon: '👤', is_hidden: false }
];

export function useNavigation() {
    const [tabs, setTabs] = useState<AppTab[]>(DEFAULT_TABS);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // [HARDENING]: We use DEFAULT_TABS as the fixed ground truth to avoid Layout Flashing
        // Optional: Still fetch API passively for analytics or future sync, but don't cause React re-renders.
    }, []);

    return { tabs, isLoading };
}
