/**
 * src/services/NotificationService.ts
 * SINGLE RESPONSIBILITY: Quản lý Push Notification và Deep Link routing.
 *
 * Chỉ làm 1 việc: Nhận/gửi thông báo đúng chỗ.
 * Deep link từ thông báo → điều hướng đúng màn hình.
 */
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { ApiClient } from './ApiClient';
import { HardwareService } from './HardwareService';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { RemoteLogger } from './RemoteLogger';

// [HARDENING]: Import type-only to avoid side effects in Expo Go (SDK 53+)
import type * as NotificationsType from 'expo-notifications';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Conditional require to bypass 'DevicePushTokenAutoRegistration.fx.js' error in Expo Go
const Notifications: typeof NotificationsType | null = isExpoGo ? null : require('expo-notifications');

// ─── Config hiển thị thông báo (khi app đang mở) ─────────────────────────────

if (Notifications) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
} else {
    console.info('[NotificationService] Notifications handler skipped (Expo Go)');
}

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
    if (!Notifications) return false;
    if (!Device.isDevice) {
        console.warn('[NotificationService] Simulator → bỏ qua xin quyền');
        return false;
    }

    try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        if (existing === 'granted') return true;

        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            RemoteLogger.warn('[NotificationService] Push Permission Denied.');
            return false;
        }

        // Android cần notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'QVC Thông báo',
                importance: (Notifications as any).AndroidImportance?.MAX || 4,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#1E3A8A',
            });
        }

        return true;
    } catch (err: any) {
        RemoteLogger.error('[NotificationService] requestPermission crash avoided:', err.message);
        return false;
    }
}

// ─── Lấy Expo Push Token và đăng ký với server ───────────────────────────────

async function registerDevice(): Promise<string | null> {
    if (!Notifications) return null;
    const hasPermission = await requestPermission();
    if (!hasPermission) return null;

    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
            RemoteLogger.warn('[NotificationService] No EAS projectId found.');
        }

        const tokenData = await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined,
        );
        const fcmToken = tokenData.data;

        // Đăng ký với backend dùng endpoint mới
        const deviceInfo = HardwareService.getDeviceInfo();
        await ApiClient.fetchSafe(API_ENDPOINTS.NOTIFICATIONS.REGISTER_TOKEN, {
            token: fcmToken,
            platform: Platform.OS,
            device_model: deviceInfo.model
        }, 'POST');

        RemoteLogger.info(`[NotificationService] Token Registered: ${fcmToken.slice(0, 10)}...`);
        return fcmToken;
    } catch (err: any) {
        RemoteLogger.error('[NotificationService] Registration Crash Avoided:', err.message);
        return null;
    }
}

// ─── Lắng nghe thông báo đến (khi app đang mở) ───────────────────────────────

type NavigateFn = (screen: string, params?: Record<string, unknown>) => void;

function setupListeners(navigate: NavigateFn) {
    if (!Notifications) return () => { };

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
    if (!Notifications) return;
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
    if (!Notifications) return;
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
