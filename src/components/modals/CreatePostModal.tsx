import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { ApiClient } from '../../../src/services/ApiClient';
import { API_ENDPOINTS } from '../../../src/config/api-endpoints';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
interface CreatePostModalProps {
    visible: boolean;
    onClose: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ visible, onClose }) => {
    const { user } = useAuthStore();
    const [content, setContent] = useState('');
    const queryClient = useQueryClient();

    const createPostMutation = useMutation({
        mutationFn: async (payload: { content: string, uris: string[] }) => {
            if (payload.uris.length > 0) {
                const formData = new FormData();
                formData.append('content', payload.content);

                payload.uris.forEach((uri, index) => {
                    const filename = uri.split('/').pop() || `image_${index}.jpg`;
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image/jpeg`;

                    // @ts-ignore
                    formData.append('images[]', {
                        uri: uri,
                        name: filename,
                        type: type,
                    });
                });

                return await ApiClient.uploadFormData(API_ENDPOINTS.V3.APP.NEWS_FEED.path, formData);
            }

            return await ApiClient.fetchSafe(
                { ...API_ENDPOINTS.V3.APP.NEWS_FEED },
                { content: payload.content, images: [] },
                'POST'
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news-feed'] });
            setContent('');
            setImages([]);
            onClose();
            Alert.alert('Thành công', 'Đăng bài thành công!');
        },
        onError: (err: any) => {
            Alert.alert('Lỗi', 'Lỗi đăng bài vui lòng thử lại');
            console.error("Post Creation Error:", err);
        }
    });

    const [images, setImages] = useState<string[]>([]);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            const newUris = result.assets.map(a => a.uri);
            setImages(prev => [...prev, ...newUris].slice(0, 5)); // Giới hạn 5 ảnh
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handlePost = () => {
        if (!content.trim() && images.length === 0) return;
        createPostMutation.mutate({ content, uris: images });
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
                        style={[styles.postBtn, (!content.trim() && images.length === 0) && styles.postBtnDisabled]}
                        disabled={(!content.trim() && images.length === 0) || createPostMutation.isPending}
                        onPress={handlePost}
                    >
                        {createPostMutation.isPending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.postTxt}>Đăng</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Body - Flex để tự co giãn */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
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
                            scrollEnabled={false} // Để ScrollView cha xử lý
                        />

                        {/* Image Preview List */}
                        {images.length > 0 && (
                            <View style={styles.imagePreviewContainer}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {images.map((uri, idx) => (
                                        <View key={idx} style={styles.previewItem}>
                                            <Image source={{ uri }} style={styles.previewImg} />
                                            <TouchableOpacity style={styles.removeBadge} onPress={() => removeImage(idx)}>
                                                <Text style={{ fontSize: 20, color: '#ef4444' }}>❌</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    {images.length < 5 && (
                                        <TouchableOpacity style={styles.addMoreBtn} onPress={handlePickImage}>
                                            <Text style={{ fontSize: 32, color: '#94a3b8' }}>➕</Text>
                                        </TouchableOpacity>
                                    )}
                                </ScrollView>
                            </View>
                        )}
                    </ScrollView>

                    {/* Toolbar - Dính vào bàn phím nếu KeyboardAvoidingView chuẩn */}
                    <View style={styles.toolbar}>
                        <TouchableOpacity style={styles.toolIconWrapper} onPress={handlePickImage}>
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
                </KeyboardAvoidingView>

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

    userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f5f9', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarImg: { width: '100%', height: '100%' },
    avatarTxt: { fontSize: 24 },
    userName: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
    privacyBadge: { backgroundColor: '#f1f5f9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    privacyTxt: { fontSize: 12, color: '#475569', fontWeight: '500' },

    input: { minHeight: 120, fontSize: 18, color: '#1e293b', lineHeight: 28 },

    imagePreviewContainer: { marginTop: 20, marginBottom: 10 },
    previewItem: { width: 100, height: 100, borderRadius: 12, marginRight: 12, position: 'relative' },
    previewImg: { width: '100%', height: '100%', borderRadius: 12 },
    removeBadge: { position: 'absolute', top: -10, right: -10, backgroundColor: '#fff', borderRadius: 12 },
    addMoreBtn: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#f1f5f9', borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },

    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingBottom: Platform.OS === 'ios' ? 40 : 16,
    },
    toolIconWrapper: { alignItems: 'center', gap: 4 },
    toolIcon: { fontSize: 24 },
    toolLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' }
});
