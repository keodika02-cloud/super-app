import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    className?: string; // Additional classes for button content
    containerClassName?: string; // Additional classes for container
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    className,
}: ButtonProps) {
    const baseStyles = 'rounded-lg flex-row justify-center items-center';

    const variants = {
        primary: 'bg-blue-600 active:bg-blue-700',
        secondary: 'bg-gray-100 active:bg-gray-200',
        ghost: 'bg-transparent active:bg-gray-50',
        danger: 'bg-red-500 active:bg-red-600',
    };

    const textVariants = {
        primary: 'text-white font-semibold',
        secondary: 'text-gray-900 font-medium',
        ghost: 'text-blue-600 font-medium',
        danger: 'text-white font-semibold',
    };

    const sizes = {
        sm: 'px-3 py-1.5',
        md: 'px-4 py-2',
        lg: 'px-6 py-3',
    };

    const containerClasses = twMerge(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : 'self-start',
        disabled && 'opacity-50 pointer-events-none',
        className
    );

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            className={containerClasses}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' || variant === 'danger' ? 'white' : 'gray'}
                    size="small"
                    className="mr-2"
                />
            ) : null}
            <Text className={twMerge(textVariants[variant], size === 'lg' ? 'text-lg' : 'text-base')}>
                {title}
            </Text>
        </TouchableOpacity>
    );
}
