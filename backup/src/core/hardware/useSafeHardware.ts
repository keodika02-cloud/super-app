import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Hook để kiểm tra xem có an toàn để gọi Native Module không
 * Giúp tránh crash trên Antigravity / Simulator
 * 
 * ✅ CRITICAL: Luôn check trước khi gọi GPS/Camera
 */
export const useSafeHardware = () => {
    const isRealDevice = Device.isDevice && Platform.OS !== 'web';

    return {
        isRealDevice,

        // Mock Data khi chạy trên máy ảo
        mockGPS: {
            latitude: 10.8231, // Tọa độ Quốc Việt
            longitude: 106.6297,
            accuracy: 5,
        },

        // Mock Image (1x1 black pixel)
        mockImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    };
};
