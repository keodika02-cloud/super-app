import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface Coordinates {
    latitude: number;
    longitude: number;
    accuracy: number;
    is_mock: boolean;
}

export const LocationService = {
    /**
     * Request Permission
     */
    async requestPermission(): Promise<boolean> {
        if (Platform.OS === 'web') return true;

        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
    },

    /**
     * Get Location with Timeout Guard (5s)
     * ✅ CRITICAL: Race condition để tránh GPS treo app
     */
    async getCurrentLocation(): Promise<Coordinates> {
        // 1. Antigravity Guard
        if (Platform.OS === 'web') {
            return {
                latitude: 10.8231, // Mock Quốc Việt Office
                longitude: 106.6297,
                accuracy: 10,
                is_mock: true,
            };
        }

        try {
            // 2. Race Condition: GPS vs Timeout (5s)
            const locationPromise = Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced, // Balanced nhanh hơn High
            });

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 5000)
            );

            const result = await Promise.race([locationPromise, timeoutPromise]);

            return {
                latitude: result.coords.latitude,
                longitude: result.coords.longitude,
                accuracy: result.coords.accuracy || 0,
                is_mock: result.mocked || false,
            };
        } catch (error: any) {
            if (error.message === 'TIMEOUT') {
                console.warn('⚠️ GPS timeout, trying last known location');
                // Fallback: Lấy vị trí cuối cùng được lưu đệm
                const lastKnown = await Location.getLastKnownPositionAsync();

                if (lastKnown) {
                    return {
                        latitude: lastKnown.coords.latitude,
                        longitude: lastKnown.coords.longitude,
                        accuracy: lastKnown.coords.accuracy || 100,
                        is_mock: false,
                    };
                }

                throw new Error('GPS yếu. Vui lòng di chuyển ra chỗ thoáng.');
            }

            throw error;
        }
    },
};
