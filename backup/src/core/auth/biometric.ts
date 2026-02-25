import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export const BiometricService = {
    /**
     * Check if biometric is supported
     */
    async isSupported(): Promise<boolean> {
        if (Platform.OS === 'web') return false;

        try {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            return compatible && enrolled;
        } catch {
            return false;
        }
    },

    /**
     * Authenticate with biometric
     */
    async authenticate(): Promise<boolean> {
        if (Platform.OS === 'web') {
            console.warn('⚠️ Antigravity: Skipping biometric auth');
            return true; // Auto-pass trên Antigravity
        }

        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Xác thực để đăng nhập',
                fallbackLabel: 'Dùng mật khẩu',
                cancelLabel: 'Hủy',
            });

            return result.success;
        } catch (error) {
            console.error('Biometric auth failed:', error);
            return false;
        }
    },

    /**
     * Get biometric type (FaceID/TouchID/Fingerprint)
     */
    async getBiometricType(): Promise<string> {
        if (Platform.OS === 'web') return 'None';

        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            return 'FaceID';
        }
        if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            return Platform.OS === 'ios' ? 'TouchID' : 'Fingerprint';
        }
        return 'None';
    },
};
