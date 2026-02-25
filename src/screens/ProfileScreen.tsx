import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Image, Share, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Application from 'expo-application';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { ApiClient } from '../../src/services/ApiClient';
import { API_ENDPOINTS } from '../../src/config/api-endpoints';
import { LinearGradient } from 'expo-linear-gradient';

export function ProfileScreen() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [appVersion, setAppVersion] = useState('1.0.0');
    const [loggingOut, setLoggingOut] = useState(false);
    const [deletingAcc, setDeletingAcc] = useState(false);

    useEffect(() => {
        // Lấy version thật của app
        if (Application.nativeApplicationVersion) {
            setAppVersion(Application.nativeApplicationVersion);
        }
    }, []);

    const handleLogout = async () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đăng xuất', style: 'destructive', onPress: async () => {
                    setLoggingOut(true);
                    await logout();
                    router.replace('/(auth)/login');
                    setLoggingOut(false);
                }
            }
        ]);
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            '⚠️ Xóa tài khoản',
            'Thao tác này sẽ xóa vĩnh viễn tài khoản và tất cả dữ liệu. Không thể khôi phục.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận xóa', style: 'destructive',
                    onPress: async () => {
                        setDeletingAcc(true);
                        try {
                            await ApiClient.fetchSafe(API_ENDPOINTS.AUTH.PROFILE.DELETE_ACCOUNT, undefined, 'DELETE');
                            await logout();
                            router.replace('/(auth)/login');
                            Alert.alert('Thành công', 'Tài khoản đã được xóa.');
                        } catch (err: any) {
                            Alert.alert('Lỗi', err.message || 'Không thể xóa tài khoản lúc này.');
                        } finally {
                            setDeletingAcc(false);
                        }
                    }
                }
            ]
        );
    };

    const handleShareApp = async () => {
        try {
            await Share.share({
                message: 'Tuyệt vời! Hãy tải ngay Ứng dụng QVC 2026 để trải nghiệm: https://crm.maytinhquocviet.com/download',
            });
        } catch (error) {
            console.error(error);
        }
    };

    const openLink = async (url: string) => {
        if (!url) return;
        try {
            await WebBrowser.openBrowserAsync(url);
        } catch (e) {
            Alert.alert('Lỗi', 'Không thể mở liên kết');
        }
    };

    const menuItems = [
        { id: 'password', icon: '🔒', label: 'Đổi mật khẩu', action: () => Alert.alert('Tính năng', 'Sắp ra mắt trong phiên bản sau.') },
        { id: 'biometric', icon: '👤', label: 'Xác thực sinh trắc học', hasSwitch: true },
        { id: 'share', icon: '🔗', label: 'Chia sẻ với bạn bè', action: handleShareApp },
        { id: 'rate', icon: '⭐', label: 'Đánh giá ứng dụng', action: () => Alert.alert('Cảm ơn', 'Cảm ơn bạn đã đánh giá!') },
        { id: 'policy', icon: '📄', label: 'Chính sách & Điều khoản', action: () => openLink(API_ENDPOINTS.PUBLIC?.TERMS || 'https://crm.maytinhquocviet.com/privacy') },
        { id: 'version', icon: 'ℹ️', label: 'Phiên bản hiện tại', rightText: appVersion },
        { id: 'theme', icon: '🎨', label: 'Đổi giao diện', action: () => Alert.alert('Giao diện', 'Hệ thống đang sử dụng giao diện Sáng mặc định.') },
        { id: 'wallpaper', icon: '🖼️', label: 'Cài đặt hình nền', action: () => Alert.alert('Hình nền', 'Sắp ra mắt tính năng đổi hình nền.') },
        { id: 'history', icon: '🧾', label: 'Xem lịch sử thanh toán', action: () => Alert.alert('Lịch sử', 'Tính năng đang được tích hợp với module Kế toán Ecount.') },
        { id: 'info', icon: 'ℹ', label: 'Thông tin chung', action: () => Alert.alert('Thông tin', `Tài khoản: ${user?.name}\nPhòng ban: ${user?.dept_name || 'N/A'}`) },
        { id: 'guide', icon: '📖', label: 'Hướng dẫn sử dụng', action: () => openLink('https://crm.maytinhquocviet.com/docs') },
        { id: 'logout', icon: '🚪', label: 'Đăng xuất', action: handleLogout, isLogout: true },
    ];

    if (!user) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <Text style={{ fontSize: 16, color: '#64748b' }}>Đang tải thông tin...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#e0f2fe', '#bae6fd']} style={styles.headerGradient}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {user?.avatar ? (
                            <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
                        ) : (
                            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'M'}</Text>
                        )}
                    </View>
                    <Text style={styles.phoneText}>{user?.phone || '0906269456'}</Text>

                    <TouchableOpacity style={styles.addAccountBtn}>
                        <Text style={styles.addAccountTxt}>+ Thêm tài khoản</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={styles.menuContainer}>
                <Text style={styles.menuTitle}>Cài đặt tài khoản</Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuItem}
                            onPress={item.action}
                            disabled={item.hasSwitch || (!item.action && !item.isLogout)}
                        >
                            <View style={styles.menuItemLeft}>
                                <Text style={styles.menuIcon}>{item.icon}</Text>
                                <Text style={[styles.menuLabel, item.isLogout && { color: '#ef4444' }]}>{item.label}</Text>
                            </View>

                            {item.hasSwitch ? (
                                <Switch
                                    value={isBiometricEnabled}
                                    onValueChange={setIsBiometricEnabled}
                                    trackColor={{ false: '#e2e8f0', true: '#bae6fd' }}
                                    thumbColor={isBiometricEnabled ? '#3b82f6' : '#f8fafc'}
                                />
                            ) : item.rightText ? (
                                <Text style={styles.rightText}>{item.rightText}</Text>
                            ) : null}
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0, marginTop: 12 }]} onPress={handleDeleteAccount} disabled={deletingAcc}>
                        <View style={styles.menuItemLeft}>
                            <Text style={styles.menuIcon}>🗑️</Text>
                            <Text style={[styles.menuLabel, { color: '#ef4444' }]}>{deletingAcc ? 'Đang xóa...' : 'Xóa tài khoản'}</Text>
                        </View>
                    </TouchableOpacity>

                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
    },
    profileHeader: {
        alignItems: 'center',
    },
    avatarContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    avatarImg: { width: '100%', height: '100%', borderRadius: 36 },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
    phoneText: { fontSize: 15, color: '#475569', marginBottom: 16 },
    addAccountBtn: {
        borderWidth: 1.5,
        borderColor: '#3b82f6',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    addAccountTxt: { color: '#3b82f6', fontWeight: '600', fontSize: 14 },
    menuContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -20,
        paddingTop: 24,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    menuTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
    scrollContent: { paddingBottom: 40 },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
    menuIcon: { fontSize: 20, width: 32 },
    menuLabel: { fontSize: 15, color: '#1e293b' },
    rightText: { fontSize: 13, color: '#cbd5e1' },
});
