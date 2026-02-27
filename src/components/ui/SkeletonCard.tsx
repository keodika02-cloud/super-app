/**
 * src/components/ui/SkeletonCard.tsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Màn hình chờ (Placeholder) cho logic offline-first.
 * ──────────────────────────────────────────────────────────────────────────────
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { GlassCard } from './GlassCard';

interface SkeletonProps {
    height?: number;
    width?: number | string;
    borderRadius?: number;
    style?: any;
}

export function SkeletonItem({ height = 20, width = '100%', borderRadius = 8, style }: SkeletonProps) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                {
                    height,
                    width,
                    borderRadius,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    opacity,
                },
                style,
            ]}
        />
    );
}

export function SkeletonCard() {
    return (
        <GlassCard tight style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <SkeletonItem height={40} width={40} borderRadius={20} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                    <SkeletonItem height={14} width="60%" style={{ marginBottom: 8 }} />
                    <SkeletonItem height={10} width="40%" />
                </View>
            </View>
        </GlassCard>
    );
}

export function SkeletonList({ count = 5 }) {
    return (
        <View style={{ padding: 20 }}>
            {[...Array(count)].map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </View>
    );
}
