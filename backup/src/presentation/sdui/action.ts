import { Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { Action } from './types';

export const handleAction = async (action?: Action) => {
    if (!action) return;

    // 1. Confirm Guard
    if (action.confirm_msg) {
        const confirmed = await new Promise<boolean>((resolve) =>
            Alert.alert('Xác nhận', action.confirm_msg!, [
                { text: 'Hủy', onPress: () => resolve(false), style: 'cancel' },
                { text: 'OK', onPress: () => resolve(true) }
            ])
        );
        if (!confirmed) return;
    }

    // 2. Execute
    console.log(`⚡ Executing Action: ${action.type}`, action.payload);

    switch (action.type) {
        case 'navigate':
        case 'Maps_SCREEN': // Support for Maps_SCREEN as used in mock data
        case 'NAVIGATE_SCREEN':
            if (action.path) router.push(action.path as any);
            else if (action.payload && typeof action.payload === 'string') router.push(action.payload as any);
            break;

        case 'link':
        case 'OPEN_DEEP_LINK':
            if (action.payload) Linking.openURL(action.payload);
            else if (action.path) Linking.openURL(action.path);
            break;

        case 'SHOW_ALERT':
            Alert.alert(action.payload?.title || 'Thông báo', action.payload?.message || '');
            break;

        case 'api':
        case 'CALL_API':
            // TODO: Call API client here
            Alert.alert('API Call', `Calling ${action.path || action.payload?.endpoint}...`);
            break;

        default:
            console.warn('Unknown Action:', action.type);
    }
};
