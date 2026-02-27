import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    TextInput,
    Platform,
    StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    MapPin,
    Clock,
    Fingerprint,
    CheckCircle2,
    Calendar,
    History,
    RefreshCw,
    Camera,
    FileText
} from 'lucide-react-native';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { HardwareService } from '@services/HardwareService';
import { ApiClient } from '@services/ApiClient';
import { API_ENDPOINTS } from '@config/api-endpoints';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

export default function CheckInScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [note, setNote] = useState('');
    const [locationAddress, setLocationAddress] = useState('Đang xác định vị trí...');

    // Cập nhật đồng hồ realtime mỗi giây
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Lấy vị trí khi vào màn hình
    useEffect(() => {
        handleRefreshLocation();
    }, []);

    // Query lịch sử hôm nay
    const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
        queryKey: ['checkin-today'],
        queryFn: async () => {
            const res = await ApiClient.fetchSafe(API_ENDPOINTS.V3.APP.CHECKIN_TODAY, undefined, 'GET');
            return Array.isArray(res) ? res : [];
        }
    });

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDate = (date: Date) => {
        const options: any = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('vi-VN', options);
    };

    const handleRefreshLocation = async () => {
        setIsFetchingLocation(true);
        try {
            const loc = await HardwareService.getLocation();
            setLocationAddress(`Tọa độ: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}${loc.is_mock ? ' (Giả lập)' : ''}`);
        } catch (error) {
            setLocationAddress('Không thể xác nhận vị trí GPS');
        } finally {
            setIsFetchingLocation(false);
        }
    };

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Cấp quyền', 'App cần quyền truy cập Camera để chấm công nhé!');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 0.7,
            allowsEditing: false,
        });

        if (!result.canceled && result.assets) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handleCheckIn = async () => {
        if (!photoUri) {
            Alert.alert('Chưa có ảnh', 'Vui lòng chụp ảnh khuôn mặt trước khi chấm công!');
            return;
        }

        setIsSubmitting(true);
        try {
            const loc = await HardwareService.getLocation();

            const filename = photoUri.split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            const formData = new FormData();
            formData.append('lat', String(loc.latitude));
            formData.append('lng', String(loc.longitude));
            formData.append('is_mock', loc.is_mock ? 'true' : 'false');
            formData.append('note', note);

            // @ts-ignore
            formData.append('photo_portrait', {
                uri: photoUri,
                name: filename,
                type: type,
            });

            const result = await ApiClient.uploadFormData<any>(API_ENDPOINTS.V3.APP.CHECKIN_SUBMIT.path, formData);

            queryClient.invalidateQueries({ queryKey: ['checkin-today'] });
            Alert.alert('Thành công', result.message || 'Bạn đã chấm công thành công!');

            setPhotoUri(null);
            setNote('');
        } catch (error: any) {
            Alert.alert('Lỗi', 'Không thể hoàn thành chấm công. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getLogTime = (log: any) => {
        if (!log || !log.check_in_time) return '--:--';
        const d = new Date(log.check_in_time);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const punchInLog = logs.find((l: any) => l.status === 'SUCCESS' || l.status === 'ON_TIME' || l.message?.includes('vào'));
    const punchOutLog = logs.find((l: any) => l.status === 'OUT' || l.message?.includes('ra'));

    return (
        <ScreenWrapper showOfflineBanner={true} backgroundColor="#F0F2F5" style={{ backgroundColor: '#F0F2F5' }}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <ChevronLeft size={24} color="#1C1E21" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chấm công</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <History size={20} color="#1877F2" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.clockCard}>
                    <View style={styles.dateBadge}>
                        <Calendar size={14} color="#1877F2" />
                        <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
                    </View>
                    <Text style={styles.clockText}>{formatTime(currentTime)}</Text>
                    <Text style={styles.shiftText}>Ca Hành chính (08:00 - 17:30)</Text>
                </View>

                <View style={styles.infoCard}>
                    <View style={[styles.iconCircle, { backgroundColor: isFetchingLocation ? '#EFF6FF' : '#ECFDF5' }]}>
                        <MapPin size={24} color={isFetchingLocation ? '#3B82F6' : '#10B981'} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoTitle}>
                            {isFetchingLocation ? 'Đang định vị...' : 'Văn phòng Quốc Việt'}
                        </Text>
                        <Text style={styles.infoSub} numberOfLines={1}>
                            {locationAddress}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={handleRefreshLocation} disabled={isFetchingLocation} style={styles.refreshBtn}>
                        <RefreshCw size={20} color="#1877F2" style={{ marginBottom: 4 }} />
                        <Text style={styles.refreshText}>Làm mới</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.infoCard, { flexDirection: 'column', alignItems: 'stretch' }]}>
                    <Text style={styles.sectionLabel}>
                        <Camera size={16} color="#1877F2" /> Ảnh check-in <Text style={{ color: '#F43F5E' }}>*</Text>
                    </Text>

                    {!photoUri ? (
                        <TouchableOpacity style={styles.cameraPlaceholder} onPress={handleTakePhoto}>
                            <Camera size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
                            <Text style={styles.cameraPlaceholderText}>Nhấn để chụp khuôn mặt</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.photoPreviewContainer}>
                            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                            <TouchableOpacity style={styles.retakeBtn} onPress={handleTakePhoto}>
                                <Text style={styles.retakeText}>Chụp lại</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
                        <FileText size={16} color="#1877F2" /> Ghi chú (Tùy chọn)
                    </Text>
                    <TextInput
                        value={note}
                        onChangeText={setNote}
                        placeholder="Nhập lý do đi trễ, về sớm..."
                        placeholderTextColor="#94A3B8"
                        style={styles.noteInput}
                        multiline
                    />
                </View>

                <TouchableOpacity
                    style={[
                        styles.submitBtn,
                        (!photoUri || isFetchingLocation) && styles.submitBtnDisabled,
                        punchInLog && !punchOutLog && { backgroundColor: '#10B981', shadowColor: '#10B981' }
                    ]}
                    onPress={handleCheckIn}
                    disabled={isSubmitting || isFetchingLocation || !photoUri}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Fingerprint size={24} color="#fff" />
                            <Text style={styles.submitBtnText}>
                                {punchInLog && !punchOutLog ? 'XÁC NHẬN RA CA' : 'XÁC NHẬN CHẤM CÔNG'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.historyCard}>
                    <Text style={styles.historyTitle}>
                        <Clock size={16} color="#1877F2" /> Lịch sử hôm nay
                    </Text>

                    <View style={styles.timelineContainer}>
                        <View style={styles.timelineLine} />

                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, punchInLog ? styles.dotActive : styles.dotInactive]}>
                                {punchInLog ? <CheckCircle2 size={16} color="#10B981" /> : <Clock size={16} color="#94A3B8" />}
                            </View>
                            <Text style={styles.timelineLabel}>Giờ vào</Text>
                            <Text style={[styles.timelineTime, !punchInLog && { color: '#94A3B8' }]}>
                                {getLogTime(punchInLog)}
                            </Text>
                        </View>

                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, punchOutLog ? styles.dotActive : styles.dotInactive]}>
                                {punchOutLog ? <CheckCircle2 size={16} color="#10B981" /> : <Clock size={16} color="#94A3B8" />}
                            </View>
                            <Text style={styles.timelineLabel}>Giờ ra</Text>
                            <Text style={[styles.timelineTime, !punchOutLog && { color: '#94A3B8' }]}>
                                {getLogTime(punchOutLog)}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 44 : 20,
        paddingBottom: 12,
        backgroundColor: '#F0F2F5',
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '900',
        color: '#1C1E21',
        textAlign: 'center',
        marginHorizontal: 10,
    },
    clockCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
        gap: 6,
    },
    dateText: { fontSize: 13, fontWeight: '700', color: '#1877F2' },
    clockText: {
        fontSize: 48,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -1,
    },
    shiftText: { fontSize: 13, color: '#64748B', fontWeight: '500', marginTop: 4 },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        gap: 12,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    infoSub: { fontSize: 12, color: '#64748B' },
    refreshBtn: { alignItems: 'center', justifyContent: 'center', paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: '#F1F5F9' },
    refreshText: { fontSize: 10, fontWeight: '800', color: '#64748B' },
    sectionLabel: { flexDirection: 'row', alignItems: 'center', fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 10, gap: 6 },
    cameraPlaceholder: {
        height: 120,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraPlaceholderText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    photoPreviewContainer: {
        height: 160,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
    retakeBtn: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    retakeText: { fontSize: 12, fontWeight: '700', color: '#334155' },
    noteInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 12,
        fontSize: 14,
        color: '#334155',
        height: 80,
        textAlignVertical: 'top',
    },
    submitBtn: {
        backgroundColor: '#1877F2',
        borderRadius: 20,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#1877F2',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
        marginTop: 8,
        marginBottom: 16,
    },
    submitBtnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
    historyCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    historyTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 24, gap: 6 },
    timelineContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'relative',
        paddingHorizontal: 20,
    },
    timelineLine: {
        position: 'absolute',
        top: 20,
        left: 40,
        right: 40,
        height: 2,
        backgroundColor: '#F1F5F9',
    },
    timelineItem: { alignItems: 'center', width: '45%' },
    timelineDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 8,
    },
    dotActive: { backgroundColor: '#ECFDF5' },
    dotInactive: { backgroundColor: '#F8FAFC' },
    timelineLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' },
    timelineTime: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginTop: 2 },
});
