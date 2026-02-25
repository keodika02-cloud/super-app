/**
 * src/utils/ActionRegistry.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * SDUI Action Routing
 * Frontend tự định nghĩa luồng xử lý riêng cho từng mã (code) mà Backend trả về.
 * Tránh việc gửi code JS động từ backend, thỏa mãn 100% Policy của Apple.
 * ──────────────────────────────────────────────────────────────────────────────
 */
import { router } from 'expo-router';
import { Alert } from 'react-native';

// Định nghĩa tất cả các Action tĩnh được ứng dụng hỗ trợ
export type SupportedAction =
    | 'OPEN_APP_CHECKIN'
    | 'OPEN_APP_GUEST_CHECKIN'
    | 'OPEN_APP_CHECKOUT_JOB'
    | 'OPEN_WEB_ONEAI'
    | 'OPEN_WEB_RATING'
    | 'OPEN_WEB_ACCOUNTING'
    | 'OPEN_FEATURE_BIRTHDAY'
    | 'OPEN_FEATURE_PROFILE'
    | 'OPEN_FEATURE_SALARY'
    | 'OPEN_FEATURE_BENEFITS'
    | 'OPEN_FEATURE_UNIFORM'
    | 'OPEN_FEATURE_RESIGN'
    | 'OPEN_FEATURE_CHAT'
    | 'SEND_GREETING_CARD'
    | 'OPEN_COMPANY_INFO'
    | 'OPEN_POST_CREATOR'
    | 'NO_ACTION';

export const ActionRegistry = {
    execute(action: SupportedAction | string, payload?: any) {
        switch (action) {
            // ─── ỨNG DỤNG NATIVE ─────────────────────────────────────
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
            case 'OPEN_COMPANY_INFO':
                Alert.alert('Thông tin doanh nghiệp', 'CÔNG TY TNHH CÔNG NGHỆ QUỐC VIỆT\nĐịa chỉ: TP. Vinh, Nghệ An\nHotline: 1900 xxxx');
                break;

            // ─── TÍNH NĂNG CON ─────────────────────────────────────────
            case 'OPEN_FEATURE_CHAT':
                // Mở Chat System riêng biệt 
                Alert.alert('Chuyển hướng', 'Đang kết nối tới Hệ thống Chat Realtime chat.maytinhquocviet.com...');
                break;
            case 'OPEN_FEATURE_PROFILE':
                router.push('/(main)/profile');
                break;
            case 'OPEN_FEATURE_SALARY':
            case 'OPEN_FEATURE_BENEFITS':
            case 'OPEN_FEATURE_UNIFORM':
            case 'OPEN_FEATURE_RESIGN':
            case 'OPEN_FEATURE_BIRTHDAY':
                // Tạm thời điều hướng vào Notification hoặc một màn Coming Soon
                router.push('/(main)/notifications');
                break;

            // ─── WEB/CRM NỘI BỘ ─────────────────────────────────────
            case 'OPEN_WEB_ONEAI':
            case 'OPEN_WEB_RATING':
            case 'OPEN_WEB_ACCOUNTING':
                // Điều hướng sang CRM Tab chứa WebView
                router.push('/(main)/crm');
                break;

            case 'SEND_GREETING_CARD':
                alert('Tính năng gửi thiệp chúc mừng đang phát triển!');
                break;

            case 'OPEN_POST_CREATOR':
                Alert.alert('Tính năng mới', 'Trình đăng bài viết Social đang được hoàn thiện. Vui lòng quay lại sau!');
                break;

            default:
                console.log(`[ActionRegistry] Unknown or NO_ACTION: ${action}`);
                break;
        }
    }
};
