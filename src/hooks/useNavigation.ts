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

// Fallback cứng — dùng khi backend chưa sẵn sàng hoặc lỗi
const DEFAULT_TABS: AppTab[] = [
    { name: 'index', label: 'Trang chủ', icon: '🏠', screen_slug: 'goto_feed', is_hidden: false },
    { name: 'chat', label: 'Chat', icon: '💬', is_hidden: false },
    { name: 'more', label: 'Thêm', icon: '≡', screen_slug: 'goto_more', is_hidden: false },
    { name: 'profile', label: 'Cá nhân', icon: '👤', is_hidden: false }
];

export function useNavigation() {
    const [tabs, setTabs] = useState<AppTab[]>(DEFAULT_TABS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNav = async () => {
            try {
                console.log('[useNavigation] 🔄 Fetching navigation from backend...');
                const response = await ApiClient.fetchSafe(API_ENDPOINTS.V3.APP.NAVIGATION);

                // Parse và validate danh sách tabs
                const parsed = z.array(NavigationTabSchema).safeParse(response?.tabs);

                if (parsed.success && parsed.data.length > 0) {
                    setTabs(parsed.data as AppTab[]);
                    console.log(`[useNavigation] ✅ Backend tabs loaded: ${parsed.data.length} tabs`);
                } else {
                    // Backend trả về nhưng data không hợp lệ — giữ DEFAULT
                    console.warn('[useNavigation] ⚠️ Backend returned invalid/empty tabs, using DEFAULT_TABS.');
                }
            } catch (err) {
                // Mạng lỗi, server lỗi — giữ DEFAULT không crash
                console.warn('[useNavigation] ❌ API failed, using DEFAULT_TABS:', (err as Error).message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNav();
    }, []);

    return { tabs, isLoading };
}
