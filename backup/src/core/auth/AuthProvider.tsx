import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import { router, useSegments } from 'expo-router';
import { SecureStorage, STORAGE_KEYS } from '@/core/storage';
import { AuthApi, User, LoginPayload, SocialLoginPayload } from '@/data/api/auth.api';
import { BiometricService } from './biometric';
import { SocialLoginService } from './social-login';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isBiometricSupported: boolean;
    login: (payload: LoginPayload) => Promise<void>;
    loginSocial: (payload: SocialLoginPayload) => Promise<void>;
    loginWithBiometric: () => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const segments = useSegments();

    // 1. Initialize
    useEffect(() => {
        loadUser();
        checkBiometricSupport();
        initializeSocialLogin();

        // 👂 Listen to 401 event from client.ts (Kill Switch)
        const subscription = DeviceEventEmitter.addListener('auth:session-expired', () => {
            console.log('🔄 Session expired event received. Logging out...');
            performLogoutCleanup();
        });

        return () => {
            subscription.remove();
        };
    }, []);

    // 2. Check Biometric Support
    async function checkBiometricSupport() {
        const supported = await BiometricService.isSupported();
        setIsBiometricSupported(supported);
    }

    // 3. Initialize Social Login
    async function initializeSocialLogin() {
        if (Platform.OS !== 'web') {
            await SocialLoginService.initializeGoogle();
        }
    }

    // 4. Cleanup function (Shared by Logout & Auto-Logout)
    const performLogoutCleanup = async () => {
        await SecureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        await SecureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        await SecureStorage.removeItem(STORAGE_KEYS.USER_ID);
        setUser(null);
        router.replace('/(auth)/login');
    };

    async function loadUser() {
        try {
            const token = await SecureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

            if (!token) {
                setLoading(false);
                return;
            }

            const userData = await AuthApi.getProfile();
            setUser(userData);
        } catch (error) {
            console.error('❌ Failed to load user:', error);
            await performLogoutCleanup();
        } finally {
            setLoading(false);
        }
    }

    /**
     * Standard Login
     * ✅ CRITICAL: Redirect to Permission Priming, NOT Home
     */
    async function login(payload: LoginPayload) {
        try {
            const { access_token, user: userData } = await AuthApi.login(payload);

            // Save token & user ID
            await SecureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
            await SecureStorage.setItem(STORAGE_KEYS.USER_ID, String(userData.id));

            // Save email for biometric fallback/hint
            await SecureStorage.setItem('saved_email', payload.email);
            // WARNING: Saving password is risky, usually we use token. 
            // Here following skill, but ideally we use Keychain/SecureStore for credentials if needed for biometrics.
            // Since SecureStorage uses SecureStore on mobile, it's relatively safe.
            await SecureStorage.setItem('saved_password', payload.password);

            setUser(userData);

            // 🛑 STOP! Đừng vào Home vội
            // Điều hướng sang trang xin quyền trước
            router.replace('/(auth)/permission-priming');
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    /**
     * Social Login (Google/Apple)
     */
    async function loginSocial(payload: SocialLoginPayload) {
        try {
            const { access_token, user: userData } = await AuthApi.loginSocial(payload);

            await SecureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
            await SecureStorage.setItem(STORAGE_KEYS.USER_ID, String(userData.id));
            setUser(userData);

            router.replace('/(auth)/permission-priming');
        } catch (error) {
            console.error('Social login failed:', error);
            throw error;
        }
    }

    /**
     * Login with Biometric
     * ✅ CRITICAL: Chỉ dùng khi đã có saved credentials
     */
    async function loginWithBiometric() {
        try {
            const authenticated = await BiometricService.authenticate();

            if (!authenticated) {
                throw new Error('Xác thực sinh trắc học thất bại');
            }

            // Get saved credentials
            const savedEmail = await SecureStorage.getItem<string>('saved_email');
            const savedPassword = await SecureStorage.getItem<string>('saved_password');

            if (!savedEmail || !savedPassword) {
                throw new Error('Không tìm thấy thông tin đăng nhập đã lưu');
            }

            await login({ email: savedEmail, password: savedPassword });
        } catch (error) {
            console.error('Biometric login failed:', error);
            throw error;
        }
    }

    async function logout() {
        try {
            await AuthApi.logout();
        } catch (error) {
            console.warn('Logout API failed, forcing local cleanup', error);
        } finally {
            await performLogoutCleanup();
        }
    }

    async function deleteAccount() {
        try {
            await AuthApi.deleteAccount();
            await performLogoutCleanup();
        } catch (error) {
            console.error('Delete account failed:', error);
            throw error;
        }
    }

    async function refreshUser() {
        try {
            const userData = await AuthApi.getProfile();
            setUser(userData);
        } catch (error) {
            console.error('Refresh user failed:', error);
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isBiometricSupported,
                login,
                loginSocial,
                loginWithBiometric,
                logout,
                deleteAccount,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth phải được sử dụng trong AuthProvider');
    }
    return context;
}
