/**
 * src/screens/NotificationScreen.tsx
 */
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { ApiClient } from '../services/ApiClient';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { useAuthStore } from '../stores/useAuthStore';

interface AppNotification {
    id: string;
    data: {
        title: string;
        message: string;
        url?: string;
    };
    read_at: string | null;
    created_at: string | null;
}

const formatDate = (d: string | null) => {
    if (!d) return 'Vừa xong';
    try { return new Date(d).toLocaleDateString() + ' ' + new Date(d).toLocaleTimeString(); }
    catch { return d || 'Vừa xong'; }
};

export function NotificationScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading, isRefetching, error } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await ApiClient.fetchSafe(API_ENDPOINTS.NOTIFICATIONS.GET_ALL);
            return Array.isArray(res) ? res : [];
        },
        staleTime: 1000 * 60 * 5,
    });

    const markReadMutation = useMutation({
        mutationFn: async (idOrIds: string | string[]) => {
            if (Array.isArray(idOrIds)) {
                return await ApiClient.fetchSafe(API_ENDPOINTS.NOTIFICATIONS.MARK_READ, {}, 'POST');
            }
            return await ApiClient.fetchSafe(API_ENDPOINTS.NOTIFICATIONS.MARK_SINGLE_READ, { id: idOrIds }, 'POST');
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const markAllAsRead = () => {
        markReadMutation.mutate([]); // Pass empty array to trigger bulk read
    };

    const handlePressNotif = (item: AppNotification) => {
        // Đánh dấu đã đọc nếu chưa đọc
        if (!item.read_at && !markReadMutation.isPending) {
            markReadMutation.mutate(item.id);
        }

        // Hiển thị nội dung chi tiết
        Alert.alert(
            item.data?.title || 'Thông báo',
            item.data?.message || '',
            [{ text: 'Đóng', style: 'default' }]
        );
    };

    const renderItem = ({ item }: { item: AppNotification }) => {
        const isUnread = !item.read_at;
        return (
            <TouchableOpacity
                style={[styles.notifCard, isUnread && styles.notifUnread]}
                onPress={() => handlePressNotif(item)}
            >
                <View style={styles.iconBox}>
                    <Text style={{ fontSize: 24 }}>🔔</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.notifTitle, isUnread && styles.bold]}>{item.data?.title || 'Thông báo mới'}</Text>
                    <Text style={styles.notifMessage}>{item.data?.message || ''}</Text>
                    <Text style={styles.notifTime}>{formatDate(item.created_at)}</Text>
                </View>
                {isUnread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.headerTitle}>Thông báo</Text>
                    {isRefetching && <ActivityIndicator size="small" color="#3b82f6" />}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {user?.role === 'admin' && (
                        <TouchableOpacity
                            style={styles.adminBtn}
                            onPress={() => router.push('/admin/broadcast')}
                        >
                            <Text style={styles.adminBtnTxt}>Gửi tin</Text>
                        </TouchableOpacity>
                    )}

                    {notifications.some((n: AppNotification) => !n.read_at) && (
                        <TouchableOpacity onPress={markAllAsRead} disabled={markReadMutation.isPending}>
                            <Text style={styles.markReadBtn}>
                                {markReadMutation.isPending ? '...' : 'Đã đọc'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
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
    adminBtn: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    adminBtnTxt: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
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
