import React from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { ApiClient } from '../../src/services/ApiClient';
import { API_ENDPOINTS, type SduiBlock } from '../../src/config/api-endpoints';
import { useHybridData } from '../../src/hooks/useHybridData';
import { SduiEngine } from '../../src/components/blocks/SduiEngine';

const FALLBACK_LAYOUT: SduiBlock[] = [
    {
        id: 'reports_fb_1',
        type: 'SummaryCardBlock',
        data: {
            title: 'Báo cáo ngoại tuyến',
            subtitle: 'Chưa có kết nối',
            stats: [
                { label: 'Trạng thái', value: 'Offline' }
            ]
        }
    }
];

export default function ReportsScreen() {
    const { data: blocks, isRefreshing, refetch, status } = useHybridData<SduiBlock[]>({
        cacheKey: 'sdui_reports_layout_v3',
        fetchApi: async () => {
            const response = await ApiClient.fetchSafe({
                ...API_ENDPOINTS.V3.APP.UI_LAYOUT,
                path: API_ENDPOINTS.V3.APP.UI_LAYOUT.path + '?screen_slug=goto_reports'
            }, {});
            return Array.isArray(response) ? response : [];
        },
        hardcodedFallback: FALLBACK_LAYOUT,
        isValidData: (res) => Array.isArray(res) && res.length >= 1,
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#e0f2fe', '#f8fafc']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.5 }}
            />

            <View style={styles.headerArea}>
                <Text style={styles.headerTitle}>Báo cáo</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor="#3b82f6" />}
            >
                {status === 'fallback_hardcoded' && (
                    <View style={styles.offlineBox}>
                        <Text style={styles.offlineText}>⚠️ Đang hiển thị dữ liệu bộ đệm</Text>
                    </View>
                )}

                <SduiEngine blocks={blocks} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollContent: { paddingBottom: 40 },
    headerArea: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#0f172a' },
    offlineBox: { backgroundColor: '#fef2f2', padding: 8, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#fecaca' },
    offlineText: { color: '#dc2626', fontSize: 12, fontWeight: '600' }
});
