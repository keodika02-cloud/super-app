import { Platform } from 'react-native';

export interface CapturedPhoto {
    base64?: string;
    uri: string;
}

export const CameraService = {
    /**
     * Request Permission
     * @deprecated Use `useCameraPermissions` hook from 'expo-camera' in your component instead.
     */
    async requestPermission(): Promise<boolean> {
        if (Platform.OS === 'web') return true;

        console.warn('CameraService.requestPermission is deprecated. Please use useCameraPermissions() hook in your component.');
        return false;
    },
};
