import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { ApiClient } from '../../src/services/ApiClient';
import { API_ENDPOINTS, type SduiBlock } from '../../src/config/api-endpoints';
import { useHybridData } from '../../src/hooks/useHybridData';
import { SduiEngine } from '../../src/components/blocks/SduiEngine';

// Hardcoded fallback for "More" screen just in case API fails
const FALLBACK_LAYOUT: SduiBlock[] = [
    { id: 'more_fb_1', type: 'ProfileHeaderBlock', data: { greeting: 'Hồ sơ' } },
    {
        id: 'more_fb_2',
        type: 'GridMenuBlock',
        data: {
            title: 'Hệ thống ngoại tuyến',
            items: [
                { label: 'Cài đặt', icon: '⚙️', action: 'OPEN_SETTINGS', bg_color: '#f1f5f9' }
            ]
        }
    }
];

export default function MoreScreen() {
    const { data: blocks, isRefreshing, refetch, status } = useHybridData<SduiBlock[]>({
        cacheKey: 'sdui_more_layout_v3',
        fetchApi: async () => {
            // Nối query param ?screen_slug=goto_more để lấy giao diện động cho Tab Thêm
            const response = await ApiClient.fetchSafe({
                ...API_ENDPOINTS.V3.APP.UI_LAYOUT,
                path: API_ENDPOINTS.V3.APP.UI_LAYOUT.path + '?screen_slug=goto_more'
            }, {});
            return Array.isArray(response) ? response : [];
        },
        hardcodedFallback: FALLBACK_LAYOUT,
        isValidData: (res) => Array.isArray(res) && res.length >= 2,
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
                <Text style={styles.headerTitle}>Khám phá</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconBtn}><Text style={styles.iconTxt}>✨</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Text style={styles.iconTxt}>🔔</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}><Text style={styles.iconTxt}>🔍</Text></TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor="#3b82f6" />}
            >
                {status === 'fallback_hardcoded' && (
                    <View style={styles.offlineBox}>
                        <Text style={styles.offlineText}>⚠️ Đang hiển thị giao diện bộ đệm</Text>
                    </View>
                )}

                <SduiEngine blocks={blocks} />

            </ScrollView>

            {/* FLOATING ACTION BUTTON */}
            <TouchableOpacity style={styles.fabItem}>
                <View style={styles.fabInner}>
                    <Text style={styles.fabIcon}>⏱️</Text>
                </View>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        paddingBottom: 40,
        paddingHorizontal: 0, // Padding provided by SduiEngine
    },
    headerArea: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    headerActions: {
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
    iconTxt: { fontSize: 18 },
    offlineBox: {
        backgroundColor: '#fef2f2',
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#fecaca',
    },
    offlineText: { color: '#dc2626', fontSize: 12, fontWeight: '600' },
    fabItem: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f97316',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 2,
        borderColor: '#fff',
    },
    fabInner: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#ea580c',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabIcon: { fontSize: 24, color: '#fff' },
});
