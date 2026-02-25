import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckSquare } from 'lucide-react-native';

// Placeholder – sẽ triển khai Task Module đầy đủ trong sprint tiếp theo
export default function TasksScreen() {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Công việc</Text>
            </View>
            <View style={styles.empty}>
                <CheckSquare size={64} color="#E5E7EB" />
                <Text style={styles.emptyTitle}>Đang phát triển</Text>
                <Text style={styles.emptySubtitle}>
                    Module Công việc sẽ ra mắt trong phiên bản tiếp theo.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    title: { fontSize: 20, fontWeight: '700', color: '#111827' },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
    },
});
