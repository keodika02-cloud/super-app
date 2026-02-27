/**
 * src/screens/CheckInScreen.tsx
 * Chấm công NATIVE – offline-first, GPS guard, Multi-step (GPS + Photo).
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Image, Platform } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';

import { HardwareService } from '@services/HardwareService';
import { ApiClient, ApiError } from '@services/ApiClient';
import { AppButton } from '@components/ui/AppButton';
import { GlassCard } from '@components/ui/GlassCard';
import { ScreenWrapper } from '@components/layout/ScreenWrapper';
import { SkeletonItem } from '@components/ui/SkeletonCard';
import { useScreenData } from '@hooks/useScreenData';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { QUERY_KEYS } from '../config/query-keys';

type PhotoType = 'photo' | 'photo_before' | 'photo_after' | 'photo_document';
type Step = 'WAITING_GPS' | 'READY_GPS' | 'TAKING_PHOTO' | 'CONFIRMING';

export function CheckInScreen() {
    // 💡 Hỗ trợ tái sử dụng cho nhiều mục đích chấm công khác nhau
    const params = useLocalSearchParams();
    const uiTitle = (params.title as string) || 'Chấm công';
    const checkInContext = (params.context as string) || 'ATTENDANCE_DAILY'; // VD: 'CUSTOMER_HOUSE', 'CHECKOUT_JOB'

    const queryClient = useQueryClient();
    const netInfo = useNetInfo();
    const isOffline = netInfo.isConnected === false;

    // Permissions
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);

    // Flow State
    const [step, setStep] = useState<Step>('WAITING_GPS');
    const [location, setLocation] = useState<any>(null);
    const [photos, setPhotos] = useState<Partial<Record<PhotoType, string>>>({});
    const [currentPhotoType, setCurrentPhotoType] = useState<PhotoType>('photo');

    // Data State
    const { data: rawHistory, isFirstLoad, isRefreshing } = useScreenData(
        QUERY_KEYS.CHECKIN_TODAY,
        () => ApiClient.fetchSafe(API_ENDPOINTS.V3.APP.CHECKIN_TODAY),
        { staleTime: 1000 * 60 * 5 }
    );
    const history = rawHistory ?? [];
    const lastResult = history[0] ?? null;

    // Bước 1: Lấy GPS Tự động
    useEffect(() => {
        let isMounted = true;
        HardwareService.getLocation().then((loc) => {
            if (isMounted) {
                setLocation(loc);
                setStep('READY_GPS');
            }
        });
        return () => { isMounted = false; };
    }, []);

    // Mutation chấm công – offline-first
    const checkInMutation = useMutation({
        mutationFn: async () => {
            if (!location) throw new Error('Chưa lấy được vị trí');
            // Ít nhất phải có 1 ảnh (ảnh bất kỳ hoặc ảnh chính)
            if (Object.keys(photos).length === 0) throw new Error('Cần ít nhất một ảnh minh chứng');

            const uuid = await HardwareService.generateUUID();
            const device = HardwareService.getDeviceInfo();

            if (location.is_mock && !__DEV__) {
                throw new ApiError(
                    'Không thể chấm công: GPS đang dùng vị trí giả lập. Vui lòng bật GPS thật.',
                    400, 'mock-gps-blocked'
                );
            }

            const formData = new FormData();
            formData.append('latitude', String(location.latitude));
            formData.append('longitude', String(location.longitude));
            formData.append('accuracy', String(location.accuracy));
            formData.append('is_mock', String(location.is_mock ? 1 : 0));
            formData.append('device_id', device.device_id);
            formData.append('device_model', device.model);
            formData.append('uuid', uuid);
            // Gửi action context lên Backend để phân loại
            formData.append('check_in_context', checkInContext);

            // Nén và đính kèm toàn bộ ảnh đã chụp
            for (const [key, uri] of Object.entries(photos)) {
                if (!uri || uri === 'mock-uri') continue;

                const manipResult = await ImageManipulator.manipulateAsync(
                    uri,
                    [{ resize: { width: 800 } }],
                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                );

                formData.append(key, {
                    uri: Platform.OS === 'android' ? manipResult.uri : manipResult.uri.replace('file://', ''),
                    type: 'image/jpeg',
                    name: `${key}_${uuid}.jpg`,
                } as any);
            }

            return ApiClient.uploadFormData(API_ENDPOINTS.V3.APP.CHECKIN_SUBMIT.path, formData);
        },
        networkMode: 'offlineFirst',
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHECKIN_TODAY });
            setStep('READY_GPS');
            setPhotos({});
            Alert.alert('Thành công', 'Hệ thống đã ghi nhận thông tin chấm công của bạn.');
        },
        onError: (err) => {
            if (err instanceof ApiError && err.code === 0) return;
            Alert.alert('Lỗi chấm công', err instanceof ApiError ? err.message : 'Có lỗi xảy ra');
        },
    });

    const isLoading = checkInMutation.isPending;

    // Actions
    const handleStartCamera = async (type: PhotoType = 'photo') => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                Alert.alert('Lỗi', 'Cần cấp quyền Camera để chụp ảnh minh chứng');
                return;
            }
        }
        setCurrentPhotoType(type);
        setStep('TAKING_PHOTO');
    };

    const handleTakePicture = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
            if (photo) {
                setPhotos(prev => ({ ...prev, [currentPhotoType]: photo.uri }));
                setStep('READY_GPS'); // Quay lại màn hình chính để chụp tiếp hoặc gửi
            }
        }
    };

    // Rendering
    if (step === 'TAKING_PHOTO') {
        if (Platform.OS === 'web') {
            return (
                <ScreenWrapper>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: 'white', marginBottom: 20 }}>Camera chưa hỗ trợ chạy Simulator Web.</Text>
                        <AppButton label="Dùng Ảnh Khảo (Test Web)" onPress={() => { setPhotos({ photo: 'mock-uri' }); setStep('READY_GPS'); }} />
                        <AppButton label="Hủy" variant="outline" onPress={() => setStep('READY_GPS')} style={{ marginTop: 10 }} />
                    </View>
                </ScreenWrapper>
            );
        }

        return (
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />

                <View style={{ position: 'absolute', bottom: 40, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 40 }}>
                    <TouchableOpacity onPress={() => setStep('READY_GPS')} style={{ padding: 16 }}>
                        <Text style={{ color: '#fff', fontSize: 16 }}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleTakePicture} style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', borderWidth: 4, borderColor: '#cbd5e1' }} />
                    <View style={{ width: 60 }} />
                </View>
            </View>
        );
    }

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Header (đổi động theo Context) */}
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 4 }}>
                    {uiTitle}
                </Text>
                <Text style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
                    {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                </Text>

                {/* GPS Info */}
                <GlassCard tight style={{ marginBottom: 16 }}>
                    {!location ? (
                        <SkeletonItem height={14} width="50%" />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ color: '#4ade80', fontSize: 16 }}>📍</Text>
                            <View>
                                <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '600' }}>Vị trí đã sẵn sàng</Text>
                                {location.is_mock ? (
                                    <Text style={{ color: '#f97316', fontSize: 12 }}>⚠️ Đang dùng vị trí mô phỏng</Text>
                                ) : (
                                    <Text style={{ color: '#94a3b8', fontSize: 12 }}>Độ chính xác: {location.accuracy?.toFixed(0) ?? '?'}m</Text>
                                )}
                            </View>
                        </View>
                    )}
                </GlassCard>

                {/* Bước 2: Chụp ảnh minh chứng */}
                {(step === 'READY_GPS' || step === 'CONFIRMING') && (
                    <GlassCard style={{ marginBottom: 20, paddingVertical: 20 }}>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 16, textAlign: 'center' }}>Ảnh minh chứng</Text>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
                            {[
                                { id: 'photo', label: 'Chân dung', icon: '👤' },
                                { id: 'photo_before', label: 'Trước việc', icon: '🔜' },
                                { id: 'photo_after', label: 'Sau việc', icon: '🔚' },
                                { id: 'photo_document', label: 'Tài liệu', icon: '📄' }
                            ].map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => handleStartCamera(item.id as PhotoType)}
                                    style={{ width: 70, alignItems: 'center' }}
                                >
                                    <View style={{
                                        width: 50, height: 50, borderRadius: 25,
                                        backgroundColor: photos[item.id as PhotoType] ? '#22c55e' : 'rgba(255,255,255,0.05)',
                                        alignItems: 'center', justifyContent: 'center', marginBottom: 6,
                                        borderWidth: 1, borderColor: photos[item.id as PhotoType] ? '#4ade80' : 'transparent'
                                    }}>
                                        {photos[item.id as PhotoType] ? (
                                            <Image source={{ uri: photos[item.id as PhotoType] }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                                        ) : (
                                            <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                                        )}
                                    </View>
                                    <Text style={{ color: '#94a3b8', fontSize: 10, textAlign: 'center' }}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <AppButton
                            label={Object.keys(photos).length > 0 ? (isOffline ? 'Lưu Ngoại Tuyến' : 'Gửi Chấm Công 🚀') : 'Chụp ảnh để gửi'}
                            onPress={() => checkInMutation.mutate()}
                            disabled={Object.keys(photos).length === 0}
                            loading={isLoading}
                            fullWidth
                        />
                        {Object.keys(photos).length > 0 && (
                            <TouchableOpacity onPress={() => setPhotos({})} style={{ marginTop: 12, alignSelf: 'center' }}>
                                <Text style={{ color: '#ef4444', fontSize: 12 }}>Xóa hết ảnh</Text>
                            </TouchableOpacity>
                        )}
                    </GlassCard>
                )}

                {/* Kết quả lần chấm gần nhất (từ cache) */}
                {isFirstLoad ? null : lastResult ? (
                    <GlassCard style={{ marginBottom: 20, borderColor: 'rgba(34,197,94,0.3)', padding: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#86efac', fontSize: 13, fontWeight: '700' }}>✅ Lần chấm gần nhất</Text>
                            {isRefreshing && <Text style={{ color: '#64748b', fontSize: 10 }}>Đang tải...</Text>}
                        </View>
                        <Text style={{ color: '#e2e8f0', fontSize: 14, marginTop: 4 }}>{lastResult.message}</Text>
                        <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                            {new Date(lastResult.check_in_time).toLocaleTimeString('vi-VN')}
                        </Text>
                    </GlassCard>
                ) : null}

                {/* Offline notice */}
                {isOffline && (
                    <View style={{ backgroundColor: 'rgba(249,115,22,0.1)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f97316' }}>
                        <Text style={{ color: '#fdba74', fontSize: 13, lineHeight: 20 }}>
                            📵 Đang ngoại tuyến. Dữ liệu sẽ tự động gửi lên khi kết nối mạng trở lại.
                        </Text>
                    </View>
                )}

            </ScrollView>
        </ScreenWrapper>
    );
}
