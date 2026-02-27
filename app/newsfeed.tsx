import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, ScrollView, Platform, Dimensions, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@services/ApiClient';
import { API_ENDPOINTS } from '@config/api-endpoints';
import { useAuthStore } from '@stores/useAuthStore';
import { CreatePostModal } from '@components/modals/CreatePostModal';

const { width } = Dimensions.get('window');

// Một phiên bản mở rộng của bài viết với chức năng CRUD
const FeedItem = ({ post, currentUserId, onEdit, onDelete }: { post: any, currentUserId: number, onEdit: (post: any) => void, onDelete: (id: number) => void }) => {
    return (
        <View style={styles.postCard}>
            <View style={styles.postHeader}>
                <View style={styles.postAvatar}>
                    {post.avatar ? <Image source={{ uri: post.avatar }} style={styles.avatarImg} /> : <Text style={styles.avatarTxt}>👤</Text>}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.postAuthor}>{post.author}</Text>
                    <Text style={styles.postTime}>{post.timestamp || 'Vừa xong'}</Text>
                </View>
                <TouchableOpacity onPress={() => {
                    Alert.alert('Chức năng', 'Sửa/Xoá bài viết này', [
                        { text: 'Hủy', style: 'cancel' },
                        { text: 'Chỉnh sửa', onPress: () => onEdit(post) },
                        { text: 'Xóa bài', style: 'destructive', onPress: () => onDelete(post.id) },
                    ]);
                }} style={styles.menuBtn}>
                    <Text style={styles.menuTxt}>•••</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            {post.images && post.images.length > 0 && (
                <View style={styles.imageGalleryContainer}>
                    {post.images.length === 1 ? (
                        <Image source={{ uri: post.images[0] }} style={styles.singleImage} resizeMode="cover" />
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {post.images.map((img: string, i: number) => (
                                <Image key={i} source={{ uri: img }} style={styles.galleryImage} />
                            ))}
                        </ScrollView>
                    )}
                </View>
            )}

            <View style={styles.postStats}>
                <Text style={styles.statsText}>👍 {post.likes || 0}   💬 {post.comments || 0}</Text>
            </View>
        </View>
    );
};

export default function NewsfeedScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

    // Edit state
    const [editingPost, setEditingPost] = useState<any>(null);
    const [editContent, setEditContent] = useState('');

    const { data: feedData, isLoading, isRefetching } = useQuery({
        queryKey: ['news-feed-crud'],
        queryFn: async () => {
            const res = await ApiClient.fetchSafe(API_ENDPOINTS.V3.APP.NEWS_FEED, { method: 'GET', _t: Date.now() });
            return res?.posts || [];
        },
        staleTime: 1000 * 30, // 30s
        refetchOnWindowFocus: false,
        placeholderData: (prev) => prev,
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return await ApiClient.fetchSafe(
                { path: `${API_ENDPOINTS.V3.APP.DELETE_POST.path}/${id}`, req: API_ENDPOINTS.V3.APP.DELETE_POST.req, res: API_ENDPOINTS.V3.APP.DELETE_POST.res, fallbackRes: {} },
                { method: 'DELETE' }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news-feed-crud'] });
            queryClient.invalidateQueries({ queryKey: ['news-feed'] });
            Alert.alert('Thành công', 'Đã xóa bài viết.');
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, content }: { id: number, content: string }) => {
            return await ApiClient.fetchSafe(
                { path: `${API_ENDPOINTS.V3.APP.UPDATE_POST.path}/${id}`, req: API_ENDPOINTS.V3.APP.UPDATE_POST.req, res: API_ENDPOINTS.V3.APP.UPDATE_POST.res, fallbackRes: {} },
                { method: 'PUT', body: JSON.stringify({ content }) }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news-feed-crud'] });
            queryClient.invalidateQueries({ queryKey: ['news-feed'] });
            setEditingPost(null);
            setEditContent('');
            Alert.alert('Thành công', 'Đã cập nhật bài viết.');
        }
    });

    const handleDelete = (id: number) => {
        Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa bài viết này?', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Xóa', style: 'destructive', onPress: () => deleteMutation.mutate(id) }
        ]);
    };

    const handleEdit = (post: any) => {
        setEditingPost(post);
        setEditContent(post.content);
    };

    const submitEdit = () => {
        if (!editContent.trim()) return;
        updateMutation.mutate({ id: editingPost.id, content: editContent });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backTxt}>← Trở về</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.headerTitle}>Quản lý Bảng tin</Text>
                    {isRefetching && <ActivityIndicator size="small" color="#94a3b8" />}
                </View>
                <TouchableOpacity onPress={() => setIsCreateModalVisible(true)} style={styles.addBtn}>
                    <Text style={styles.addTxt}>+ Tạo bài</Text>
                </TouchableOpacity>
            </View>

            {editingPost && (
                <View style={styles.editSection}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Chỉnh sửa bài viết</Text>
                    <TextInput
                        style={styles.editInput}
                        multiline value={editContent} onChangeText={setEditContent}
                    />
                    <View style={styles.editActions}>
                        <TouchableOpacity onPress={() => setEditingPost(null)} style={styles.cancelBtn}>
                            <Text style={styles.cancelTxt}>Huỷ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={submitEdit} style={styles.saveBtn}>
                            <Text style={styles.saveTxt}>{updateMutation.isPending ? 'Đang lưu...' : 'Lưu lại'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.list}>
                {isLoading && (!feedData || feedData.length === 0) ? (
                    <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
                ) : feedData && feedData.length > 0 ? (
                    feedData.map((post: any) => (
                        <FeedItem
                            key={post.id}
                            post={post}
                            currentUserId={user?.id || 0}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <Text style={styles.emptyTxt}>Không có bài viết nào.</Text>
                )}
            </ScrollView>

            <CreatePostModal
                visible={isCreateModalVisible}
                onClose={() => {
                    setIsCreateModalVisible(false);
                    queryClient.invalidateQueries({ queryKey: ['news-feed-crud'] });
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 16,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
        zIndex: 10
    },
    backBtn: { padding: 8, marginLeft: -8 },
    backTxt: { color: '#3b82f6', fontSize: 16, fontWeight: '600' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    addBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    addTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    list: { padding: 12, paddingBottom: 100 },
    emptyTxt: { textAlign: 'center', marginTop: 50, color: '#64748b' },

    editSection: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    editInput: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, minHeight: 80, fontSize: 16, textAlignVertical: 'top' },
    editActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 12 },
    cancelBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#f1f5f9' },
    cancelTxt: { color: '#64748b', fontWeight: 'bold' },
    saveBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#3b82f6' },
    saveTxt: { color: '#fff', fontWeight: 'bold' },

    postCard: { backgroundColor: '#fff', marginBottom: 12, paddingVertical: 16, borderRadius: 20, elevation: 1 },
    postHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, gap: 12 },
    postAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    avatarImg: { width: '100%', height: '100%' },
    avatarTxt: { fontSize: 20 },
    postAuthor: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    postTime: { fontSize: 13, color: '#64748b' },
    menuBtn: { padding: 8 },
    menuTxt: { fontSize: 20, color: '#94a3b8' },
    postContent: { paddingHorizontal: 16, fontSize: 15, color: '#334155', lineHeight: 24, marginBottom: 12 },
    imageGalleryContainer: { marginBottom: 12 },
    singleImage: { width: '100%', height: 260 },
    galleryImage: { width: width * 0.8, height: 240, borderRadius: 12, marginLeft: 16 },
    postStats: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    statsText: { color: '#64748b', fontSize: 14, fontWeight: '500' },
});
