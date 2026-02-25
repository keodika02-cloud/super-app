import React from 'react';
import { View, ViewProps } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface CardProps extends ViewProps {
    className?: string;
    variant?: 'default' | 'outlined';
}

export function Card({
    children,
    className,
    variant = 'default',
    ...props
}: CardProps) {
    const variants = {
        default: 'bg-white shadow-sm shadow-gray-200',
        outlined: 'bg-white border border-gray-200',
    };

    return (
        <View
            className={twMerge(
                'rounded-xl p-4',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </View>
    );
}
