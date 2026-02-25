import '../global.css'; // NativeWind
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

// ✅ CRITICAL: Tạo Query Client BÊN NGOÀI component để tránh re-create
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 3,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});

// Sẽ uncomment sau khi implement HRM Skill
// useAutoSync(); 



export default function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <StatusBar style="dark" />

                {/* Background Processes */}
                {/* <AppProcess /> */}

                {/* Navigation Stack */}
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(main)" />
                </Stack>
            </AuthProvider>
        </QueryClientProvider>
    );
}
