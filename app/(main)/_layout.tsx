import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Briefcase, MessageCircle, Menu, User } from 'lucide-react-native';
import { useNavigation, AppTab } from '@hooks/useNavigation';

export default function MainLayout() {
    const { tabs } = useNavigation();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopColor: '#f0f2f5',
                    borderTopWidth: 1,
                    height: 85,
                    paddingTop: 8,
                    paddingBottom: 25,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.05,
                },
                tabBarActiveTintColor: '#E4623B',
                tabBarInactiveTintColor: '#65676B',
                tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 4 },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Trang chủ',
                    tabBarIcon: ({ color, focused }) => (
                        <Home size={24} color={color} fill={focused ? color : 'transparent'} />
                    )
                }}
            />
            <Tabs.Screen
                name="crm"
                options={{
                    title: 'CRM',
                    tabBarIcon: ({ color }) => <Briefcase size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: 'Hội thoại',
                    tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: 'Khám phá',
                    tabBarIcon: ({ color }) => <Menu size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Cá nhân',
                    tabBarIcon: ({ color }) => <User size={24} color={color} />
                }}
            />

            {/* Ẩn các màn hình hệ thống cố định */}
            <Tabs.Screen name="checkin" options={{ href: null }} />
            <Tabs.Screen name="reports" options={{ href: null }} />
            <Tabs.Screen name="notifications" options={{ href: null }} />
            <Tabs.Screen name="tasks" options={{ href: null }} />
            {/* Màn hình động SDUI */}
            <Tabs.Screen name="screen/[slug]" options={{ href: null }} />
        </Tabs>
    );
}
