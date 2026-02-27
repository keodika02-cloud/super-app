import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '@stores/useAuthStore';
import { ApiClient } from '@services/ApiClient';
import { API_ENDPOINTS } from '@config/api-endpoints';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Image as ImageIcon, MapPin, Smile, Globe, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY = '@news_feed_draft';

interface CreatePostModalProps {
    visible: boolean;
    onClose: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ visible, onClose }) => {
    const { user } = useAuthStore();
    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isLocating, setIsLocating] = useState(false);
    const queryClient = useQueryClient();

    // 1. TẢI HOẶC TẠO MỚI BẢN NHÁP
    useEffect(() => {
        if (visible) {
            AsyncStorage.getItem(DRAFT_KEY).then(draft => {
                if (draft) {
                    const parsed = JSON.parse(draft);
                    setContent(parsed.content || '');
                    setImages(parsed.images || []);
                }
            }).catch(console.error);
        }
    }, [visible]);

    // LƯU NHÁP TỰ ĐỘNG
    useEffect(() => {
        if (visible) {
            AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ content, images })).catch(console.error);
        }
    }, [content, images, visible]);

    // 2. CHỌN ẢNH TỪ THƯ VIỆN
    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Cấp quyền', 'App cần quyền truy cập thư viện ảnh để đính kèm nhé!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets) {
            const newUris = result.assets.map(a => a.uri);
            setImages(prev => [...prev, ...newUris]);
        }
    };

    // 3. CHỤP ẢNH TỪ CAMERA
    const handleCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Cấp quyền', 'App cần quyền truy cập Camera nhé!');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
        });

        if (!result.canceled && result.assets) {
            setImages(prev => [...prev, result.assets[0].uri]);
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    // 4. LẤY TỌA ĐỘ CHECK-IN
    const handleGetLocation = async () => {
        setIsLocating(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Thiếu quyền', 'Vui lòng cấp quyền định vị trong Cài đặt để sử dụng Check-in');
                setIsLocating(false);
                return;
            }

            let location;
            try {
                location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            } catch (err) {
                location = await Location.getLastKnownPositionAsync();
                if (!location) throw err;
            }

            const [address] = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            if (address) {
                const locStr = [address.name, address.street, address.subregion, address.city].filter(Boolean).join(', ');
                setContent(prev => {
                    const append = `\n📍 Check-in tại: ${locStr}`;
                    if (prev.includes('📍 Check-in tại:')) return prev;
                    return prev + append;
                });
            } else {
                Alert.alert('Lỗi', 'Không diễn dịch được toạ độ hiện tại');
            }
        } catch (error: any) {
            Alert.alert('Chưa bật GPS', 'Vui lòng bật tính năng Vị trí (GPS) trên thiết bị của bạn hoặc cấp quyền trong Cài đặt.');
        } finally {
            setIsLocating(false);
        }
    };

    // 5. MUTATION VỚI FORM DATA (CẬP NHẬT TỪ UPSTREAM)
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
            AsyncStorage.removeItem(DRAFT_KEY);
            onClose();
            Alert.alert('Thành công', 'Đăng bài thành công!');
        },
        onError: (err: any) => {
            Alert.alert('Lỗi', 'Lỗi đăng bài vui lòng thử lại');
            console.error("Post Creation Error:", err);
        }
    });

    const handlePost = () => {
        if (!content.trim() && images.length === 0) return;
        createPostMutation.mutate({ content, uris: images });
    };

    const avatarUri = typeof user?.avatar === 'string' && user.avatar.length > 0 ? user.avatar : null;
    const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'V';
    const isPostDisabled = !content.trim() && images.length === 0;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                {/* Header chuẩn Facebook */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X size={24} color="#050505" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Tạo bài viết</Text>
                    <TouchableOpacity
                        style={[styles.postBtn, isPostDisabled && styles.postBtnDisabled]}
                        disabled={isPostDisabled || createPostMutation.isPending}
                        onPress={handlePost}
                    >
                        {createPostMutation.isPending ? (
                            <ActivityIndicator size="small" color={isPostDisabled ? '#bcc0c4' : '#fff'} />
                        ) : (
                            <Text style={[styles.postTxt, isPostDisabled && styles.postTxtDisabled]}>Đăng</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Body */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
                    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
                        <View style={styles.userInfo}>
                            <View style={styles.avatar}>
                                {avatarUri ? (
                                    <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                                ) : (
                                    <View style={styles.avatarFallback}>
                                        <Text style={styles.avatarTxt}>{initial}</Text>
                                    </View>
                                )}
                            </View>
                            <View>
                                <Text style={styles.userName}>{user?.name || 'Thành viên QVC'}</Text>
                                <View style={styles.privacyBadge}>
                                    <Globe size={12} color="#65676B" />
                                    <Text style={styles.privacyTxt}>Công khai</Text>
                                </View>
                            </View>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Bạn đang nghĩ gì thế?"
                            placeholderTextColor="#65676B"
                            multiline
                            autoFocus
                            value={content}
                            onChangeText={setContent}
                            textAlignVertical="top"
                        />

                        {/* Image Previews */}
                        {images.length > 0 && (
                            <View style={styles.previewContainer}>
                                {images.map((img, i) => (
                                    <View key={i} style={styles.previewWrapper}>
                                        <Image source={{ uri: img }} style={styles.previewImg} />
                                        <TouchableOpacity style={styles.previewRemoveBtn} onPress={() => handleRemoveImage(i)}>
                                            <X size={16} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Toolbar Facebook */}
                <View style={styles.toolbar}>
                    <TouchableOpacity style={styles.toolIconWrapper} onPress={handlePickImage} activeOpacity={0.6}>
                        <ImageIcon size={26} color="#45BD62" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolIconWrapper} onPress={handleCamera} activeOpacity={0.6}>
                        <Camera size={26} color="#06b6d4" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolIconWrapper} onPress={handleGetLocation} activeOpacity={0.6} disabled={isLocating}>
                        {isLocating ? (
                            <ActivityIndicator size="small" color="#F5533D" />
                        ) : (
                            <MapPin size={26} color="#F5533D" />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolIconWrapper} activeOpacity={0.6}>
                        <Smile size={26} color="#F7B928" />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#CED0D4',
        zIndex: 10
    },
    closeBtn: { padding: 4, marginLeft: -4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#050505' },
    postBtn: {
        backgroundColor: '#1877F2',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 6
    },
    postBtnDisabled: { backgroundColor: '#E4E6EB' },
    postTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    postTxtDisabled: { color: '#BCC0C4' },

    body: { flex: 1 },
    scrollContent: { padding: 16, flexGrow: 1 },
    userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', marginRight: 12 },
    avatarFallback: { width: '100%', height: '100%', backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
    avatarImg: { width: '100%', height: '100%' },
    avatarTxt: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    userName: { fontSize: 16, fontWeight: '700', color: '#050505', marginBottom: 4 },
    privacyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f2f5', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
    privacyTxt: { fontSize: 13, color: '#65676B', fontWeight: '600' },

    input: { fontSize: 18, color: '#050505', lineHeight: 26, minHeight: 120 },

    previewContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
    previewWrapper: { position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f2f5' },
    previewImg: { width: '100%', height: '100%' },
    previewRemoveBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 },

    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#CED0D4',
        paddingBottom: Platform.OS === 'ios' ? 30 : 16,
        paddingTop: 12,
        gap: 24
    },
    toolIconWrapper: { padding: 4 },
});
