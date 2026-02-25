import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { ApiClient } from '../../../src/services/ApiClient';
import { API_ENDPOINTS } from '../../../src/config/api-endpoints';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

interface CreatePostModalProps {
    visible: boolean;
    onClose: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ visible, onClose }) => {
    const { user } = useAuthStore();
    const [content, setContent] = useState('');
    const queryClient = useQueryClient();

    const createPostMutation = useMutation({
        mutationFn: async (text: string) => {
            return await ApiClient.fetchSafe(
                { ...API_ENDPOINTS.V3.APP.NEWS_FEED },
                { content: text, images: [] },
                'POST'
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news-feed'] });
            setContent('');
            onClose();
            // Normally we'd show a toast here
            if (typeof window !== 'undefined' && window.alert) window.alert('Đăng bài thành công!');
        },
        onError: (err) => {
            if (typeof window !== 'undefined' && window.alert) window.alert('Lỗi đăng bài vui lòng thử lại');
            console.error("Post Creation Error:", err);
        }
    });

    const handlePost = () => {
        if (!content.trim()) return;
        createPostMutation.mutate(content);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                <LinearGradient colors={['#e0f2fe', '#f8fafc']} style={StyleSheet.absoluteFillObject} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Text style={styles.closeTxt}>✕ Hủy</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Tạo bài viết</Text>
                    <TouchableOpacity
                        style={[styles.postBtn, !content.trim() && styles.postBtnDisabled]}
                        disabled={!content.trim() || createPostMutation.isPending}
                        onPress={handlePost}
                    >
                        {createPostMutation.isPending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.postTxt}>Đăng</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Body */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.body}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                            {user?.avatar ? (
                                <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
                            ) : (
                                <Text style={styles.avatarTxt}>👤</Text>
                            )}
                        </View>
                        <View>
                            <Text style={styles.userName}>{user?.name || 'Nhân viên QVC'}</Text>
                            <View style={styles.privacyBadge}>
                                <Text style={styles.privacyTxt}>🌎 Mọi người trong QVC</Text>
                            </View>
                        </View>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Bạn đang nghĩ gì thế? Chạm để nhập nội dung..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        autoFocus
                        value={content}
                        onChangeText={setContent}
                        textAlignVertical="top"
                    />
                </KeyboardAvoidingView>

                {/* Toolbar (Placeholder for future features) */}
                <View style={styles.toolbar}>
                    <TouchableOpacity style={styles.toolIconWrapper}>
                        <Text style={styles.toolIcon}>🖼️</Text>
                        <Text style={styles.toolLabel}>Thêm ảnh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolIconWrapper}>
                        <Text style={styles.toolIcon}>📍</Text>
                        <Text style={styles.toolLabel}>Check-in</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolIconWrapper}>
                        <Text style={styles.toolIcon}>😊</Text>
                        <Text style={styles.toolLabel}>Cảm xúc</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        zIndex: 10
    },
    closeBtn: { padding: 8, marginLeft: -8 },
    closeTxt: { color: '#64748b', fontSize: 16, fontWeight: '600' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    postBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
    postBtnDisabled: { backgroundColor: '#cbd5e1' },
    postTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

    body: { flex: 1, padding: 16 },
    userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f5f9', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarImg: { width: '100%', height: '100%' },
    avatarTxt: { fontSize: 24 },
    userName: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
    privacyBadge: { backgroundColor: '#f1f5f9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    privacyTxt: { fontSize: 12, color: '#475569', fontWeight: '500' },

    input: { flex: 1, fontSize: 18, color: '#1e293b', lineHeight: 28 },

    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    },
    toolIconWrapper: { alignItems: 'center', gap: 4 },
    toolIcon: { fontSize: 24 },
    toolLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' }
});
