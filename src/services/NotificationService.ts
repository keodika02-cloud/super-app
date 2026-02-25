/**
 * src/services/NotificationService.ts
 * SINGLE RESPONSIBILITY: Quản lý Push Notification và Deep Link routing.
 *
 * Chỉ làm 1 việc: Nhận/gửi thông báo đúng chỗ.
 * Deep link từ thông báo → điều hướng đúng màn hình.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ApiClient } from './ApiClient';
import { HardwareService } from './HardwareService';
import { API_ENDPOINTS } from '../config/api-endpoints';

// ─── Config hiển thị thông báo (khi app đang mở) ─────────────────────────────

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// ─── Loại thông báo → màn hình điều hướng ────────────────────────────────────

export type NotificationType =
    | 'SALARY'
    | 'WARNING'
    | 'TASK'
    | 'LEAVE'
    | 'ANNOUNCEMENT'
    | 'CHECKIN'
    | 'CHAT'
    | string;

export interface NotificationAction {
    screen: string;
    params?: Record<string, unknown>;
}

/** Map loại thông báo → route Expo Router */
function resolveDeepLink(type: NotificationType, params?: Record<string, unknown>): NotificationAction {
    switch (type) {
        case 'SALARY': return { screen: '/(main)/profile', params };
        case 'TASK': return { screen: '/(main)/tasks', params };
        case 'LEAVE': return { screen: '/(main)/crm', params };
        case 'CHECKIN': return { screen: '/(main)/checkin', params };
        case 'ANNOUNCEMENT': return { screen: '/(main)/news', params };
        case 'CHAT': return { screen: '/(main)/crm', params };
        default: return { screen: '/(main)/notifications' };
    }
}

// ─── Xin quyền thông báo ─────────────────────────────────────────────────────

async function requestPermission(): Promise<boolean> {
    if (!Device.isDevice) {
        console.warn('[NotificationService] Simulator → bỏ qua xin quyền');
        return false;
    }

    try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        if (existing === 'granted') return true;

        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            console.warn('[NotificationService] Người dùng từ chối quyền Push');
            return false;
        }

        // Android cần notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'QVC Thông báo',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#1E3A8A',
            });
        }

        return true;
    } catch (err) {
        console.error('[NotificationService] requestPermission lỗi:', err);
        return false;
    }
}

// ─── Lấy Expo Push Token và đăng ký với server ───────────────────────────────

async function registerDevice(): Promise<string | null> {
    const hasPermission = await requestPermission();
    if (!hasPermission) return null;

    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
            console.warn('[NotificationService] Thiếu EAS projectId trong app.json');
        }

        const tokenData = await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined,
        );
        const fcmToken = tokenData.data;

        // Đăng ký với backend
        await ApiClient.fetchSafe(API_ENDPOINTS.AUTH.REGISTER_DEVICE, {
            token: fcmToken,
            os: Platform.OS,
        }, 'POST');

        console.info('[NotificationService] Đăng ký FCM thành công:', fcmToken.slice(0, 30) + '...');
        return fcmToken;
    } catch (err) {
        console.error('[NotificationService] registerDevice lỗi:', err);
        return null;
    }
}

// ─── Lắng nghe thông báo đến (khi app đang mở) ───────────────────────────────

type NavigateFn = (screen: string, params?: Record<string, unknown>) => void;

function setupListeners(navigate: NavigateFn) {
    // Khi bấm vào thông báo (app đang chạy nền hoặc đóng)
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as {
            type?: NotificationType;
            params?: Record<string, unknown>;
        };
        const action = resolveDeepLink(data?.type ?? '', data?.params);
        navigate(action.screen, action.params);
    });

    return () => sub.remove();
}

// ─── Gửi thông báo local (test / offline reminder) ───────────────────────────

async function scheduleLocal(title: string, body: string, data?: Record<string, unknown>) {
    try {
        await Notifications.scheduleNotificationAsync({
            content: { title, body, data: data ?? {} },
            trigger: null, // Hiện ngay lập tức
        });
    } catch (err) {
        console.error('[NotificationService] scheduleLocal lỗi:', err);
    }
}

// ─── Xoá badge số đỏ ─────────────────────────────────────────────────────────

async function clearBadge() {
    try {
        await Notifications.setBadgeCountAsync(0);
    } catch { }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const NotificationService = {
    requestPermission,
    registerDevice,
    setupListeners,
    scheduleLocal,
    clearBadge,
    resolveDeepLink,
};
