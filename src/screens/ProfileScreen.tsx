/**
 * src/screens/ProfileScreen.tsx
 * Hồ sơ người dùng – Apple required: có nút Xóa tài khoản.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { useAuthStore } from '@stores/useAuthStore';
import { ApiClient, ApiError } from '@services/ApiClient';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { GlassCard } from '@components/ui/GlassCard';
import { AppButton } from '@components/ui/AppButton';
import { API_ENDPOINTS } from '../config/api-endpoints';

export function ProfileScreen() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [deletingAcc, setDeletingAcc] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    // Logout
    const handleLogout = async () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đăng xuất', style: 'destructive', onPress: async () => {
                    setLoggingOut(true);
                    await logout();
                    router.replace('/(auth)/login');
                    setLoggingOut(false);
                },
            },
        ]);
    };

    // Xóa tài khoản (BẮTBUỘC Apple) – 2-step confirmation
    const handleDeleteAccount = () => {
        Alert.alert(
            '⚠️ Xóa tài khoản',
            'Thao tác này sẽ xóa vĩnh viễn tài khoản và tất cả dữ liệu của bạn. Không thể khôi phục.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận xóa', style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            'Xác nhận lần cuối',
                            'Nhấn "Xóa tài khoản" để xác nhận. Tài khoản sẽ bị xóa trong 30 ngày.',
                            [
                                { text: 'Quay lại', style: 'cancel' },
                                {
                                    text: 'Xóa tài khoản', style: 'destructive',
                                    onPress: async () => {
                                        setDeletingAcc(true);
                                        try {
                                            await ApiClient.fetchSafe(API_ENDPOINTS.AUTH.PROFILE.DELETE_ACCOUNT, undefined, 'DELETE');
                                            await logout();
                                            router.replace('/(auth)/login');
                                        } catch (err) {
                                            const msg = err instanceof ApiError ? err.message : 'Có lỗi xảy ra. Vui lòng liên hệ admin.';
                                            Alert.alert('Không thể xóa tài khoản', msg);
                                        } finally {
                                            setDeletingAcc(false);
                                        }
                                    },
                                },
                            ],
                        );
                    },
                },
            ],
        );
    };

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 20 }}>Hồ sơ</Text>

                {/* Avatar & Name */}
                <GlassCard style={{ alignItems: 'center', marginBottom: 20 }}>
                    {user?.avatar ? (
                        <Image source={{ uri: user.avatar }} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 12 }} />
                    ) : (
                        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                            <Text style={{ fontSize: 36 }}>👤</Text>
                        </View>
                    )}
                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{user?.name ?? '–'}</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>{user?.email ?? '–'}</Text>
                    <View style={{ marginTop: 8, backgroundColor: 'rgba(37,99,235,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4 }}>
                        <Text style={{ color: '#93c5fd', fontSize: 13, fontWeight: '600' }}>{user?.role ?? '–'}</Text>
                    </View>
                </GlassCard>

                {/* Info */}
                <GlassCard style={{ marginBottom: 20 }}>
                    {[
                        { label: 'Phòng ban', value: user?.dept_name ?? '–' },
                        { label: 'Chức vụ', value: user?.hrm_info?.job_title ?? '–' },
                        { label: 'Mã nhân viên', value: user?.hrm_info?.employee_code ?? '–' },
                        { label: 'Trạng thái', value: user?.status === 'ACTIVE' ? '✅ Đang hoạt động' : '⚠️ ' + user?.status },
                    ].map(({ label, value }) => (
                        <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                            <Text style={{ color: '#94a3b8', fontSize: 14 }}>{label}</Text>
                            <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '500', maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
                        </View>
                    ))}
                </GlassCard>

                {/* Privacy Policy – Apple require */}
                <AppButton
                    label="📋 Chính sách Riêng tư"
                    onPress={() => WebBrowser.openBrowserAsync('https://crm.maytinhquocviet.com/privacy')}
                    variant="outline"
                    fullWidth
                    style={{ marginBottom: 12 }}
                />

                {/* Logout */}
                <AppButton
                    label="Đăng xuất"
                    onPress={handleLogout}
                    loading={loggingOut}
                    variant="outline"
                    fullWidth
                    style={{ marginBottom: 24 }}
                />

                {/* Xóa tài khoản – ĐỎ, cuối trang (Apple bắt buộc) */}
                <AppButton
                    label="🗑️ Xóa tài khoản"
                    onPress={handleDeleteAccount}
                    loading={deletingAcc}
                    variant="danger"
                    fullWidth
                />
                <Text style={{ color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                    Xóa tài khoản vĩnh viễn sau 30 ngày
                </Text>
            </ScrollView>
        </ScreenWrapper>
    );
}
