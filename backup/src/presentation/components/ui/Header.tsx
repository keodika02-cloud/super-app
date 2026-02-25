import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const Header = ({ title, leftAction, rightAction }: any) => {
    return (
        <View className="bg-white/80 border-b border-gray-100 z-50">
            <SafeAreaView edges={['top']} className="px-4 py-3 flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                    {leftAction}
                    <Text className="text-xl font-bold text-gray-900">{title}</Text>
                </View>
                {rightAction}
            </SafeAreaView>
        </View>
    );
};
