/**
 * src/services/BridgeService.ts
 * SINGLE RESPONSIBILITY: Giao tiếp hai chiều Native ↔ WebView.
 *
 * Mỗi action của CRM web chỉ làm 1 chức năng duy nhất,
 * đảm bảo Apple không reject vì logic phức tạp ẩn trong WebView.
 *
 * Protocol: CRM web gọi:
 *   window.ReactNativeBridge?.postMessage(JSON.stringify({ action, payload }))
 * App xử lý và gọi lại:
 *   webViewRef.injectJavaScript(`window.onNativeCallback(${JSON.stringify(result)})`)
 */
import { RefObject } from 'react';
import type WebView from 'react-native-webview';
import { MediaService } from './MediaService';
import { HardwareService } from './HardwareService';
import { StorageService } from './StorageService';
import { Env } from '@config/env';

// ─── Action types từ WebView ──────────────────────────────────────────────────

export type BridgeAction =
    | 'OPEN_CAMERA'
    | 'OPEN_GALLERY'
    | 'OPEN_FILE'
    | 'GET_LOCATION'
    | 'GET_DEVICE_INFO'
    | 'OPEN_NATIVE_CHECKIN'
    | 'LOGOUT'
    | string;

export interface BridgeMessage {
    action: BridgeAction;
    payload?: Record<string, unknown>;
    callback_id?: string; // ID để WebView nhận kết quả đúng
}

export interface BridgeResponse {
    callback_id?: string;
    success: boolean;
    data?: unknown;
    error?: string;
}

// ─── Inject token vào WebView (sau khi login native) ─────────────────────────

function buildTokenInjectionScript(token: string): string {
    return `
    (function() {
      try {
        // [SECURITY_FIX]: Prevent XSS by strictly serializing the token.
        // Never use string interpolation like \`\${token}\` inside injected scripts.
        const safeToken = ${JSON.stringify(token)};
        window.localStorage.setItem('qvc_app_token', safeToken);
        window.localStorage.setItem('qvc_native_mode', 'true');
        window.localStorage.setItem('qvc_platform', 'mobile_app');
        // Nếu CRM đang ở trang login → redirect về home
        if (
          window.location.pathname.includes('/login') ||
          window.location.pathname === '/'
        ) {
          // CRM sẽ tự detect token và redirect
          window.dispatchEvent(new Event('qvc_native_login'));
        }
      } catch(e) {
        console.warn('Bridge inject lỗi:', e);
      }
    })();
    true; // Bắt buộc return true để WebView không báo lỗi
  `;
}

/**
 * Kiểm tra domain có thuộc diện tin cậy để bơm Token hay không.
 * Chỉ cho phép maytinhquocviet.com và các subdomain (ví dụ: crm.maytinhquocviet.com).
 */
function isAuthorizedDomain(url: string | undefined): boolean {
    if (!url) return false;
    try {
        const hostname = new URL(url).hostname;
        return hostname === 'maytinhquocviet.com' || hostname.endsWith('.maytinhquocviet.com');
    } catch {
        return false;
    }
}

async function injectToken(webViewRef: RefObject<WebView>, currentUrl?: string): Promise<void> {
    const token = await StorageService.getToken();
    if (!token || !webViewRef.current) return;

    // [SECURITY_CHECK]: Chỉ bơm token vào đúng trang CRM và các site nội bộ tin cậy.
    if (!isAuthorizedDomain(currentUrl)) {
        console.warn(`[BridgeService] Chặn bơm token vào domain không an toàn: ${currentUrl}`);
        return;
    }

    const script = buildTokenInjectionScript(token);
    webViewRef.current.injectJavaScript(script);
}

// ─── Xử lý message từ WebView → mở native feature ───────────────────────────

async function handleMessage(
    event: { nativeEvent: { data: string } },
    webViewRef: RefObject<WebView>,
    onNavigate?: (screen: string) => void,
): Promise<void> {
    let message: BridgeMessage;

    try {
        message = JSON.parse(event.nativeEvent.data);
    } catch {
        return; // Bỏ qua message không phải JSON
    }

    console.info(`[BridgeService] Nhận action: ${message.action}`);

    let response: BridgeResponse = { callback_id: message.callback_id, success: false };

    try {
        switch (message.action) {
            // Chụp ảnh bằng Camera native
            case 'OPEN_CAMERA': {
                const media = await MediaService.capturePhoto();
                response = {
                    callback_id: message.callback_id,
                    success: !!media,
                    data: media,
                };
                break;
            }

            // Chọn ảnh từ thư viện
            case 'OPEN_GALLERY': {
                const media = await MediaService.pickImage();
                response = { callback_id: message.callback_id, success: !!media, data: media };
                break;
            }

            // Chọn file tài liệu
            case 'OPEN_FILE': {
                const media = await MediaService.pickDocument();
                response = { callback_id: message.callback_id, success: !!media, data: media };
                break;
            }

            // Lấy GPS
            case 'GET_LOCATION': {
                const loc = await HardwareService.getLocation();
                response = { callback_id: message.callback_id, success: true, data: loc };
                break;
            }

            // Lấy info thiết bị
            case 'GET_DEVICE_INFO': {
                const info = HardwareService.getDeviceInfo();
                response = { callback_id: message.callback_id, success: true, data: info };
                break;
            }

            // Mở màn hình checkin native
            case 'OPEN_NATIVE_CHECKIN': {
                onNavigate?.('/(main)/checkin');
                response = { callback_id: message.callback_id, success: true };
                break;
            }

            // Logout từ WebView
            case 'LOGOUT': {
                await StorageService.clearSession();
                onNavigate?.('/(auth)/login');
                response = { callback_id: message.callback_id, success: true };
                break;
            }

            default:
                console.warn(`[BridgeService] Action không xử lý được: ${message.action}`);
                response = { callback_id: message.callback_id, success: false, error: `Unknown action: ${message.action}` };
        }
    } catch (err: any) {
        console.error(`[BridgeService] Lỗi khi xử lý ${message.action}:`, err);
        response = { callback_id: message.callback_id, success: false, error: err?.message };
    }

    // Ghi kết quả về cho WebView
    if (message.callback_id && webViewRef.current) {
        const callbackScript = `
      window.onNativeBridgeCallback && window.onNativeBridgeCallback(${JSON.stringify(response)});
      true;
    `;
        webViewRef.current.injectJavaScript(callbackScript);
    }
}

// ─── URL không cần load trong WebView (mở trình duyệt ngoài) ─────────────────

function shouldOpenExternally(url: string): boolean {
    // Chỉ mở trình duyệt ngoài cho các scheme không phải web (mailto, tel, etc.)
    return !url.startsWith('http');
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const BridgeService = {
    injectToken,
    handleMessage,
    buildTokenInjectionScript,
    shouldOpenExternally,
};
