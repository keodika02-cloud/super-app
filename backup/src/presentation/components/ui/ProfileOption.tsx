import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface ProfileOptionProps {
    icon: React.ElementType;
    label: string;
    value?: string;
    isDestructive?: boolean;
    onPress?: () => void;
    hasSwitch?: boolean;
}

export const ProfileOption = ({ icon: Icon, label, value, isDestructive, onPress, hasSwitch }: ProfileOptionProps) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-row items-center justify-between p-4 border-b border-gray-100 last:border-0"
        disabled={hasSwitch}
    >
        <View className="flex-row items-center gap-4">
            <View className={`p-2 rounded-full ${isDestructive ? 'bg-red-50' : 'bg-blue-50'}`}>
                <Icon size={20} color={isDestructive ? '#EF4444' : '#3B82F6'} />
            </View>
            <Text className={`text-base font-medium ${isDestructive ? 'text-red-500' : 'text-gray-700'}`}>
                {label}
            </Text>
        </View>

        <View className="flex-row items-center gap-2">
            {value && <Text className="text-gray-400 text-sm">{value}</Text>}
            {hasSwitch ? (
                <Switch value={true} trackColor={{ true: '#2563EB' }} />
            ) : (
                !isDestructive && <ChevronRight size={18} color="#9CA3AF" />
            )}
        </View>
    </TouchableOpacity>
);
