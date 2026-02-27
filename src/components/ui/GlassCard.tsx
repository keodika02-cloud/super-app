/**
 * src/components/ui/GlassCard.tsx
 * Glassmorphism card tái dùng toàn app.
 * Hỗ trợ dark mode tự động.
 */
import React from 'react';
import { View, Platform, type ViewStyle, type StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    tight?: boolean;   // padding nhỏ hơn
}

export function GlassCard({ children, style, tight = false }: GlassCardProps) {
    if (Platform.OS === 'android') {
        // [HARDENING]: Fallback cho Android vì BlurView tốn nhiều resource
        return (
            <View
                style={[
                    {
                        backgroundColor: 'rgba(255,255,255,0.12)',
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.25)',
                        padding: tight ? 12 : 20,
                        // Elevation Android
                        elevation: 6,
                    },
                    style,
                ]}
            >
                {children}
            </View>
        );
    }

    // [HARDENING]: Dùng expo-blur chính chủ cho iOS (từ backup)
    return (
        <BlurView
            intensity={20}
            tint="light"
            style={[
                {
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.25)',
                    padding: tight ? 12 : 20,
                    overflow: 'hidden',
                    // Shadow iOS
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                },
                style,
            ]}
        >
            {children}
        </BlurView>
    );
}
