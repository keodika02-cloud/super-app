/**
 * src/services/HardwareService.ts
 * SINGLE RESPONSIBILITY: Mọi tương tác phần cứng đi qua đây.
 *
 * HardwareGuard Pattern:
 *   - Kiểm tra Device.isDevice (Simulator / Antigravity → trả Mock data)
 *   - Kiểm tra quyền trước khi gọi Native module
 *   - Không bao giờ crash – fallback về mock nếu thiếu quyền
 *   - Log rõ ràng mọi trạng thái
 */
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Env } from '../config/env';

// ─── Hằng số Mock (dùng khi Simulator / Antigravity) ─────────────────────────
const MOCK_LOCATION = {
    latitude: 18.6731,  // Tọa độ TP. Vinh, Nghệ An (văn phòng QVC)
    longitude: 105.6924,
    accuracy: 5,
    is_mock: true,
};

// ─── GPS / Định vị ─────────────────────────────────────────────────────────

export interface SafeLocation {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    is_mock: boolean;
}

async function getLocation(): Promise<SafeLocation> {
    const shouldUseMock = !Device.isDevice;

    if (shouldUseMock) {
        console.warn(`[HardwareService] GPS Mocking: (Simulator Mode)`);
        return MOCK_LOCATION;
    }

    try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
            console.warn('[HardwareService] GPS Permission Denied.');
            throw new Error('Quyền định vị bị từ chối');
        }

        // [HARDENING]: Timeout check 10s để tránh treo UI
        const locationPromise = Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('GPS_TIMEOUT')), 10000)
        );

        const loc = await Promise.race([locationPromise, timeoutPromise]);

        if (!loc) throw new Error('NO_LOCATION_DATA');

        return {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy,
            is_mock: loc.mocked ?? false,
        };
    } catch (err: any) {
        console.error(`[HardwareService] Location Fetch Error: ${err.message}.`);
        throw err;
    }
}

// ─── Sinh trắc học (FaceID / TouchID) ────────────────────────────────────────

export interface BiometricResult {
    available: boolean;
    authenticated: boolean;
    error?: string;
}

async function authenticateBio(promptMessage = 'Xác thực để đăng nhập'): Promise<BiometricResult> {
    if (!Device.isDevice) {
        return { available: false, authenticated: false, error: 'Simulator không hỗ trợ sinh trắc học' };
    }

    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
            return { available: false, authenticated: false, error: 'Thiết bị không hỗ trợ sinh trắc học' };
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage,
            cancelLabel: 'Hủy',
            fallbackLabel: 'Dùng mật khẩu',
            disableDeviceFallback: false,
        });

        return {
            available: true,
            authenticated: result.success,
            error: result.success ? undefined : result.error,
        };
    } catch (err: any) {
        console.error('[HardwareService] authenticateBio lỗi:', err);
        return { available: false, authenticated: false, error: err?.message };
    }
}

async function hasBiometric(): Promise<boolean> {
    if (!Device.isDevice) return false;
    try {
        return (
            (await LocalAuthentication.hasHardwareAsync()) &&
            (await LocalAuthentication.isEnrolledAsync())
        );
    } catch {
        return false;
    }
}

// ─── Device Info ─────────────────────────────────────────────────────────────

function getDeviceInfo() {
    return {
        model: Device.modelName ?? 'Unknown',
        os: `${Platform.OS} ${Platform.Version}`,
        brand: Device.brand ?? 'Unknown',
        device_id: Application.applicationId ?? Constants.sessionId ?? 'unknown_device',
        is_device: Device.isDevice,
    };
}

// ─── UUID (dùng cho idempotency checkin, offline actions) ────────────────────

async function generateUUID(): Promise<string> {
    const rand = await Crypto.getRandomBytesAsync(16);
    const hex = Array.from(rand).map((b) => b.toString(16).padStart(2, '0')).join('');
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        '4' + hex.slice(13, 16),
        ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
        hex.slice(20, 32),
    ].join('-');
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const HardwareService = {
    getLocation,
    authenticateBio,
    hasBiometric,
    getDeviceInfo,
    generateUUID,
    MOCK_LOCATION,
    isSimulator: () => !Device.isDevice,
};
