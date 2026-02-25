import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { ApiClient } from '../../src/services/ApiClient';
import { API_ENDPOINTS, type SduiBlock, SduiBlockSchema } from '../../src/config/api-endpoints';
import { safeArray } from '../../src/utils/safe';
import { BlockBoundary } from '../../src/components/error/BlockBoundary';
import { useHybridData } from '../../src/hooks/useHybridData';

import { SduiEngine } from '../../src/components/blocks/SduiEngine';
import { LinearGradient } from 'expo-linear-gradient';

const FALLBACK_LAYOUT: SduiBlock[] = [
    {
        id: "fallback_header",
        type: "ProfileHeaderBlock",
        data: { greeting: "Đang ngoại tuyến" }
    },
    {
        id: "fallback_banner",
        type: "BannerBlock",
        data: { title: "Không có kết nối mạng", subtitle: "Dữ liệu chưa được đồng bộ", action: "NONE" }
    }
];

// ─── 3. SCREEN CHÍNH TÍCH HỢP HYBRID DATA ────────────────────────────────────
export default function HomeScreen() {

    // Sử dụng HYBRID DATA HOOK: Tự động chạy Cache -> API -> Fallback
    const { data: blocks, isRefreshing, refetch, status } = useHybridData<SduiBlock[]>({
        cacheKey: 'sdui_home_layout_v3',
        fetchApi: async () => {
            const response = await ApiClient.fetchSafe(API_ENDPOINTS.V3.APP.UI_LAYOUT, {});
            return Array.isArray(response) ? response : [];
        },
        hardcodedFallback: FALLBACK_LAYOUT,
        // Chỉ chấp nhận mảng có ít nhất 2 blocks, nếu không coi như data rác/sập.
        isValidData: (res) => Array.isArray(res) && res.length >= 2,
    });

    return (
        <ScreenWrapper>
            {/* Background Gradient nhẹ nhàng */}
            <LinearGradient
                colors={['#e0f2fe', '#f8fafc']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.5 }}
            />

            {/* Thanh Header ảo của App */}
            <View style={styles.topBar}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.topBarTitle}>Bảng tin</Text>
                    <Text style={{ fontSize: 18, marginLeft: 4, color: '#1e293b' }}>⌄</Text>
                </View>
                <View style={styles.topBarActions}>
                    <TouchableOpacity style={styles.iconBtn}><Text>✨</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}><Text>🔍</Text></TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor="#3b82f6" />}
                showsVerticalScrollIndicator={false}
            >
                {/* Thông báo trạng thái mạng khi đang dùng bộ nhớ đệm */}
                {status === 'fallback_hardcoded' && (
                    <View style={styles.offlineBox}>
                        <Text style={styles.offlineText}>⚠️ Đang sử dụng giao diện ngoại tuyến</Text>
                    </View>
                )}

                <SduiEngine blocks={blocks} />

            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50, // Tránh tai thỏ
        paddingBottom: 16,
        backgroundColor: 'transparent',
    },
    topBarTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    topBarActions: {
        flexDirection: 'row',
        gap: 12,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    engineContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 20,
    },
    offlineBox: {
        backgroundColor: '#fef2f2',
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#fecaca',
    },
    offlineText: { color: '#dc2626', fontSize: 12, fontWeight: '600' }
});
