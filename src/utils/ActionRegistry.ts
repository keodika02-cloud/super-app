/**
 * src/utils/ActionRegistry.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * SDUI Action Routing – Single source of truth cho tất cả actions mà Backend có thể gửi.
 * Tránh code JS động từ backend. Tuân thủ 100% Apple Policy.
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * QUY TẮC THÊM ACTION MỚI:
 * 1. Thêm vào type SupportedAction bên dưới.
 * 2. Thêm case xử lý trong switch.
 * 3. Nếu cần gọi API, hãy dùng ApiClient trong action đó.
 */
import { router } from 'expo-router';
import { Alert, Linking } from 'react-native';
import { ApiClient } from './../services/ApiClient';
import { EndpointConfig } from '../config/api-endpoints';
import z from 'zod';

export type SupportedAction =
    // ─── App Native Screens ────────────────────────────────────────────
    | 'OPEN_APP_ATTENDANCE'       // alias cho OPEN_APP_CHECKIN
    | 'OPEN_APP_CHECKIN'
    | 'OPEN_APP_GUEST_CHECKIN'
    | 'OPEN_APP_CHECKOUT_JOB'
    | 'OPEN_BIRTHDAY_GREETING'
    // ─── Feature Screens ───────────────────────────────────────────────
    | 'OPEN_FEATURE_CHAT'
    | 'OPEN_FEATURE_PROFILE'
    | 'OPEN_FEATURE_REPORTS'
    | 'OPEN_FEATURE_SALARY'
    | 'OPEN_FEATURE_BENEFITS'
    | 'OPEN_FEATURE_UNIFORM'
    | 'OPEN_FEATURE_RESIGN'
    | 'OPEN_FEATURE_BIRTHDAY'
    | 'OPEN_FEATURE_LEAVE'
    | 'OPEN_FEATURE_REWARD'
    | 'OPEN_FEATURE_REWARDS'
    | 'OPEN_FEATURE_CONTRACT'
    | 'OPEN_FEATURE_DOCS'
    | 'OPEN_FEATURE_CALENDAR'
    | 'OPEN_FEATURE_TASKS'
    | 'OPEN_FEATURE_NOTIFICATIONS'
    | 'OPEN_DYNAMIC_SCREEN'       // Generic SDUI SCREEN theo slug
    | 'API_REQUEST_NO_UI'         // Bắn API ngầm (Delete/Accept) không qua UI form
    | 'OPEN_SETTINGS'
    // ─── Web/CRM ───────────────────────────────────────────────────────
    | 'OPEN_WEB_CRM'
    | 'OPEN_WEB_ONEAI'
    | 'OPEN_WEB_RATING'
    | 'OPEN_WEB_ACCOUNTING'
    | 'OPEN_WEB_URL'              // Generic: cần payload.url
    // ─── System ────────────────────────────────────────────────────────
    | 'NAVIGATE'                  // Generic: cần payload.path
    | 'OPEN_MAP'                  // Cần payload.lat, payload.lng
    | 'CALL_PHONE'                // Cần payload.phone hoặc action="TEL:xxxx"
    | 'OPEN_COMPANY_INFO'
    | 'OPEN_POST_CREATOR'
    | 'SEND_GREETING_CARD'
    // ─── No-op ─────────────────────────────────────────────────────────
    | 'NONE'
    | 'NO_ACTION';

