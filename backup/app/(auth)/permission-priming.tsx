import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { ScreenWrapper } from '@/presentation/components/layout/ScreenWrapper';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { MapPin, Camera } from 'lucide-react-native';

/**
 * Permission Priming Screen
 * 
 * ✅ WHY: Tăng tỷ lệ cấp quyền từ 20% lên 90%
 * ✅ HOW: Giải thích ngữ cảnh TRƯỚC KHI hệ thống hỏi
 */
export default function PermissionPrimingScreen() {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [loading, setLoading] = useState(false);

    async function handleContinue() {
        setLoading(true);

        try {
            // 1. Request Camera Permission
            if (!cameraPermission?.granted) {
                const { granted } = await requestCameraPermission();
                if (!granted) {
                    Alert.alert(
                        'Cần quyền Camera',
                        'Để chấm công bằng khuôn mặt, vui lòng cấp quyền Camera trong Cài đặt.'
                    );
                }
            }

            // 2. Request Location Permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Cần quyền Vị trí',
                    'Để xác minh bạn đang ở văn phòng, vui lòng cấp quyền Vị trí trong Cài đặt.'
                );
            }

            // 3. Dù user đồng ý hay từ chối, vẫn cho vào Home
            // (Sẽ xử lý chặn tính năng sau nếu cần)
            router.replace('/(main)/home');
        } catch (error) {
            console.error('Permission request failed:', error);
            router.replace('/(main)/home'); // Fallback
        } finally {
            setLoading(false);
        }
    }

    function handleSkip() {
        router.replace('/(main)/home');
    }

    return (
        <ScreenWrapper centered bgColor="bg-white">
            <Card className="w-full max-w-md">
                <View className="items-center mb-6">
                    <Text className="text-2xl font-bold text-center mb-2">
                        Cần cấp quyền truy cập
                    </Text>
                    <Text className="text-slate-500 text-center">
                        Để sử dụng đầy đủ tính năng, ứng dụng cần một số quyền sau:
                    </Text>
                </View>

                {/* Permission List */}
                <View className="mb-6 space-y-4">
                    <View className="flex-row items-start mb-4">
                        <Camera size={24} color="#2563EB" className="mr-3 mt-1" />
                        <View className="flex-1">
                            <Text className="font-semibold text-slate-800 mb-1">
                                Camera
                            </Text>
                            <Text className="text-sm text-slate-500">
                                Chụp ảnh khuôn mặt khi chấm công và tạo báo cáo
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-start">
                        <MapPin size={24} color="#2563EB" className="mr-3 mt-1" />
                        <View className="flex-1">
                            <Text className="font-semibold text-slate-800 mb-1">
                                Vị trí
                            </Text>
                            <Text className="text-sm text-slate-500">
                                Xác minh bạn đang ở văn phòng khi chấm công
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <Button
                    title={loading ? 'Đang xử lý...' : 'Cho phép & Tiếp tục'}
                    onPress={handleContinue}
                    loading={loading}
                    disabled={loading}
                    fullWidth
                    size="lg"
                />

                <Button
                    title="Để sau"
                    variant="ghost"
                    onPress={handleSkip}
                    fullWidth
                    className="mt-3"
                />
            </Card>
        </ScreenWrapper>
    );
}
