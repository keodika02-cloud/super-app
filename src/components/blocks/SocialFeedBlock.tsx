import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../../services/ApiClient';
import { API_ENDPOINTS } from '../../config/api-endpoints';
import { z } from 'zod';
import { CommentBlock } from './CommentBlock';
import { ErrorBoundary } from '../error/ErrorBoundary';

const { width } = Dimensions.get('window');

export const SocialFeedBlock = ({ data }: { data: any }) => {
    const queryClient = useQueryClient();
    const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({});
    const [showComments, setShowComments] = useState<Record<number, boolean>>({});

    const toggleComments = (id: number) => {
        setShowComments(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const { data: realFeed, refetch, isRefetching, isLoading } = useQuery({
        queryKey: ['news-feed'],
        queryFn: async () => {
            // Thêm _t để cache-busting qua axios, tránh CDN proxy cache chặt
            const res = await ApiClient.fetchSafe(API_ENDPOINTS.V3.APP.NEWS_FEED, { method: 'GET', _t: Date.now() });
            return res?.posts || [];
        },
        staleTime: 30000,
        refetchOnWindowFocus: false, // Tắt tự quay khi ra/vào app để đỡ lag
        refetchOnMount: true,
        placeholderData: (prev) => prev,
    });

    if (isLoading && !realFeed) {
        return <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color="#3b82f6" /></View>;
    }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // @ts-ignore
            window.newsFeedRefetch = refetch;
        }
    }, [refetch]);

    const toggleLikeMutation = useMutation({
        mutationFn: async (id: number) => {
            return await ApiClient.fetchSafe({
                path: `/v3/app/news-feed/${id}/like`,
                req: z.any(),
                res: z.any(),
                fallbackRes: {}
            }, undefined, 'POST');
        },
        onMutate: async (id) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: ['news-feed'] });
            const previousFeed = queryClient.getQueryData(['news-feed']);
            queryClient.setQueryData(['news-feed'], (old: any) => {
                if (!old) return old;
                return old.map((post: any) => {
                    if (post.id === id) {
                        return { ...post, likes: (post.likes || 0) + 1, hasLiked: true };
                    }
                    return post;
                });
            });
            return { previousFeed };
        }
        ,
        onError: (err, newTodo, context: any) => {
            if (context?.previousFeed) {
                queryClient.setQueryData(['news-feed'], context.previousFeed);
            }
            console.error('Like failed', err);
            // Có thể dùng Toast/Alert lỗi tại đây thay vì vỡ app
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['news-feed'] });
        },
    });

    const toggleLike = (idx: number, id: number) => {
        if (!likedPosts[idx]) {
            setLikedPosts(prev => ({ ...prev, [idx]: true }));
            toggleLikeMutation.mutate(id);
        }
    };

    const router = useRouter();
    const postsToRender = realFeed && realFeed.length > 0 ? realFeed : (data?.posts || []);

    if (!postsToRender || postsToRender.length === 0) return <View><Text style={{ padding: 20 }}>Chưa có bài viết nào trên bảng tin.</Text></View>;

    return (
        <View style={styles.socialFeedContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: -4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>Bảng tin công ty</Text>
                    {isRefetching && <ActivityIndicator size="small" color="#94a3b8" />}
                </View>
                <TouchableOpacity onPress={() => router.push('/newsfeed')} style={{ backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                    <Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 13 }}>Quản lý & Thêm ⚙️</Text>
                </TouchableOpacity>
            </View>
            <View>
                {postsToRender.map((post: any, idx: number) => (
                    <ErrorBoundary key={idx} scope={`NewsFeedPost-${post?.id || idx}`}>
                        <View style={styles.postCard}>
                            <View style={styles.postHeader}>
                                <View style={styles.postAvatar}>
                                    {post?.avatar ? (
                                        <Image source={{ uri: post.avatar }} style={styles.avatarImg} />
                                    ) : (
                                        <Text style={styles.avatarPlaceholder}>👤</Text>
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.postAuthor}>{post?.author || 'Ẩn danh'}</Text>
                                    <Text style={styles.postTime}>{post?.timestamp || 'Vừa xong'} • 🌐</Text>
                                </View>
                                <TouchableOpacity><Text style={{ color: '#94a3b8', fontSize: 20 }}>•••</Text></TouchableOpacity>
                            </View>

                            <Text style={styles.postContent}>{post?.content || ''}</Text>

                            {Array.isArray(post?.images) && post.images.length > 0 && (
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
                                <Text style={styles.statsText}>👍 {likedPosts[idx] ? (post?.likes || 0) + 1 : (post?.likes || 0)}</Text>
                                <Text style={styles.statsText}>{post?.comments_count || post?.comments || 0} bình luận</Text>
                            </View>

                            <View style={styles.postActions}>
                                <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(idx, post?.id)}>
                                    <Text style={[styles.actionText, likedPosts[idx] && { color: '#3b82f6' }]}>
                                        {likedPosts[idx] ? '💙 Đã thích' : '👍 Thích'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn} onPress={() => toggleComments(post?.id)}>
                                    <Text style={[styles.actionText, showComments[post?.id] && { color: '#3b82f6' }]}>💬 Bình luận</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Text style={styles.actionText}>🔗 Chia sẻ</Text>
                                </TouchableOpacity>
                            </View>

                            {showComments[post?.id] && post?.id && (
                                <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                                    <ErrorBoundary scope="CommentBlock">
                                        <CommentBlock data={{ context_type: 'NEWS_FEED', context_id: post.id }} />
                                    </ErrorBoundary>
                                </View>
                            )}
                        </View>
                    </ErrorBoundary>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    socialFeedContainer: { gap: 12 },
    container: {},
    postCard: {
        backgroundColor: '#fff',
        marginBottom: 8,
        paddingVertical: 16,
        borderRadius: 20,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    postHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, gap: 12 },
    postAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    avatarImg: { width: '100%', height: '100%' },
    avatarPlaceholder: { fontSize: 20 },
    postAuthor: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    postTime: { fontSize: 13, color: '#64748b', marginTop: 1 },
    postContent: { paddingHorizontal: 16, fontSize: 15, color: '#334155', lineHeight: 24, marginBottom: 12 },
    imageGalleryContainer: { marginBottom: 12 },
    singleImage: { width: '100%', height: 260 },
    galleryImage: { width: width * 0.8, height: 240, borderRadius: 12, marginLeft: 16 },
    postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, marginHorizontal: 16, justifyContent: 'space-between' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, flex: 1, justifyContent: 'center' },
    actionText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    postStats: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    statsText: { color: '#64748b', fontSize: 13 },
});