export const ActionRegistry = {
    execute(action: SupportedAction | string, payload?: any, contextLabel?: string) {
        if (action !== 'NONE') {
            console.log(`[ActionRegistry] 👆 Bấm nút: [${contextLabel || 'Thẻ giao diện'}] -> Gọi lệnh: ${action}`);
        }

        switch (action) {
            // ─── ATTENDANCE / CHECKIN ──────────────────────────────────────
            case 'OPEN_APP_ATTENDANCE':
            case 'OPEN_APP_CHECKIN':
                router.push({
                    pathname: '/(main)/checkin',
                    params: { title: 'Chấm công', context: 'ATTENDANCE_DAILY' }
                });
                break;
            case 'OPEN_APP_GUEST_CHECKIN':
                router.push({
                    pathname: '/(main)/checkin',
                    params: { title: 'Check-in Khách hàng', context: 'CUSTOMER_HOUSE' }
                });
                break;
            case 'OPEN_APP_CHECKOUT_JOB':
                router.push({
                    pathname: '/(main)/checkin',
                    params: { title: 'Check-out Công việc', context: 'CHECKOUT_JOB' }
                });
                break;

            // ─── FEATURE SCREENS ───────────────────────────────────────────
            case 'OPEN_FEATURE_CHAT':
                router.push('/(main)/chat');
                break;
            case 'OPEN_FEATURE_PROFILE':
                router.push('/(main)/profile');
                break;
            case 'OPEN_FEATURE_REPORTS':
                router.push('/(main)/reports');
                break;
            case 'OPEN_FEATURE_TASKS':
                router.push('/(main)/tasks');
                break;
            case 'OPEN_FEATURE_NOTIFICATIONS':
                router.push('/(main)/notifications');
                break;
            case 'OPEN_FEATURES_SALARY':
            case 'OPEN_FEATURE_SALARY':
            case 'OPEN_FEATURE_BENEFITS':
            case 'OPEN_FEATURE_UNIFORM':
            case 'OPEN_FEATURE_RESIGN':
            case 'OPEN_FEATURE_BIRTHDAY':
            case 'OPEN_BIRTHDAY_GREETING':
            case 'OPEN_FEATURE_CONTRACT':
            case 'OPEN_FEATURE_DOCS':
            case 'OPEN_FEATURE_CALENDAR':
            case 'OPEN_SETTINGS':
                // Chuyển hướng vào CRM WebView để xử lý tính năng HR
                router.push('/(main)/crm');
                break;
            case 'OPEN_FEATURE_LEAVE':
            case 'OPEN_FEATURE_REWARD':
            case 'OPEN_FEATURE_REWARDS':
                Alert.alert('Thông báo', 'Tính năng này hiện chỉ khả dụng trên CRM Web.\nBấm OK để mở CRM.', [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Mở CRM', onPress: () => router.push('/(main)/crm') }
                ]);
                break;

            // ─── WEB/CRM ───────────────────────────────────────────────────
            case 'OPEN_WEB_CRM':
                router.push('/(main)/crm');
                break;
            case 'OPEN_WEB_ONEAI':
            case 'OPEN_WEB_RATING':
            case 'OPEN_WEB_ACCOUNTING':
                router.push('/(main)/crm');
                break;
            case 'OPEN_WEB_URL':
                if (payload?.url) {
                    Linking.openURL(payload.url).catch(() =>
                        Alert.alert('Lỗi', 'Không thể mở đường dẫn này.')
                    );
                }
                break;

            // ─── GENERIC NAVIGATE ──────────────────────────────────────────
            case 'OPEN_DYNAMIC_SCREEN':
                if (payload?.slug) {
                    const isMock = payload.slug.includes('mock');
                    console.log(`[ActionRegistry] 🔗 Điều hướng Động tới: ${payload.slug} ${isMock ? '(MOCK_DATA)' : '(REAL_DATA)'}`);

                    // [Bypass Expo Router Bug]: Tránh việc router hiểu nhầm Full URL thành 1 Deep Link và văng về trang chủ
                    let safeSlug = payload.slug;
                    if (safeSlug.startsWith('http')) {
                        const toHex = (str: string) => Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
                        safeSlug = `hex_${toHex(safeSlug)}`;
                    }

                    router.push({
                        pathname: '/(main)/screen/[slug]',
                        params: { slug: safeSlug, title: payload.title || 'Tính năng' }
                    } as any);
                } else {
                    console.warn(`[ActionRegistry] ❌ Lệnh OPEN_DYNAMIC_SCREEN thất bại do thiếu payload.slug`);
                }
                break;
            case 'API_REQUEST_NO_UI':
                if (payload?.url) {
                    const method = (payload.method || 'POST').toUpperCase();
                    const body = payload.body || {};
                    const confirmMsg = payload.confirm_message;

                    const executeApi = async () => {
                        try {
                            const config: EndpointConfig<any, any> = {
                                path: payload.url,
                                req: z.any() as any,
                                res: z.any(),
                                fallbackRes: {}
                            };

                            if (method === 'DELETE' || method === 'PUT') {
                                // @ts-ignore
                                await ApiClient.actionSafe(config, body, method);
                            } else {
                                await ApiClient.post(payload.url, body);
                            }

                            Alert.alert('Thành công', payload.success_message || 'Thao tác hoàn tất!');
                            // TODO: trigger refresh màn hình hiện tại nếu cần
                        } catch (e: any) {
                            Alert.alert('Thất bại', e?.message || 'Không thể thực hiện yêu cầu.');
                        }
                    };

                    if (confirmMsg) {
                        Alert.alert('Xác nhận', confirmMsg, [
                            { text: 'Hủy', style: 'cancel' },
                            { text: 'Đồng ý', onPress: executeApi, style: 'destructive' }
                        ]);
                    } else {
                        executeApi();
                    }
                }
                break;
            case 'NAVIGATE':
                if (payload?.path) {
                    router.push(payload.path);
                } else {
                    console.warn('[ActionRegistry] NAVIGATE thiếu payload.path');
                }
                break;

            // ─── SYSTEM ────────────────────────────────────────────────────
            case 'OPEN_MAP':
                if (payload?.lat && payload?.lng) {
                    const url = `https://maps.google.com/?q=${payload.lat},${payload.lng}`;
                    Linking.openURL(url).catch(() =>
                        Alert.alert('Lỗi', 'Không thể mở bản đồ. Vui lòng cài đặt Google Maps.')
                    );
                }
                break;

            case 'CALL_PHONE': {
                // Hỗ trợ cả format "CALL_PHONE" với payload.phone và "TEL:0987..."
                const phone = payload?.phone || (action.startsWith('TEL:') ? action.replace('TEL:', '') : null);
                if (phone) {
                    Linking.openURL(`tel:${phone}`).catch(() =>
                        Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi.')
                    );
                }
                break;
            }

            case 'OPEN_COMPANY_INFO':
                Alert.alert(
                    'Thông tin Công ty',
                    'CÔNG TY TNHH CÔNG NGHỆ QUỐC VIỆT\nĐịa chỉ: TP. Vinh, Nghệ An\nHotline: 091.222.1011'
                );
                break;

            case 'SEND_GREETING_CARD':
                Alert.alert('Hệ thống', 'Tính năng gửi thiệp chúc mừng đang phát triển!');
                break;

            case 'OPEN_POST_CREATOR':
                Alert.alert('Hệ thống', 'Trình đăng bài viết Social đang được hoàn thiện.');
                break;

            // ─── NO-OP ─────────────────────────────────────────────────────
            case 'NONE':
            case 'NO_ACTION':
                break;

            default:
                // Xử lý format "TEL:xxxx" động từ backend
                if (typeof action === 'string' && action.startsWith('TEL:')) {
                    const phone = action.replace('TEL:', '');
                    Linking.openURL(`tel:${phone}`).catch(() =>
                        Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi.')
                    );
                    break;
                }
                // Xử lý format URL động
                if (typeof action === 'string' && (action.startsWith('http://') || action.startsWith('https://'))) {
                    Linking.openURL(action).catch(() =>
                        Alert.alert('Lỗi', 'Không thể mở đường dẫn này.')
                    );
                    break;
                }
                console.warn(`[ActionRegistry] ⚠️ Unregistered action: "${action}". Thêm handler vào ActionRegistry.ts`);
                break;
        }
    }
};
