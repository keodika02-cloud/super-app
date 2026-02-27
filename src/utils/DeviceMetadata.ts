import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function getDeviceInfo() {
    return {
        model: Device.modelName ?? 'Unknown',
        os: `${Platform.OS} ${Platform.Version}`,
        brand: Device.brand ?? 'Unknown',
        device_id: Application.applicationId ?? Constants.sessionId ?? 'unknown_device',
        is_device: Device.isDevice,
    };
}
