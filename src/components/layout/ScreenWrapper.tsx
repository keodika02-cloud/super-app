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
    type ViewStyle,
    type StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';

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
        <SafeAreaView style={{ flex: 1, backgroundColor }}>
            <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />

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

            <View style={[{ flex: 1 }, style]}>{children}</View>
        </SafeAreaView>
    );
}
