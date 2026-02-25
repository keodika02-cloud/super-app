import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { HardwareService, SafeLocation } from '../../src/services/HardwareService';
import { ApiClient } from '../../src/services/ApiClient';
import { API_ENDPOINTS } from '../../src/config/api-endpoints';
import { GpsBlock } from '../../src/components/blocks/GpsBlock';
import { CameraBlock } from '../../src/components/blocks/CameraBlock';
import { UploadBlock } from '../../src/components/blocks/UploadBlock';
import { CommentBlock } from '../../src/components/blocks/CommentBlock';
import { ErrorBoundary } from '../../src/components/error/ErrorBoundary';

import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function CheckInScreen() {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [photoUri, setPhotoUri] = useState<string | null>(null);

    const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
        queryKey: ['checkin-today'],
        queryFn: async () => {
            const res = await ApiClient.fetchSafe(API_ENDPOINTS.V3.APP.CHECKIN_TODAY, undefined, 'GET');
            return Array.isArray(res) ? res : [];
        }
    });

    console.log('[CheckInScreen] 📍 Screen mounted. Waiting for user interaction...');

    const handleCheckIn = async () => {
        if (!photoUri) {
            Alert.alert('Chưa có ảnh', 'Vui lòng chụp ảnh chân dung/hiện trường trước khi chấm công!');
            return;
        }

        setIsSubmitting(true);
        console.log('[CheckInScreen] ⚡ Starting Check-in process...');

        try {
            // 1. Lấy vị trí GPS (Có cơ chế Mock trong HardwareService)
            const loc = await HardwareService.getLocation();
            console.log(`[CheckInScreen] 🛰️ GPS Locked: ${loc.latitude}, ${loc.longitude} (is_mock: ${loc.is_mock})`);

            // 2. Chuẩn bị FormData ảnh cho React Native
            const filename = photoUri.split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            const formData = new FormData();
            formData.append('lat', String(loc.latitude));
            formData.append('lng', String(loc.longitude));
            formData.append('is_mock', loc.is_mock ? 'true' : 'false');

            // @ts-ignore: FormData trong React Native nhận object type {uri, name, type}
            formData.append('photo_portrait', {
                uri: photoUri,
                name: filename,
                type: type,
            });

            // 3. Gửi lệnh tới Backend
            console.log(`[CheckInScreen] 📡 Sending check-in request to ${API_ENDPOINTS.V3.APP.CHECKIN_SUBMIT.path}...`);
            const result = await ApiClient.uploadFormData<any>(API_ENDPOINTS.V3.APP.CHECKIN_SUBMIT.path, formData);

            console.log('[CheckInScreen] ✅ Check-in API Success:', result);
            queryClient.invalidateQueries({ queryKey: ['checkin-today'] });
            Alert.alert('Thành công', result.message || 'Bạn đã chấm công thành công!');

        } catch (error: any) {
            console.error('[CheckInScreen] ❌ Check-in Error:', error.message);
            Alert.alert('Lỗi', 'Không thể hoàn thành chấm công. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScreenWrapper showOfflineBanner={true}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.title}>Chấm công & Check-in</Text>
                    <Text style={styles.desc}>Cung cấp bằng chứng vị trí và hình ảnh để hoàn tất quy trình.</Text>
                </View>

                {/* Tích hợp các Modular Blocks */}
                <ErrorBoundary scope="GpsBlock">
                    <GpsBlock data={{ label: 'Vị trí hiện tại', auto_refresh: true }} />
                </ErrorBoundary>

                {/* --- KHỐI LỊCH SỬ CHẤM CÔNG --- */}
                <ErrorBoundary scope="HistoryBlock">
                    <View style={styles.historyCard}>
                        <Text style={styles.historyTitle}>📜 Lịch sử hôm nay</Text>
                        {isLoadingLogs ? (
                            <ActivityIndicator color="#3b82f6" style={{ marginVertical: 10 }} />
                        ) : logs && logs.length > 0 ? (
                            logs.map((log: any, idx: number) => (
                                <View key={log.id || idx} style={styles.logItem}>
                                    <Text style={styles.logTime}>{log.message}</Text>
                                    <View style={[styles.badge, log.status === 'LATE' ? styles.badgeLate : styles.badgeOk]}>
                                        <Text style={styles.badgeText}>{log.status === 'LATE' ? 'Đi trễ' : 'Đúng giờ'}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.historyEmpty}>Chưa có lượt chấm công nào hôm nay.</Text>
                        )}
                    </View>
                </ErrorBoundary>

                <ErrorBoundary scope="CameraBlock">
                    <CameraBlock
                        data={{
                            label: 'Ảnh chân dung/Hiện trường',
                            required: true,
                            context_type: 'ATTENDANCE',
                            context_id: 'DAILY'
                        }}
                        onChange={setPhotoUri}
                    />
                </ErrorBoundary>

                <ErrorBoundary scope="CommentBlock">
                    <CommentBlock data={{
                        placeholder: 'Ghi chú thêm (nếu có)...',
                        context_type: 'ATTENDANCE',
                        context_id: 'DAILY'
                    }} />
                </ErrorBoundary>

                <View style={styles.actionBox}>
                    <TouchableOpacity
                        style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                        onPress={handleCheckIn}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>Xác nhận Chấm công 🚀</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 40 },
    card: { padding: 16, backgroundColor: '#fff', marginBottom: 8 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
    desc: { fontSize: 14, color: '#64748b', marginTop: 4 },
    actionBox: { padding: 20, alignItems: 'center' },
    submitBtn: {
        backgroundColor: '#3b82f6',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    submitBtnDisabled: {
        backgroundColor: '#94a3b8',
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    historyCard: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
    historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
    historyEmpty: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 },
    logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    logTime: { fontSize: 14, color: '#334155' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    badgeOk: { backgroundColor: '#dcfce7' },
    badgeLate: { backgroundColor: '#fee2e2' },
    badgeText: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' }
});
