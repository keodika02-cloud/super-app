import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScanLine, Camera as CameraIcon, X, MapPin, RefreshCw } from 'lucide-react-native';

import { CheckInMap } from '@/presentation/components/hrm/CheckInMap';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { useCheckIn } from '@/data/hooks/useCheckIn';
import { LocationService, Coordinates } from '@/core/hardware/location';
import { CameraService } from '@/core/hardware/camera';
import { haversine } from '@/utils/geo';

export default function CheckInScreen() {
    const insets = useSafeAreaInsets();
    // Destructure expanded hook return
    const { mutate, isPending, offices, currentOffice, isValidLocation, validateLocation } = useCheckIn();

    // State
    const [location, setLocation] = useState<Coordinates | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [showCamera, setShowCamera] = useState(false);

    // Camera Ref
    const cameraRef = useRef<CameraView>(null);
    const [permission, requestPermission] = useCameraPermissions();

    // 1. Initial Load: Location
    useEffect(() => {
        loadLocation();
    }, []);

    const loadLocation = async () => {
        setLoadingLocation(true);
        try {
            const hasLocPerm = await LocationService.requestPermission();
            if (!hasLocPerm) {
                Alert.alert('Cấp quyền', 'Vui lòng cho phép truy cập vị trí để chấm công.');
                setLoadingLocation(false);
                return;
            }
            const coords = await LocationService.getCurrentLocation();
            setLocation(coords);

            // Validate immediately
            validateLocation(coords.latitude, coords.longitude);

        } catch (error: any) {
            Alert.alert('Lỗi GPS', error.message);
        } finally {
            setLoadingLocation(false);
        }
    };

    // 2. Handle Camera Open
    const handleOpenCamera = async () => {
        if (!location) {
            Alert.alert('Chưa có vị trí', 'Vui lòng xác định vị trí trước khi chấm công.');
            return;
        }

        if (!isValidLocation) {
            Alert.alert('Sai vị trí', 'Bạn đang ở ngoài vùng chấm công cho phép.');
            return;
        }

        if (!permission?.granted) {
            const { granted } = await requestPermission();
            if (!granted) {
                Alert.alert('Cần quyền Camera', 'Vui lòng cấp quyền Camera để chụp ảnh.');
                return;
            }
        }
        setShowCamera(true);
    };

    // 3. Handle Capture & Submit
    const handleCapture = async () => {
        if (!cameraRef.current) return;

        try {
            const photo = await cameraRef.current.takePictureAsync({
                base64: true,
                quality: 0.5,
                skipProcessing: Platform.OS === 'android', // Speed up on Android
            });

            // Submit logic via Hook
            if (photo && photo.base64) {
                setShowCamera(false); // Close first for UX
                mutate({
                    location: location,
                    photo: { uri: photo.uri, base64: photo.base64 }
                });
            }
        } catch (error) {
            console.error('Capture failed:', error);
            Alert.alert('Lỗi chụp ảnh', 'Không thể chụp ảnh. Vui lòng thử lại.');
        }
    };

    // Tính toán khoảng cách để hiển thị, kể cả khi chưa hợp lệ
    const nearestDebug = React.useMemo(() => {
        if (!location || !offices.length) return null;
        let minDistance = 1000000;
        let nearestName = '';
        let radius = 0;

        offices.forEach(office => {
            // Dùng hàm haversine import từ utils
            const dist = haversine(
                location.latitude, location.longitude,
                office.lat, office.long
            );
            if (dist < minDistance) {
                minDistance = dist;
                nearestName = office.name;
                radius = office.radius;
            }
        });
        return { name: nearestName, distance: minDistance, radius };
    }, [location, offices]);

    return (
        <View className="flex-1 bg-gray-100">
            {/* --- MAP BACKGROUND --- */}
            <View className="flex-1 absolute inset-0 z-0">
                <CheckInMap location={location} loading={loadingLocation} offices={offices} />
            </View>

            {/* --- [BẮT ĐẦU ĐOẠN UI DEBUG MỚI] --- */}
            {/* Hiển thị bảng thông số kỹ thuật đè lên Map */}
            {location && (
                <View className="absolute top-28 left-4 right-4 bg-black/80 p-4 rounded-xl z-10 border border-yellow-400 shadow-lg">
                    <Text className="text-yellow-400 font-bold text-xs mb-2 uppercase tracking-widest">
                        🛠 Chế độ Debug GPS
                    </Text>

                    <Text className="text-white text-xs font-mono">
                        📍 Bạn đang ở: {location.latitude}, {location.longitude}
                    </Text>

                    {nearestDebug && (
                        <View className="mt-2 pt-2 border-t border-white/20">
                            <Text className="text-gray-300 text-xs">
                                Văn phòng gần nhất: <Text className="text-white font-bold">{nearestDebug.name}</Text>
                            </Text>
                            <Text className="text-yellow-400 text-lg font-bold mt-1">
                                Khoảng cách: {nearestDebug.distance} mét
                            </Text>
                            <Text className="text-gray-400 text-[10px]">
                                (Yêu cầu phải nhỏ hơn: {nearestDebug.radius} mét)
                            </Text>
                        </View>
                    )}
                </View>
            )}
            {/* --- [KẾT THÚC ĐOẠN UI DEBUG MỚI] --- */}

            {/* --- HEADER (Transparent) --- */}
            <View
                style={{ paddingTop: insets.top + 10 }}
                className="px-4 z-10"
            >
                <GlassCard className="flex-row items-center p-3 bg-white/90">
                    <ScanLine size={20} className="text-blue-600 mr-3" color="#2563EB" />
                    <Text className="font-bold text-gray-800 text-lg">Chấm công</Text>
                </GlassCard>
            </View>

            {/* --- BOTTOM DASHBOARD --- */}
            <View className="absolute bottom-0 left-0 right-0 p-4 z-20 pb-24">
                <GlassCard className="p-5 bg-white/95 shadow-xl border-t border-white/50">
                    {/* Location Info */}
                    <View className="flex-row items-start mb-4">
                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isValidLocation ? 'bg-green-50' : 'bg-red-50'}`}>
                            <MapPin size={20} color={isValidLocation ? '#10B981' : '#EF4444'} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs text-gray-400 font-semibold uppercase">Vị trí hiện tại</Text>
                            {loadingLocation ? (
                                <Text className="text-gray-500 italic">Đang định vị...</Text>
                            ) : location ? (
                                <View>
                                    {isValidLocation ? (
                                        <View>
                                            <Text className="text-green-600 font-bold">
                                                📍 {currentOffice?.name}
                                            </Text>
                                            <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                                                {currentOffice?.address}
                                            </Text>
                                        </View>
                                    ) : (
                                        <Text className="text-red-500 font-bold">
                                            ⚠️ Ngoài vùng chấm công
                                        </Text>
                                    )}
                                    <Text className="text-[10px] text-gray-400 mt-1">
                                        ({location.latitude.toFixed(6)}, {location.longitude.toFixed(6)})
                                    </Text>
                                </View>
                            ) : (
                                <Text className="text-red-500">Chưa xác định</Text>
                            )}
                        </View>
                        <TouchableOpacity
                            onPress={loadLocation}
                            disabled={loadingLocation}
                            className="p-2 bg-gray-50 rounded-full"
                        >
                            <RefreshCw size={18} color="#6B7280" className={loadingLocation ? "animate-spin" : ""} />
                        </TouchableOpacity>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                        onPress={handleOpenCamera}
                        disabled={isPending || loadingLocation || !location || !isValidLocation}
                        className={`py-4 rounded-xl flex-row items-center justify-center shadow-lg active:scale-[0.98] transition-all
                            ${(isPending || loadingLocation || !location || !isValidLocation)
                                ? 'bg-gray-300'
                                : 'bg-blue-600'
                            }`}
                    >
                        {isPending ? (
                            <RefreshCw size={24} color="white" className="animate-spin mr-2" />
                        ) : (
                            <CameraIcon size={24} color="white" className="mr-2" />
                        )}
                        <Text className="text-white font-bold text-lg">
                            {isPending ? 'Đang xử lý...' : 'CHỤP ẢNH CHẤM CÔNG'}
                        </Text>
                    </TouchableOpacity>
                </GlassCard>
            </View>

            {/* --- CAMERA MODAL --- */}
            <Modal visible={showCamera} animationType="slide" presentationStyle="fullScreen">
                <View className="flex-1 bg-black relative">

                    {/* 1. Camera nằm dưới cùng */}
                    <CameraView
                        ref={cameraRef}
                        style={{ flex: 1 }}
                        facing="front"
                    />

                    {/* 2. Các nút bấm nằm đè lên trên (Sibling, not Children) */}
                    <View className="absolute inset-0 z-10 pointer-events-box-none">

                        {/* Close Button */}
                        <TouchableOpacity
                            onPress={() => setShowCamera(false)}
                            style={{ top: insets.top + 20 }}
                            className="absolute right-5 p-2 bg-black/40 rounded-full"
                        >
                            <X size={28} color="white" />
                        </TouchableOpacity>

                        {/* Capture Button Area */}
                        <View className="absolute bottom-10 left-0 right-0 items-center">
                            <TouchableOpacity
                                onPress={handleCapture}
                                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:bg-white/40"
                            >
                                <View className="w-16 h-16 rounded-full bg-white" />
                            </TouchableOpacity>
                            <Text className="text-white mt-4 font-medium shadow-black shadow-md drop-shadow-md">
                                Chạm để chụp & gửi
                            </Text>
                        </View>
                    </View>

                </View>
            </Modal>
        </View>
    );
}
