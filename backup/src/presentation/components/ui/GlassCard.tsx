import React from 'react';
import { View, Platform } from 'react-native';
import { BlurView } from 'expo-blur'; // Cần cài expo-blur

export const GlassCard = ({ children, className, style }: any) => {
    // Android chưa support BlurView tốt, dùng Fallback opacity
    if (Platform.OS === 'android') {
        return (
            <View
                className={`bg-white/90 border border-white/60 rounded-2xl shadow-sm ${className}`}
                style={style}
            >
                {children}
            </View>
        );
    }
    return (
        <BlurView
            intensity={20}
            tint="light"
            className={`overflow-hidden rounded-2xl border border-white/60 shadow-sm ${className}`}
            style={style}
        >
            <View className="bg-white/60 p-0 m-0 w-full h-full">
                {children}
            </View>
        </BlurView>
    );
};
