import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { ApiClient } from '../../src/services/ApiClient';
import { API_ENDPOINTS } from '../../src/config/api-endpoints';

export default function BroadcastScreen() {
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [url, setUrl] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'error'>('info');
    const [target, setTarget] = useState<'all_staff' | 'specific_users'>('all_staff');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tiêu đề và nội dung.');
            return;
        }

        Alert.alert(
            'Xác nhận',
            `Bạn có chắc chắn muốn gửi thông báo này tới ${target === 'all_staff' ? 'tất cả nhân viên' : 'đối tượng đã chọn'} không?`,
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Gửi ngay', onPress: sendBroadcast }
            ]
        );
    };

    const sendBroadcast = async () => {
        setIsSending(true);
        try {
            const res = await ApiClient.postSafe(API_ENDPOINTS.NOTIFICATIONS.BROADCAST, {
                title,
                body,
                target,
                url: url.trim() || undefined,
                type
            });

            if (res) {
                Alert.alert('Thành công', 'Thông báo đã được gửi đi thành công.');
                setTitle('');
                setBody('');
                setUrl('');
            }
        } catch (error) {
            console.error('[AdminBroadcast] Error:', error);
            Alert.alert('Thất bại', 'Không thể gửi thông báo. Vui lòng thử lại.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <ScreenWrapper backgroundColor="#f8fafc">
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gửi thông báo toàn App</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.label}>Tiêu đề thông báo</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nhập tiêu đề (vd: Thông báo khẩn)..."
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Nội dung</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Nhập nội dung thông báo chi tiết..."
                        value={body}
                        onChangeText={setBody}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Link điều hướng (URL) - Tùy chọn</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="vd: /newsfeed, /chat/123..."
                        value={url}
                        onChangeText={setUrl}
                    />
                    <Text style={styles.helper}>Người dùng bấm vào thông báo sẽ mở màn hình này.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Mức độ cảnh báo</Text>
                    <View style={styles.typeContainer}>
                        {(['info', 'warning', 'error'] as const).map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[
                                    styles.typeBtn,
                                    type === t && styles.typeBtnActive,
                                    type === t && t === 'info' && { backgroundColor: '#3b82f6' },
                                    type === t && t === 'warning' && { backgroundColor: '#f59e0b' },
                                    type === t && t === 'error' && { backgroundColor: '#ef4444' },
                                ]}
                                onPress={() => setType(t)}
                            >
                                <Text style={[styles.typeText, type === t && { color: '#fff' }]}>
                                    {t.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.sendBtn, isSending && styles.disabledBtn]}
                    onPress={handleSend}
                    disabled={isSending}
                >
                    {isSending ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.sendBtnText}>GỬI THÔNG BÁO NGAY</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    backIcon: { fontSize: 24, color: '#334155' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
    content: { padding: 20 },
    section: { marginBottom: 20 },
    label: { fontSize: 15, fontWeight: '600', color: '#334155', marginBottom: 8 },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#0f172a'
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    helper: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
    typeContainer: { flexDirection: 'row', gap: 10 },
    typeBtn: {
        flex: 1,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        alignItems: 'center'
    },
    typeBtnActive: { borderColor: 'transparent' },
    typeText: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
    sendBtn: {
        backgroundColor: '#1e293b',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    disabledBtn: { opacity: 0.7 },
    sendBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }
});
