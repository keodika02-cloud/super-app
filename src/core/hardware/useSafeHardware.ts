import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';

// Tọa độ mock – văn phòng Quốc Việt (Hà Nội)
const MOCK_LOCATION = {
    latitude: 21.0285,
    longitude: 105.8542,
    accuracy: 10,
    is_mock: true,
};

// Ảnh đen Base64 nhỏ (1x1 pixel) – Server sẽ chấp nhận để xử lý luồng
const MOCK_PHOTO_BASE64 =
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB/9k=';

export interface SafeHardwareResult {
    /** Có phải thiết bị thật không */
    isRealDevice: boolean;
    /** Có hỗ trợ sinh trắc học không */
    hasBiometrics: boolean;
    /** Lấy ảnh an toàn – Mock nếu là Simulator */
    capturePhoto: () => Promise<{ base64: string; uri: string }>;
}

/**
 * Hook Hardware Guard.
 * Nếu chạy trên Antigravity/Simulator → trả Mock Data hợp lệ.
 * Nếu chạy trên máy thật → gọi Native Module.
 *
 * QUAN TRỌNG: Đây là wrapper duy nhất được phép gọi expo-camera.
 * Tuyệt đối KHÔNG import expo-camera trực tiếp trong component.
 */
export async function getSafeHardwareInfo(): Promise<SafeHardwareResult> {
    const isRealDevice = !!Device.isDevice && Platform.OS !== 'web';

    let hasBiometrics = false;
    if (isRealDevice) {
        try {
            hasBiometrics = await LocalAuthentication.hasHardwareAsync();
        } catch {
            hasBiometrics = false;
        }
    }

    const capturePhoto = async (): Promise<{ base64: string; uri: string }> => {
        if (!isRealDevice) {
            // Antigravity / Simulator
            return { base64: MOCK_PHOTO_BASE64, uri: '' };
        }
        // Máy thật: import động để không crash trên Simulator
        const { launchCameraAsync, MediaTypeOptions } = await import('expo-image-picker');
        const result = await launchCameraAsync({
            mediaTypes: MediaTypeOptions.Images,
            base64: true,
            quality: 0.7,
        });
        if (result.canceled || !result.assets[0]) {
            throw new Error('Người dùng đã hủy chụp ảnh');
        }
        return {
            base64: result.assets[0].base64 ?? '',
            uri: result.assets[0].uri,
        };
    };

    return { isRealDevice, hasBiometrics, capturePhoto };
}
