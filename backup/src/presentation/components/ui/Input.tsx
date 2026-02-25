import React from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerClassName?: string;
}

export function Input({
    label,
    error,
    containerClassName,
    className,
    ...props
}: InputProps) {
    return (
        <View className={twMerge('mb-4 w-full', containerClassName)}>
            {label && (
                <Text className="text-sm font-medium text-gray-700 mb-1">
                    {label}
                </Text>
            )}
            <TextInput
                className={twMerge(
                    'w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-base',
                    'focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
                    error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                    className
                )}
                placeholderTextColor="#9CA3AF"
                {...props}
            />
            {error && (
                <Text className="text-xs text-red-500 mt-1">
                    {error}
                </Text>
            )}
        </View>
    );
}
