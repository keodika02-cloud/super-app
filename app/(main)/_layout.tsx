import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useNavigation, AppTab } from '../../src/hooks/useNavigation';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
    return (
        <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
    );
}

export default function MainLayout() {
    const { tabs } = useNavigation();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopColor: '#e2e8f0',
                    borderTopWidth: 1,
                    height: 70,
                    paddingBottom: 10,
                },
                tabBarActiveTintColor: '#3b82f6',
                tabBarInactiveTintColor: '#64748b',
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            }}
        >
            {tabs.map((tab: AppTab) => (
                <Tabs.Screen
                    key={tab.name}
                    name={tab.name}
                    options={{
                        title: tab.label,
                        href: tab.is_hidden ? null : undefined,
                        tabBarIcon: ({ focused }) => <TabIcon emoji={tab.icon} focused={focused} />
                    }}
                />
            ))}

            {/* Ẩn các màn hình hệ thống cố định */}
            <Tabs.Screen name="checkin" options={{ href: null }} />
            <Tabs.Screen name="reports" options={{ href: null }} />
            <Tabs.Screen name="notifications" options={{ href: null }} />
            <Tabs.Screen name="tasks" options={{ href: null }} />
            {/* Màn hình động SDUI (Cho phép mở tính năng mới mà không cần Update App) */}
            <Tabs.Screen name="screen/[slug]" options={{ href: null }} />
        </Tabs>
    );
}
