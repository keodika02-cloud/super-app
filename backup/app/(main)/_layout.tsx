import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { Home, User, Bell, ScanLine, ClipboardList } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
    primary: '#2563EB', // blue-600
    inactive: '#94A3B8', // slate-400
    bg: '#ffffff',
};

export default function MainLayout() {
    // ✅ Lấy thông số an toàn của màn hình hiện tại
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.inactive,
                tabBarShowLabel: true,

                // --- STYLE THANH BAR ---
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: COLORS.bg,
                    borderTopWidth: 0,

                    // Shadow / Elevation
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 10, // Android shadow

                    // ✅ FIX: Tự động cộng thêm khoảng cách an toàn (insets.bottom)
                    // Chiều cao cơ bản (60) + Khoảng cách thanh ngang (insets.bottom)
                    height: 60 + insets.bottom,

                    // Đẩy nội dung lên trên thanh ngang
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                    paddingTop: 10,
                },

                // --- STYLE LABEL ---
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginTop: 2,
                    paddingBottom: 0, // Reset padding mặc định
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Trang chủ',
                    tabBarIcon: ({ color, focused }) => (
                        <Home size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
                    ),
                }}
            />

            {/* Tạm ẩn các tab chưa có để test Home & Profile trước */}
            <Tabs.Screen
                name="checkin"
                options={{
                    title: 'Chấm công',
                    tabBarIcon: ({ color, focused }) => (
                        <ScanLine size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Cá nhân',
                    tabBarIcon: ({ color, focused }) => (
                        <User size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
                    ),
                }}
            />
        </Tabs>
    );
}