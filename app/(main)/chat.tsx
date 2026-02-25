import React from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ApiClient } from '../../src/services/ApiClient';
import { API_ENDPOINTS, type SduiBlock } from '../../src/config/api-endpoints';
import { useHybridData } from '../../src/hooks/useHybridData';
import { SduiEngine } from '../../src/components/blocks/SduiEngine';

export default function ChatScreen() {
    const { data: blocks, isRefreshing, refetch } = useHybridData<SduiBlock[]>({
        cacheKey: 'sdui_chat_layout_v3',
        fetchApi: async () => {
            const response = await ApiClient.fetchSafe({
                ...API_ENDPOINTS.V3.APP.UI_LAYOUT,
                path: API_ENDPOINTS.V3.APP.UI_LAYOUT.path + '?screen_slug=goto_chat'
            }, {});
            return Array.isArray(response) ? response : [];
        },
        hardcodedFallback: [
            { id: 'chat_fb_1', type: 'HtmlBlock', data: { height: 150, html: "<div style='background: #f1f5f9; padding: 20px; border-radius: 16px; text-align: center;'><p>Chat đang bảo trì hoặc offline.</p></div>" } }
        ],
        isValidData: (res) => Array.isArray(res) && res.length >= 0,
    });

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#e0f2fe', '#f8fafc']} style={StyleSheet.absoluteFillObject} />
            <View style={styles.headerArea}>
                <Text style={styles.headerTitle}>Hội thoại</Text>
            </View>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor="#3b82f6" />}
            >
                <SduiEngine blocks={blocks} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollContent: { paddingBottom: 40 },
    headerArea: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#0f172a' }
});
