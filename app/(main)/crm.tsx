/**
 * app/(main)/crm.tsx
 * Màn hình CRM WebView — tích hợp đầy đủ BridgeService:
 *   - Inject token tự động khi WebView tải xong (chỉ domain .maytinhquocviet.com)
 *   - Xử lý native bridge: Camera, GPS, File, Checkin, Logout
 *   - XSS protection qua JSON.stringify trong buildTokenInjectionScript
 */
import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { router } from 'expo-router';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { BridgeService } from '../../src/services/BridgeService';
import { StorageService } from '../../src/services/StorageService';
import { Env } from '../../src/config/env';

export default function CrmWebViewScreen() {
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const targetUrl = Env.EXPO_PUBLIC_CRM_URL;

    // Log khi màn hình khởi tạo & lấy token
    React.useEffect(() => {
        console.log(`[CrmScreen] 🚀 Screen Mounted. Target URL: ${targetUrl}`);
        StorageService.getToken().then(setToken);
    }, [targetUrl]);

    // Script inject sớm mỗi khi load trang
    const earlyInjectionScript = token ? BridgeService.buildTokenInjectionScript(token) : '';

    // Inject token khi WebView tải xong
    const handleLoadEnd = useCallback(async (event: any) => {
        const currentUrl = event?.nativeEvent?.url;
        console.log('[CrmScreen] ✅ WebView load finished:', currentUrl);
        setLoading(false);

        // Backup injection nếu earlyInjectionScript không bắt được (vd: SPA route change)
        await BridgeService.injectToken(webViewRef as any, currentUrl);
    }, []);

    // Xử lý message từ WebView (OPEN_CAMERA, GET_LOCATION, LOGOUT, ...)
    const handleMessage = useCallback(async (event: any) => {
        await BridgeService.handleMessage(
            event,
            webViewRef as any,
            (screen: string) => router.push(screen as any)
        );
    }, []);

    // Mở link ngoại tuyến trong trình duyệt hệ thống (tel:, mailto:, ...)
    const handleShouldStartLoad = useCallback((req: any) => {
        if (BridgeService.shouldOpenExternally(req.url)) {
            const { Linking } = require('react-native');
            Linking.openURL(req.url).catch(() => { });
            return false; // Không nạp vào WebView
        }
        return true;
    }, []);

    return (
        <ScreenWrapper showOfflineBanner={true}>
            <View style={styles.container}>
                <WebView
                    ref={webViewRef}
                    source={{ uri: targetUrl }}
                    style={styles.webview}
                    // Identification
                    userAgent="QVC-Mobile-App-WebView"
                    // Bridge protocol
                    onMessage={handleMessage}
                    // Token injection
                    injectedJavaScript={earlyInjectionScript}
                    onLoadStart={() => {
                        console.log('[CrmScreen] ⏳ WebView load started');
                        setLoading(true);
                    }}
                    onLoadProgress={(e) => {
                        const progress = e.nativeEvent.progress;
                        if (progress > 0.1 && progress < 1) {
                            console.log(`[CrmScreen] ▓▒░ Loading: ${(progress * 100).toFixed(0)}%`);
                        }
                        // Ẩn loading sớm khi đạt 90% để trải nghiệm mượt hơn
                        if (progress > 0.9) setLoading(false);
                    }}
                    onNavigationStateChange={(navState) => {
                        console.log(`[CrmScreen] 🔄 Nav State: ${navState.url} (Loading: ${navState.loading})`);
                    }}
                    onLoadEnd={handleLoadEnd}
                    // Advanced Debugging Logs
                    onHttpError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn(`[CrmScreen] ⚠️ HTTP Error: ${nativeEvent.statusCode} at ${nativeEvent.url}`);
                    }}
                    onRenderProcessGone={(syntheticEvent) => {
                        console.error('[CrmScreen] 💥 WebView Render Process Gone:', syntheticEvent.nativeEvent.didCrash ? 'CRASHED' : 'KILLED');
                    }}
                    onContentProcessDidTerminate={(syntheticEvent) => {
                        console.error('[CrmScreen] 💀 Content Process Terminated:', syntheticEvent.nativeEvent);
                    }}
                    // External links
                    onShouldStartLoadWithRequest={handleShouldStartLoad}
                    onError={(e) => {
                        console.error('[CrmScreen] ❌ WebView error:', e.nativeEvent.description, e.nativeEvent.domain, e.nativeEvent.code);
                        setLoading(false);
                    }}
                    // Security: disable mixed content + JS injection bridging
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    // [XSS_GUARD]: Native bridge nhận qua onMessage, không expose window.eval
                    injectedJavaScriptBeforeContentLoaded={`
                        window.ReactNativeBridge = {
                            postMessage: function(data) {
                                window.ReactNativeWebView.postMessage(data);
                            }
                        };
                        true;
                    `}
                />

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                )}
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    webview: { flex: 1 },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
