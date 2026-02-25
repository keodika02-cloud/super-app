import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';

interface ItemProps {
    icon?: string;
    label: string;
    value?: string;
    isDestructive?: boolean;
    hasChevron?: boolean;
    onPress?: () => void;
}

export const VerticalListWidget = ({ icon, label, value, isDestructive, hasChevron = true, onPress }: ItemProps) => {
    // Dynamic Icon Loading
    const IconComponent = icon ? (LucideIcons as any)[icon] : null;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className={`flex-row items-center justify-between p-4 bg-white border-b border-gray-100 last:border-0 ${isDestructive ? 'opacity-90' : ''}`}
        >
            <View className="flex-row items-center gap-3">
                {IconComponent && (
                    <IconComponent
                        size={20}
                        color={isDestructive ? '#ef4444' : '#6b7280'}
                    />
                )}
                <Text className={`font-medium text-[16px] ${isDestructive ? 'text-red-500' : 'text-gray-900'}`}>
                    {label}
                </Text>
            </View>

            <View className="flex-row items-center gap-2">
                {value && <Text className="text-gray-400 text-sm">{value}</Text>}
                {hasChevron && <ChevronRight size={18} color="#d1d5db" />}
            </View>
        </TouchableOpacity>
    );
};
