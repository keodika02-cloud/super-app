import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function NotFoundScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Không tìm thấy trang' }} />
            <View style={styles.container}>
                <Text style={styles.code}>404</Text>
                <Text style={styles.title}>Trang không tồn tại</Text>
                <Text style={styles.subtitle}>
                    Đường dẫn bạn truy cập không hợp lệ hoặc đã bị xóa.
                </Text>
                <Link href="/" asChild>
                    <TouchableOpacity style={styles.btn}>
                        <Text style={styles.btnText}>Về trang chủ</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 16,
    },
    code: {
        fontSize: 72,
        fontWeight: '900',
        color: '#E5E7EB',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
    btn: {
        marginTop: 8,
        backgroundColor: '#1E3A8A',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    btnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});
