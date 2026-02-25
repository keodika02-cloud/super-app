/**
 * src/screens/CrmWebViewScreen.tsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Màn hình CRM – Zero-Crash & Offline-friendly version.
 * ──────────────────────────────────────────────────────────────────────────────
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, BackHandler, Platform,
} from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { useNetInfo } from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@stores/useAuthStore';
import { BridgeService } from '@services/BridgeService';
import { Env } from '@config/env';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { SkeletonList } from '@components/ui/SkeletonCard';
import { AppButton } from '@components/ui/AppButton';

export function CrmWebViewScreen() {
    const webViewRef = useRef<WebView>(null);
    const router = useRouter();
    const netInfo = useNetInfo();
    const { token } = useAuthStore();
    const isOffline = netInfo.isConnected === false;

    const [loading, setLoading] = useState(true);
    const [canGoBack, setCanGoBack] = useState(false);
    const [currentUrl, setCurrentUrl] = useState<string>(Env.EXPO_PUBLIC_CRM_URL);
    const [refreshKey, setRefreshKey] = useState(0);

    const reload = useCallback(() => {
        setRefreshKey((prev) => prev + 1);
        setLoading(true);
    }, []);

    // Inject token khi WebView load xong
    const onLoadEnd = useCallback(() => {
        setLoading(false);
        if (token) {
            BridgeService.injectToken(webViewRef as any, currentUrl);
        }
    }, [token, currentUrl]);

    const onNavigationStateChange = (navState: any) => {
        setCanGoBack(navState.canGoBack);
        setCurrentUrl(navState.url);
    };

    // Theo dõi offline để tự reload khi có mạng lại
    useEffect(() => {
        if (!isOffline && loading) {
            reload();
        }
    }, [isOffline, loading, reload]);

    // [Web Fix] iframe web không trigger onLoadEnd ổn định do CORS
    useEffect(() => {
        if (Platform.OS === 'web' && loading) {
            const timer = setTimeout(() => {
                setLoading(false);
                // Vẫn thử injectToken nếu có token dù trên web (có thể lỗi CORS nhưng sẽ bị catch)
                if (token) {
                    BridgeService.injectToken(webViewRef as any, currentUrl);
                }
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [loading, token]);

    // Android Back button
    useEffect(() => {
        if (Platform.OS !== 'android') return;
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (canGoBack) {
                webViewRef.current?.goBack();
                return true;
            }
            return false;
        });
        return () => backHandler.remove();
    }, [canGoBack]);

    const onShouldStartLoad = useCallback(({ url }: WebViewNavigation) => {
        if (BridgeService.shouldOpenExternally(url)) {
            import('expo-web-browser').then(({ openBrowserAsync }) => openBrowserAsync(url));
            return false;
        }
        return true;
    }, []);

    const onMessage = useCallback((event: any) => {
        BridgeService.handleMessage(event, webViewRef as any, (screen) => {
            router.push(screen as any);
        });
    }, [router]);

    // UI khi OFFLINE hẳn
    if (isOffline) {
        return (
            <ScreenWrapper>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>📶</Text>
                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
                        Mất kết nối mạng
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
                        CRM yêu cầu kết nối mạng để truy cập dữ liệu trực tiếp.
                        Vui lòng kiểm tra Wifi/4G của bạn.
                    </Text>
                    <AppButton label="Thử tải lại" onPress={reload} variant="outline" fullWidth />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            {/* Header Toolbar */}
            <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
                {canGoBack && (
                    <TouchableOpacity onPress={() => webViewRef.current?.goBack()} style={{ padding: 8 }}>
                        <Text style={{ color: '#fff', fontSize: 16 }}>⬅️</Text>
                    </TouchableOpacity>
                )}
                <Text style={{ flex: 1, color: '#94a3b8', fontSize: 14, textAlign: 'center' }} numberOfLines={1}>
                    CRM Portal
                </Text>
                <TouchableOpacity onPress={reload} style={{ padding: 8 }}>
                    <Text style={{ color: '#fff', fontSize: 16 }}>🔄</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
                {/* Loading Overlay bằng Skeleton */}
                {loading && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, backgroundColor: '#0f172a' }}>
                        <SkeletonList count={8} />
                    </View>
                )}

                <WebView
                    key={refreshKey}
                    ref={webViewRef}
                    source={{ uri: Env.EXPO_PUBLIC_CRM_URL }}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={onLoadEnd}
                    onMessage={onMessage}
                    onNavigationStateChange={onNavigationStateChange}
                    onShouldStartLoadWithRequest={onShouldStartLoad}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowsBackForwardNavigationGestures={true}
                    pullToRefreshEnabled={Platform.OS === 'ios'}
                    style={{ flex: 1, opacity: loading ? 0 : 1 }}
                    startInLoadingState={false}
                />
            </View>
        </ScreenWrapper>
    );
}
