import React from 'react';
import { View, ScrollView, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { twMerge } from 'tailwind-merge';

interface ScreenWrapperProps {
    children: React.ReactNode;
    scrollable?: boolean;
    centered?: boolean;
    bgColor?: string; // Tailwind color class e.g., 'bg-gray-50'
    className?: string; // Additional classes for the container
}

export function ScreenWrapper({
    children,
    scrollable = false,
    centered = false,
    bgColor = 'bg-gray-50',
    className,
}: ScreenWrapperProps) {
    const containerClasses = twMerge(
        'flex-1',
        bgColor,
        centered && 'justify-center items-center',
        className
    );

    const content = scrollable ? (
        <ScrollView
            contentContainerStyle={{
                flexGrow: 1,
                justifyContent: centered ? 'center' : 'flex-start',
                alignItems: centered ? 'center' : 'stretch',
                padding: 16,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {children}
        </ScrollView>
    ) : (
        <View className={twMerge('flex-1 p-4', centered && 'justify-center items-center')}>
            {children}
        </View>
    );

    return (
        <SafeAreaView className={twMerge('flex-1', bgColor)}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                {content}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
