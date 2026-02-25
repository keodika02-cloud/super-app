/**
 * app/(main)/_layout.tsx
 * Bottom Tab Navigator – 6 tabs chính theo chuẩn thiết kế mới.
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
    return (
        <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
    );
}

export default function MainLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#ffffff', // Theme sáng
                    borderTopColor: '#e2e8f0',
                    borderTopWidth: 1,
                    height: 70,
                    paddingBottom: 10,
                },
                tabBarActiveTintColor: '#3b82f6', // Màu xanh chủ đạo
                tabBarInactiveTintColor: '#64748b', // Xám nhạt
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'Bảng tin', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }} />
            <Tabs.Screen name="reports" options={{ title: 'Báo cáo', tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} /> }} />
            <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} /> }} />
            <Tabs.Screen name="more" options={{ title: 'Thêm', tabBarIcon: ({ focused }) => <TabIcon emoji="⊞" focused={focused} /> }} />

            {/* Ẩn các màn hình hệ thống khỏi thanh tab dưới cùng bằng cách đẩy ra khỏi cấu trúc Tabs hoặc dùng href: null */}
            <Tabs.Screen name="profile" options={{ href: null }} />
            <Tabs.Screen name="notifications" options={{ href: null }} />
            <Tabs.Screen name="tasks" options={{ href: null }} />
        </Tabs>
    );
}
