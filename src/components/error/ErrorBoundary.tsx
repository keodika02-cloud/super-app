import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { RemoteLogger } from '@services/RemoteLogger';

interface Props {
    children: ReactNode;
    scope?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    public static getDerivedStateFromError(error: Error): State {
        // [HARDENING]: Ensure state reflects the error to show fallback UI
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const scope = this.props.scope || 'App';

        // [HARDENING]: Log online ngay lập tức
        RemoteLogger.fatal(`Crash [${scope}]: ${error.message}`, {
            stack: error.stack,
            componentStack: errorInfo.componentStack
        });

        if (__DEV__) {
            console.error(`[ErrorBoundary:${scope}] Uncaught error:`, error, errorInfo);
        } else {
            Sentry.captureException(error, {
                tags: { scope },
                extra: { componentStack: errorInfo.componentStack }
            });
        }
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.icon}>⚠️</Text>
                    <Text style={styles.title}>Đã có lỗi xảy ra</Text>
                    <Text style={styles.subtitle}>
                        Ứng dụng gặp sự cố không mong muốn trong khu vực: {this.props.scope || 'Giao diện'}.
                    </Text>
                    {(__DEV__ || (global as any).ENV_LOAD_ERROR) && (
                        <View style={styles.devErrorBox}>
                            <Text style={styles.devErrorText}>
                                {this.state.error?.toString() || 'Unknown Error'}
                                {"\n\n"}
                                {JSON.stringify((global as any).ENV_LOAD_ERROR, null, 2)}
                            </Text>
                        </View>
                    )}
                    <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                        <Text style={styles.buttonText}>Tải lại trang</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#0f172a', // slate-900 (Dark mode fallback)
    },
    icon: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#cbd5e1',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    devErrorBox: {
        backgroundColor: '#450a0a',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        width: '100%',
    },
    devErrorText: {
        color: '#fca5a5',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    button: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 14,
    },
});
