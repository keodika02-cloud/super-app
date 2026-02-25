import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';

// ✅ ANTIGRAVITY GUARD: Lazy load Google Signin to prevent crash on Expo Go
let GoogleSignin: any;
try {
    if (Platform.OS !== 'web') {
        GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
    }
} catch (e) {
    console.warn('⚠️ Google Signin module not found (likely running on Expo Go or Web without native build)');
}

/**
 * Social Login Service
 * ✅ ANTIGRAVITY GUARD: Tất cả methods đều check Platform.OS và Expo Client
 */
export const SocialLoginService = {
    /**
     * Initialize Google Sign-In
     * ⚠️ CRITICAL: Chỉ gọi trên Mobile & Native Build
     */
    async initializeGoogle() {
        if (Platform.OS === 'web' || Constants.appOwnership === 'expo') {
            console.warn('⚠️ Antigravity/Expo Go: Skipping Google Sign-In initialization');
            return;
        }

        if (GoogleSignin) {
            try {
                GoogleSignin.configure({
                    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
                    offlineAccess: true,
                });
            } catch (e) {
                console.warn('⚠️ Google Signin Config Failed:', e);
            }
        }
    },

    /**
     * Sign in with Google
     */
    async signInWithGoogle(): Promise<string> {
        // Guard: Web or Expo Go
        if (Platform.OS === 'web' || Constants.appOwnership === 'expo') {
            console.warn('⚠️ Antigravity: Mocking Google Sign-In Token');
            return 'mock_google_id_token_antigravity';
        }

        if (!GoogleSignin) {
            throw new Error('Google Sign-In module chưa được cài đặt hoặc không khả dụng.');
        }

        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            return userInfo.data?.idToken || userInfo.idToken || '';
        } catch (error) {
            console.error('Google Sign-In failed:', error);
            throw new Error('Đăng nhập Google thất bại');
        }
    },

    /**
     * Sign in with Apple
     * ⚠️ CRITICAL: Chỉ khả dụng trên iOS
     */
    async signInWithApple(): Promise<string> {
        if (Platform.OS === 'web' || Constants.appOwnership === 'expo') {
            console.warn('⚠️ Antigravity: Mocking Apple Sign-In Token');
            return 'mock_apple_id_token_antigravity';
        }

        if (Platform.OS !== 'ios') {
            throw new Error('Apple Sign-In chỉ khả dụng trên iOS');
        }

        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            return credential.identityToken!;
        } catch (error: any) {
            if (error.code === 'ERR_CANCELED') {
                throw new Error('Người dùng hủy đăng nhập');
            }
            console.error('Apple Sign-In failed:', error);
            throw new Error('Đăng nhập Apple thất bại');
        }
    },

    /**
     * Check if Apple Sign-In is available
     */
    async isAppleSignInAvailable(): Promise<boolean> {
        if (Platform.OS !== 'ios') return false;

        try {
            return await AppleAuthentication.isAvailableAsync();
        } catch {
            return false;
        }
    },
};
