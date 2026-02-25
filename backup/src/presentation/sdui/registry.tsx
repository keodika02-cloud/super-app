import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import {
    FileText, Smartphone, Shield, Settings, User, MapPin,
    Bell, Home, ClipboardList, ChevronRight, AlertTriangle
} from 'lucide-react-native';
import { Action } from './types';
import { handleAction } from './action'; // Import từ file action.ts mới tạo
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Header } from '@/presentation/components/ui/Header';

// --- HOC ---
const withAction = (Component: React.ComponentType<any>) => {
    return ({ action, children, ...props }: any) => {
        const onPress = () => handleAction(action);
        if (action) {
            return (
                <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                    <Component {...props}>{children}</Component>
                </TouchableOpacity>
            );
        }
        return <Component {...props}>{children}</Component>;
    };
};

// --- PRIMITIVES ---
const Container = ({ children, className, style }: any) => <View className={className} style={style}>{children}</View>;
const SDUIText = ({ text, className, style }: any) => <Text className={className} style={style}>{text}</Text>;
const Spacer = ({ height = 10 }: any) => <View style={{ height }} />;

// --- ICON MAP ---
const IconMap: Record<string, any> = {
    FileText, Smartphone, Shield, Settings, User, MapPin,
    Bell, Home, ClipboardList, ChevronRight, AlertTriangle
};

// --- BUSINESS WIDGETS (REAL IMPLEMENTATION) ---

// 1. Header Widget (Fix lỗi Unknown Block: HEADER)
const HeaderWidget = (props: any) => {
    return <Header title={props.title || 'Trang chủ'} />;
};

// 2. Header Banner (Glass Card style)
const HeaderBannerWidget = (props: any) => (
    <GlassCard className="p-4 mx-4 mb-4 bg-blue-50/50 border-blue-100">
        <View className="flex-row justify-between items-center mb-4">
            <Text className="font-semibold text-gray-700">Hiệu suất tháng 1</Text>
            <Text className="text-blue-600 text-sm font-bold bg-blue-100 px-2 py-1 rounded-lg">98%</Text>
        </View>
        <View className="flex-row justify-between gap-4">
            {/* Hardcode stats UI for demo */}
            <View className="flex-1 bg-white p-3 rounded-xl items-center"><Text className="text-2xl font-bold text-gray-800">18</Text><Text className="text-xs text-gray-500">Công</Text></View>
            <View className="flex-1 bg-white p-3 rounded-xl items-center"><Text className="text-2xl font-bold text-orange-500">1</Text><Text className="text-xs text-gray-500">Muộn</Text></View>
            <View className="flex-1 bg-white p-3 rounded-xl items-center"><Text className="text-2xl font-bold text-green-600">5</Text><Text className="text-xs text-gray-500">Xong</Text></View>
        </View>
    </GlassCard>
);

// 3. Grid Menu (Dynamic Icons)
const GridMenuWidget = (props: any) => (
    <View className="px-4">
        <Text className="font-semibold text-gray-700 mb-3 ml-1">Tiện ích nhanh</Text>
        <View className="flex-row flex-wrap justify-between">
            {(props.data?.items || []).map((item: any, index: number) => {
                const IconComponent = IconMap[item.icon] || FileText;
                // Bọc từng item trong Touchable thông qua withAction logic (nếu item có action riêng)
                // Ở đây ta giả lập Action Wrapper thủ công cho từng item con
                return (
                    <TouchableOpacity
                        key={index}
                        className="w-[48%] mb-3"
                        onPress={() => handleAction(item.action)}
                    >
                        <GlassCard className="p-4 flex-col items-center justify-center gap-2 h-32 bg-white">
                            <View className={`p-3 rounded-full ${item.colorClass || 'bg-gray-100'}`}>
                                <IconComponent size={24} color="#4B5563" />
                            </View>
                            <Text className="font-medium text-gray-700">{item.label}</Text>
                        </GlassCard>
                    </TouchableOpacity>
                );
            })}
        </View>
    </View>
);

// --- REGISTRY MAP ---
const ComponentMap: Record<string, React.ComponentType<any>> = {
    container: withAction(Container),
    text: withAction(SDUIText),
    spacer: Spacer,

    // Business Mapping
    HEADER: HeaderWidget, // ✅ Đã map HEADER
    HEADER_BANNER: withAction(HeaderBannerWidget),
    GRID_MENU: withAction(GridMenuWidget),
};

export const getComponent = (type: string) => ComponentMap[type];
