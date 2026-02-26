/**
 * src/components/layout/ScreenWrapper.tsx
 * Wrapper chuẩn cho mọi màn hình:
 * - SafeAreaView tự động
 * - Offline banner (mạng mất → hiện banner cam)
 * - Background color nhất quán
 */
import React from 'react';
import {
    View,
    Text,
    StatusBar,
    Platform,
    type ViewStyle,
    type StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { ErrorBoundary } from '../error/ErrorBoundary';

interface ScreenWrapperProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    showOfflineBanner?: boolean;
    backgroundColor?: string;
}

export function ScreenWrapper({
    children,
    style,
    showOfflineBanner = true,
    backgroundColor = '#0f172a',
}: ScreenWrapperProps) {
    const netInfo = useNetInfo();
    const isOffline = netInfo.isConnected === false;

    return (
        <View style={{ flex: 1, backgroundColor }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <StatusBar
                    barStyle="light-content"
                    translucent={Platform.OS === 'ios'}
                    backgroundColor={backgroundColor}
                />

                {/* Offline Banner */}
                {showOfflineBanner && isOffline && (
                    <View
                        style={{
                            backgroundColor: '#f97316',
                            paddingVertical: 6,
                            paddingHorizontal: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
                            📵 Đang ngoại tuyến – Một số tính năng bị giới hạn
                        </Text>
                    </View>
                )}

                <ErrorBoundary>
                    <View style={[{ flex: 1 }, style]}>{children}</View>
                </ErrorBoundary>
            </SafeAreaView>
        </View>
    );
}
