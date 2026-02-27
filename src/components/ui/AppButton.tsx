/**
 * src/components/ui/AppButton.tsx
 * Button chuẩn toàn app – mỗi nút chỉ làm 1 việc.
 *
 * Variants: primary | danger | outline | ghost
 * States: loading (spinner), disabled (opacity)
 */
import React from 'react';
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    type ViewStyle,
    type StyleProp,
} from 'react-native';

interface AppButtonProps {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'danger' | 'outline' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    fullWidth?: boolean;
}

const COLORS = {
    primary: { bg: '#2563eb', text: '#fff', border: '#2563eb' },
    danger: { bg: '#dc2626', text: '#fff', border: '#dc2626' },
    outline: { bg: 'transparent', text: '#2563eb', border: '#2563eb' },
    ghost: { bg: 'transparent', text: '#6b7280', border: 'transparent' },
};

export function AppButton({
    label, onPress, variant = 'primary',
    loading = false, disabled = false,
    style, fullWidth = false,
}: AppButtonProps) {
    const color = COLORS[variant];
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.75}
            style={[
                {
                    backgroundColor: color.bg,
                    borderWidth: 1.5,
                    borderColor: color.border,
                    borderRadius: 14,
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isDisabled ? 0.55 : 1,
                    width: fullWidth ? '100%' : undefined,
                },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator size="small" color={color.text} />
            ) : (
                <Text style={{ color: color.text, fontWeight: '700', fontSize: 16 }}>
                    {label}
                </Text>
            )}
        </TouchableOpacity>
    );
}
