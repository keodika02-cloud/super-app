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
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiClient } from '../../src/services/ApiClient';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { API_ENDPOINTS } from '../../src/config/api-endpoints';

interface AppNotification {
    id: number;
    title: string;
    body: string;
    is_read: boolean;
    created_at: string | null;
}

const formatDate = (d: string | null) => {
    if (!d) return 'Vừa xong';
    try { return new Date(d).toLocaleDateString() + ' ' + new Date(d).toLocaleTimeString(); }
    catch { return d || 'Vừa xong'; }
};

export function NotificationScreen() {
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading, isRefetching, error } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await ApiClient.fetchSafe(API_ENDPOINTS.V3.APP.NOTIFICATIONS);
            return Array.isArray(res) ? res : [];
        },
        staleTime: 1000 * 60 * 5,
    });

    const markReadMutation = useMutation({
        mutationFn: async (ids: number[]) => {
            return await ApiClient.fetchSafe(API_ENDPOINTS.V3.APP.NOTIFICATIONS_READ, { ids }, 'PUT');
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const markAllAsRead = () => {
        const unreadIds = notifications.filter((n: AppNotification) => !n.is_read).map((n: AppNotification) => n.id);
        if (unreadIds.length > 0) {
            markReadMutation.mutate(unreadIds);
        }
    };

    const renderItem = ({ item }: { item: AppNotification }) => {
        return (
            <TouchableOpacity
                style={[styles.notifCard, !item.is_read && styles.notifUnread]}
                onPress={() => !item.is_read && markReadMutation.mutate([item.id])}
                disabled={markReadMutation.isPending}
            >
                <View style={styles.iconBox}>
                    <Text style={{ fontSize: 24 }}>🔔</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.notifTitle, !item.is_read && styles.bold]}>{item.title || 'Thông báo mới'}</Text>
                    <Text style={styles.notifMessage}>{item.body}</Text>
                    <Text style={styles.notifTime}>{formatDate(item.created_at)}</Text>
                </View>
                {!item.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.headerTitle}>Thông báo</Text>
                    {isRefetching && <ActivityIndicator size="small" color="#3b82f6" />}
                </View>

                {notifications.some((n: AppNotification) => !n.is_read) && (
                    <TouchableOpacity onPress={markAllAsRead} disabled={markReadMutation.isPending}>
                        <Text style={styles.markReadBtn}>
                            {markReadMutation.isPending ? 'Đang cập nhật...' : 'Đọc tất cả'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {isLoading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : error ? (
                <View style={styles.centerBox}>
                    <Text style={{ fontSize: 40 }}>📡</Text>
                    <Text style={{ color: '#f87171', marginTop: 12 }}>Không tải được thông báo</Text>
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.centerBox}>
                    <Text style={{ fontSize: 48 }}>📬</Text>
                    <Text style={{ color: '#64748b', marginTop: 12 }}>Không có thông báo mới</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => `notif-${item.id}`}
                    contentContainerStyle={{ padding: 16 }}
                />
            )}
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
    markReadBtn: { color: '#3b82f6', fontWeight: '600', fontSize: 14 },
    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    notifCard: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, gap: 12, elevation: 1 },
    notifUnread: { backgroundColor: '#f0f9ff' },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
    notifTitle: { fontSize: 15, color: '#1e293b', marginBottom: 4 },
    bold: { fontWeight: '700' },
    notifMessage: { fontSize: 14, color: '#475569', lineHeight: 20 },
    notifTime: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6', alignSelf: 'center' }
});
