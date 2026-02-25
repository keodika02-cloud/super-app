import React from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, StatusBar, Animated } from 'react-native';
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
}

export const SafeScreen: React.FC<SafeScreenProps> = ({ config, children, showScroll = true, headerRight }) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

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
                    <Text style={styles.title}>{config.title}</Text>
                    {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
                </View>

                {showScroll ? (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
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
