/**
 * app/_layout.tsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Root Layout – Zero-Crash hardened.
 *
 * Hardening v2:
 *   ✓ ErrorBoundary bọc toàn bộ app → không bao giờ white screen
 *   ✓ Bỏ dynamic `require('expo-router')` → dùng hook useRouter đúng cách
 *   ✓ SplashScreen.hideAsync() có try/catch – không crash nếu đã hide rồi
 *   ✓ loadFromStorage() có try/catch bên trong (xem useAuthStore)
 *   ✓ Notification unsubscribe cleanup đúng chuẩn
 * ──────────────────────────────────────────────────────────────────────────────
 */
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';

import { Env } from '../src/config/env';

import { queryClient, setupAppStateListener } from '../src/core/query-client';
import { useAuthStore } from '../src/stores/useAuthStore';
import { NotificationService } from '../src/services/NotificationService';
import { ErrorBoundary } from '../src/components/error/ErrorBoundary';

// Giữ splash screen cho đến khi isHydrated = true
SplashScreen.preventAutoHideAsync().catch(() => {
    // Đã hide rồi hoặc không hỗ trợ – bỏ qua, không crash
});

// ─── Auth Guard ────────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const segments = useSegments();
    const { isLoggedIn, isHydrated, loadFromStorage } = useAuthStore();

    // Hydrate session từ storage khi mount
    useEffect(() => {
        loadFromStorage().catch(() => {
            // Lỗi storage → coi như chưa đăng nhập (safe fallback)
        });

        // [HARDENING]: Setup AppState listener and return cleanup function to fix memory leak
        const subscription = setupAppStateListener();
        return () => {
            subscription.remove();
        };
    }, []);

    // Ẩn splash khi đã hydrate
    useEffect(() => {
        if (!isHydrated) return;
        SplashScreen.hideAsync().catch(() => {
            // Ignore: splash có thể đã hide rồi
        });
    }, [isHydrated]);

    // Điều hướng dựa trên trạng thái auth
    useEffect(() => {
        if (!isHydrated) return;
        const inAuth = segments[0] === '(auth)';
        if (!isLoggedIn && !inAuth) {
            router.replace('/(auth)/login');
        } else if (isLoggedIn && inAuth) {
            // @ts-ignore: Router typed definition mismatch in Expo 50+
            router.replace('/');
        }
    }, [isLoggedIn, isHydrated, segments, router]);

    return <>{children}</>;
}

// ─── Notification Listener (Expo Router hook-safe) ────────────────────────────

function NotificationListener() {
    const router = useRouter();

    useEffect(() => {
        // Dùng hook router thay vì dynamic require – tránh bundler lỗi
        const unsubscribe = NotificationService.setupListeners((screen, params) => {
            try {
                router.push({ pathname: screen as any, params: params as any });
            } catch (e) {
                // Nếu router chưa sẵn sàng hoặc route không tồn tại → không crash
                console.error('[NotificationListener] Push route lỗi:', e);
            }
        });
        return unsubscribe;
    }, [router]);

    return null;
}

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { asyncStoragePersister } from '../src/core/query-client';

// ─── Sentry Initialization ─────────────────────────────────────────────────────
// [HARDENING]: Ensure Sentry is initialized BEFORE the export wrap, even in dev (as no-op if no DSN)
Sentry.init({
    dsn: Env.EXPO_PUBLIC_SENTRY_DSN,
    environment: Env.EXPO_PUBLIC_ENV,
    release: Env.EXPO_PUBLIC_APP_VERSION,
    tracesSampleRate: 0.2,
    enabled: !__DEV__, // Chỉ thực sự active trên production
});

// ─── Root Layout ─────────────────────────────────────────────────────────────

function RootLayout() {
    return (
        // ErrorBoundary ở đây là lớp phòng thủ CUỐI CÙNG cho toàn bộ app
        <ErrorBoundary scope="RootLayout">
            {/* [HARDENING]: Dùng PersistQueryClientProvider để cache layout SDUI offline */}
            <PersistQueryClientProvider
                client={queryClient}
                persistOptions={{ persister: asyncStoragePersister }}
            >
                <AuthGuard>
                    <NotificationListener />
                    <Stack screenOptions={{ headerShown: false }} />
                </AuthGuard>
            </PersistQueryClientProvider>
        </ErrorBoundary>
    );
}

export default Sentry.wrap(RootLayout);
