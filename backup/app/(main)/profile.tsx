import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useAuth } from '@/core/auth/AuthProvider';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import {
    User, Settings, Shield, LogOut, ChevronRight,
    Bell, CircleHelp, FileText, Lock
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileOption } from '@/presentation/components/ui/ProfileOption';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const insets = useSafeAreaInsets();

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Đăng xuất', style: 'destructive', onPress: logout }
            ]
        );
    };

    return (
        <ScrollView
            className="flex-1 bg-gray-50"
            contentContainerStyle={{
                paddingTop: insets.top + 20,
                paddingBottom: 120, // Né TabBar
                paddingHorizontal: 16
            }}
        >
            {/* 1. HEADER & USER INFO */}
            <View className="mb-6 items-center">
                <View className="relative">
                    <Image
                        source={{ uri: user?.avatar || 'https://ui-avatars.com/api/?name=' + (user?.name || 'User') }}
                        className="w-24 h-24 rounded-full border-4 border-white shadow-sm"
                    />
                    <View className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-2 border-white" />
                </View>
                <Text className="text-xl font-bold text-gray-900 mt-3">{user?.name || 'Nhân viên Quốc Việt'}</Text>
                <Text className="text-blue-600 font-medium">{user?.email || 'N/A'}</Text>
            </View>

            {/* 2. STATS CARD (Giống UX_UI.js) */}
            <GlassCard className="flex-row justify-between p-4 mb-6 bg-white">
                <View className="items-center flex-1 border-r border-gray-100">
                    <Text className="text-lg font-bold text-gray-800">24</Text>
                    <Text className="text-xs text-gray-400">Công tháng</Text>
                </View>
                <View className="items-center flex-1 border-r border-gray-100">
                    <Text className="text-lg font-bold text-blue-600">Top 5</Text>
                    <Text className="text-xs text-gray-400">Xếp hạng</Text>
                </View>
                <View className="items-center flex-1">
                    <Text className="text-lg font-bold text-orange-500">12</Text>
                    <Text className="text-xs text-gray-400">Task tồn</Text>
                </View>
            </GlassCard>

            {/* 3. MENU GROUPS */}
            <Text className="text-gray-500 font-semibold mb-2 ml-1 text-xs uppercase">Tài khoản</Text>
            <View className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6">
                <ProfileOption icon={User} label="Thông tin cá nhân" />
                <ProfileOption icon={FileText} label="Hợp đồng lao động" />
                <ProfileOption icon={Shield} label="Đổi mật khẩu" />
            </View>

            <Text className="text-gray-500 font-semibold mb-2 ml-1 text-xs uppercase">Cài đặt</Text>
            <View className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6">
                <ProfileOption icon={Bell} label="Thông báo" hasSwitch />
                <ProfileOption icon={Lock} label="FaceID / Vân tay" hasSwitch />
                <ProfileOption icon={CircleHelp} label="Trợ giúp & Support" />
            </View>

            {/* 4. LOGOUT */}
            <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <ProfileOption
                    icon={LogOut}
                    label="Đăng xuất hệ thống"
                    isDestructive
                    onPress={handleLogout}
                />
            </View>

            <Text className="text-center text-gray-400 text-xs mt-6 mb-4">
                Quoc Viet Super App v1.0.0 (Build 2026)
            </Text>
        </ScrollView>
    );
}
