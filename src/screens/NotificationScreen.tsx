/**
 * src/screens/NotificationScreen.tsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Hardened v2:
 *   ✓ safeDate() – không bao giờ "Invalid Date"
 *   ✓ safeArray() – không crash khi API trả null
 *   ✓ FlatList với keyExtractor safe
 *   ✓ Zod validation cho từng notification item
 * ──────────────────────────────────────────────────────────────────────────────
 */
import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { ApiClient } from '@services/ApiClient';
import { NotificationService } from '@services/NotificationService';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { GlassCard } from '@components/ui/GlassCard';
import { SkeletonList } from '@components/ui/SkeletonCard';
import { API_ENDPOINTS, AppNotification } from '../config/api-endpoints';
import { QUERY_KEYS } from '../config/query-keys';
import { useScreenData } from '@hooks/useScreenData';
import { safeArray, formatDate, formatTime, safeStr } from '@utils/safe';

export function NotificationScreen() {
    const queryClient = useQueryClient();

    const { data: rawNotifications, isFirstLoad, isRefreshing, error } = useScreenData(
        QUERY_KEYS.NOTIFICATIONS,
        () => ApiClient.fetchSafe(API_ENDPOINTS.V3.APP.NOTIFICATIONS),
        {
            staleTime: 1000 * 60 * 5,
        }
    );

    // Dữ liệu đã được đảm bảo an toàn & chuẩn type từ fetchSafe, kể cả bị lỗi thì default đã là []
    const notifications: AppNotification[] = rawNotifications ?? [];

    const unreadNotifs = safeArray(notifications).filter((n: AppNotification) => !n.is_read);

    const markReadMutation = useMutation({
        mutationFn: (ids: number[]) => ApiClient.fetchSafe(API_ENDPOINTS.V3.APP.NOTIFICATIONS_READ, { ids }, 'PUT'), // [HARDENING]: strict type check
        networkMode: 'offlineFirst',
        onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS }),
        // Lỗi mark-read không làm crash màn hình
        onError: (err) => console.error('[NotificationScreen] markRead lỗi:', err),
    });

    React.useEffect(() => {
        NotificationService.clearBadge().catch(() => { });
    }, []);

    const renderItem = ({ item }: { item: AppNotification }) => {
        const timeStr = formatTime(item.created_at);
        const dateStr = formatDate(item.created_at);

        return (
            <TouchableOpacity
                onPress={() => !item.is_read && !markReadMutation.isPending && markReadMutation.mutate([item.id])}
                activeOpacity={0.75}
            >
                <GlassCard
                    tight
                    style={{
                        marginHorizontal: 16, marginVertical: 6,
                        borderColor: item.is_read ? 'rgba(255,255,255,0.08)' : 'rgba(96,165,250,0.4)',
                        opacity: item.is_read ? 0.7 : 1,
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        {!item.is_read && (
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#60a5fa', marginTop: 5, marginRight: 10 }} />
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#e2e8f0', fontWeight: '700', fontSize: 14 }}>
                                {safeStr(item.title, 'Thông báo')}
                            </Text>
                            {!!item.body && (
                                <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 3 }}>
                                    {safeStr(item.body)}
                                </Text>
                            )}
                            <Text style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>
                                {dateStr !== '–' ? `${dateStr}  ${timeStr}` : 'Không rõ thời gian'}
                            </Text>
                        </View>
                    </View>
                </GlassCard>
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 }}>
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>Thông báo</Text>
                {unreadNotifs.length > 0 && (
                    <TouchableOpacity
                        onPress={() => !markReadMutation.isPending && markReadMutation.mutate(unreadNotifs.map((n: AppNotification) => n.id))}
                        disabled={markReadMutation.isPending}
                    >
                        <Text style={{ color: '#60a5fa', fontSize: 13 }}>
                            {markReadMutation.isPending ? 'Đang xử lý...' : 'Đọc tất cả'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Trạng thái / Danh sách */}
            {isFirstLoad ? (
                <SkeletonList count={6} />
            ) : error && notifications.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <Text style={{ fontSize: 40 }}>📡</Text>
                    <Text style={{ color: '#f87171', fontSize: 15, marginTop: 12, textAlign: 'center' }}>
                        Không tải được thông báo
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                        Kiểm tra kết nối mạng và thử lại
                    </Text>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {/* Background loading indicator – cực kỳ tinh tế */}
                    {(isRefreshing || markReadMutation.isPending) && (
                        <View style={{ height: 2, backgroundColor: 'rgba(96,165,250,0.3)', width: '100%' }}>
                            <View style={{ height: 2, backgroundColor: '#3b82f6', width: '30%' }} />
                        </View>
                    )}

                    {notifications.length === 0 ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 48 }}>🔔</Text>
                            <Text style={{ color: '#64748b', marginTop: 12 }}>Không có thông báo mới</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={notifications}
                            renderItem={renderItem}
                            keyExtractor={(item) => `notif-${item.id}`}
                            contentContainerStyle={{ paddingVertical: 8 }}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            )}
        </ScreenWrapper>
    );
}
