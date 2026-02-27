import React from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, StatusBar, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from './ScreenWrapper';
import { ErrorBoundary } from '../error/ErrorBoundary';
import { useHybridData } from '../../hooks/useHybridData';
import { ApiClient } from '../../services/ApiClient';
import { ScreenConfig } from '../../config/ScreenConfigs';
import { SduiLayoutSchema } from '../../config/api-endpoints';

interface SafeScreenProps {
    config: ScreenConfig;
    children: (data: any, isRefreshing: boolean, refetch: () => void) => React.ReactNode;
    showScroll?: boolean;
    headerRight?: React.ReactNode;
    showBackButton?: boolean;
}

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const SafeScreen: React.FC<SafeScreenProps> = ({ config, children, showScroll = true, headerRight, showBackButton = false }) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Memoize fallback để tránh loop render do reference thay đổi
    const memoizedFallback = React.useMemo(() =>
        SduiLayoutSchema.parse(config.fallbackLayout),
        [config.fallbackLayout]);

    // Memoize fetchApi
    const fetchApi = React.useCallback(async () => {
        const path = config.queryParams
            ? config.apiEndpoint.path + '?' + new URLSearchParams(config.queryParams).toString()
            : config.apiEndpoint.path;

        return await ApiClient.fetchSafe({
            ...config.apiEndpoint,
            path
        }, {});
    }, [config.apiEndpoint, config.queryParams]);

    const { data, isRefreshing, refetch, status } = useHybridData<any>({
        cacheKey: config.cacheKey,
        fetchApi,
        hardcodedFallback: memoizedFallback,
        isValidData: (res) => {
            if (Array.isArray(res)) return true;
            if (typeof res === 'object' && res !== null) return true;
            return false;
        }
    });

    React.useEffect(() => {
        if (status === 'success_api' || status === 'success_cache' || status === 'fallback_hardcoded') {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }
    }, [status]);

    const renderContent = () => (
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {status === 'fallback_hardcoded' && (
                <View style={styles.offlineWarning}>
                    <Text style={styles.offlineText}>⚠️ Chế độ ngoại tuyến</Text>
                </View>
            )}
            {children(data, isRefreshing, refetch)}
        </Animated.View>
    );

    return (
        <ErrorBoundary scope={config.id}>
            <ScreenWrapper>
                <StatusBar barStyle="dark-content" />
                <LinearGradient
                    colors={['#e0f2fe', '#f8fafc']}
                    style={StyleSheet.absoluteFillObject}
                />

                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        {showBackButton && (
                            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                <Text style={styles.backButtonText}>← Bấm để Quay lại</Text>
                            </TouchableOpacity>
                        )}
                        <Text style={styles.title}>{config.title}</Text>
                    </View>
                    {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
                </View>

                <View style={{ flex: 1, paddingBottom: insets.bottom }}>
                    {showScroll ? (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ flexGrow: 1 }}
                            refreshControl={
                                <RefreshControl
                                    refreshing={isRefreshing}
                                    onRefresh={refetch}
                                    tintColor="#3b82f6"
                                />
                            }
                        >
                            {renderContent()}
                        </ScrollView>
                    ) : (
                        renderContent()
                    )}
                </View>
            </ScreenWrapper>
        </ErrorBoundary>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        marginRight: 12,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
    },
    backButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3b82f6',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    content: {
        flex: 1,
    },
    offlineWarning: {
        backgroundColor: '#fee2e2',
        paddingVertical: 4,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#fecaca',
    },
    offlineText: {
        fontSize: 10,
        color: '#b91c1c',
        fontWeight: '700',
    }
});
