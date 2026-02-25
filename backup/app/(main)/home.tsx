import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SDUIEngine } from '@/presentation/sdui/SDUIEngine';
import apiClient from '@/core/api/client';
import { ScreenWrapper } from '@/presentation/components/layout/ScreenWrapper';

export default function HomeScreen() {
    // [MOCK MODE] Use local mock data for UI testing per user request
    const { data, isLoading, error } = useQuery({
        queryKey: ['sdui', 'home'],
        queryFn: async () => {
            // Simulate network delay
            await new Promise(r => setTimeout(r, 500));
            const { MOCK_HOME_SDUI } = await import('@/presentation/sdui/mock');
            return MOCK_HOME_SDUI;
        },
    });

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (error) {
        // Fallback UI (có thể load từ file JSON local)
        return (
            <View className="flex-1 justify-center items-center p-4">
                <Text className="text-red-500">Lỗi tải giao diện</Text>
                {/* <Text className="text-gray-400 text-xs mt-2">{JSON.stringify(error)}</Text> */}
            </View>
        );
    }

    return (
        <ScreenWrapper scrollable>
            {/* Truyền Blocks vào Engine. Data response structure needs to be checked against type definition. */}
            {/* Added defensive check for data?.blocks to ensure it's an array */}
            <SDUIEngine blocks={data?.blocks || []} />
        </ScreenWrapper>
    );
}
