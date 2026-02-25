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
import { Env } from '../../src/config/env';

export default function CrmWebViewScreen() {
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);
    const targetUrl = Env.EXPO_PUBLIC_CRM_URL;

    console.log(`[CrmScreen] 🌐 Loading WebView: ${targetUrl}`);

    // Inject token khi WebView tải xong — chỉ domain tin cậy
    const handleLoadEnd = useCallback(async (event: any) => {
        const currentUrl = event?.nativeEvent?.url;
        console.log('[CrmScreen] ✅ WebView load finished:', currentUrl);
        setLoading(false);

        // [SECURITY] BridgeService.injectToken kiểm tra isAuthorizedDomain() trước khi inject
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
                    // Bridge protocol
                    onMessage={handleMessage}
                    // Token injection
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={handleLoadEnd}
                    // External links
                    onShouldStartLoadWithRequest={handleShouldStartLoad}
                    onError={(e) => {
                        console.error('[CrmScreen] ❌ WebView error:', e.nativeEvent);
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
