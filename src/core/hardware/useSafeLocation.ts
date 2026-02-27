import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface SafeLocationResult {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    is_mock: boolean;
}

// Mock GPS – văn phòng Quốc Việt
const MOCK_LOCATION: SafeLocationResult = {
    latitude: 21.0285,
    longitude: 105.8542,
    accuracy: 10,
    is_mock: true,
};

/**
 * Lấy vị trí GPS một cách an toàn.
 * - Simulator/Antigravity/Web: Trả về tọa độ mock hợp lệ
 * - Máy thật: Xin quyền → lấy tọa độ → detect fake GPS
 * 
 * KHÔNG gọi trực tiếp expo-location trong component, phải dùng hook này.
 */
export async function getSafeLocation(): Promise<SafeLocationResult> {
    // Web hoặc Simulator
    if (Platform.OS === 'web' || !Device.isDevice) {
        return MOCK_LOCATION;
    }

    // Xin quyền
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('PERMISSION_DENIED');
    }

    // Lấy tọa độ thật
    const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
    });

    return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        // Detect fake GPS app (mocked = true trên Android với fake GPS)
        is_mock: (location as any).mocked === true,
    };
}
