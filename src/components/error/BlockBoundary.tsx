import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
    children: ReactNode;
    fallbackMessage?: string;
    blockName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * BlockBoundary catches rendering errors within its child component tree.
 * Used to wrap individual SDUI blocks so that one failing block doesn't crash the entire screen.
 */
export class BlockBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log the error to an error reporting service like Sentry here if needed
        console.error(`[BlockBoundary] Caught error in block ${this.props.blockName || 'Unknown'}:`, error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (__DEV__) {
                return (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorTitle}>
                            ⚠️ Lỗi hiển thị khối {this.props.blockName ? `"${this.props.blockName}"` : ''}
                        </Text>
                        <Text style={styles.errorText} numberOfLines={3}>
                            {this.state.error?.message}
                        </Text>
                    </View>
                );
            }
            // In production, simply hide the broken block silently or show a minimal placeholder
            return null;
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    errorBox: {
        margin: 12,
        padding: 12,
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
        borderStyle: 'dashed',
    },
    errorTitle: {
        color: '#DC2626',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
    },
});
