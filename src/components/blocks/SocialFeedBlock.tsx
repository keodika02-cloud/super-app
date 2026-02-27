import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../../services/ApiClient';
import { API_ENDPOINTS } from '../../config/api-endpoints';
import { z } from 'zod';
import { CommentBlock } from './CommentBlock';
import { ErrorBoundary } from '../error/ErrorBoundary';
import { MoreHorizontal, Globe, ThumbsUp, MessageSquare, Share2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Lọc uri chuẩn cho Image components
const extractUri = (img: any): string | null => {
    if (typeof img === 'string') return img;
    if (img && typeof img === 'object') {
        return img.url || img.uri || img.src || null;
    }
    return null;
};

export const SocialFeedBlock = ({ data }: { data: any }) => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({});
    const [showComments, setShowComments] = useState<Record<number, boolean>>({});

    const { data: realFeed, refetch, isRefetching, isLoading } = useQuery({
        queryKey: ['news-feed'],
        queryFn: async () => {
            const res = await ApiClient.fetchSafe(API_ENDPOINTS.V3.APP.NEWS_FEED, { method: 'GET', _t: Date.now() });
            return res?.posts || [];
        },
        staleTime: 30000,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        placeholderData: (prev) => prev,
    });

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
        },
        onError: (err, newTodo, context: any) => {
            if (context?.previousFeed) {
                queryClient.setQueryData(['news-feed'], context.previousFeed);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['news-feed'] });
        },
    });

    if (isLoading && !realFeed) {
        return <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color="#1877F2" /></View>;
    }

    const toggleComments = (id: number) => {
        setShowComments(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleLike = (idx: number, id: number) => {
        if (!likedPosts[idx]) {
            setLikedPosts(prev => ({ ...prev, [idx]: true }));
            toggleLikeMutation.mutate(id);
        } else {
            setLikedPosts(prev => ({ ...prev, [idx]: false }));
            // Optional: Handle unlike if API supports it
        }
    };

    const postsToRender = realFeed && realFeed.length > 0 ? realFeed : (data?.posts || []);

    if (!postsToRender || postsToRender.length === 0) return null;

    return (
        <View style={styles.socialFeedContainer}>
            {postsToRender.map((post: any, idx: number) => {
                const avatarUri = extractUri(post?.avatar);
                const hasLiked = likedPosts[idx] || post?.hasLiked;
                const likesCount = hasLiked ? (post?.likes || 0) + (likedPosts[idx] && !post?.hasLiked ? 1 : 0) : post?.likes || 0;

                return (
                    <ErrorBoundary key={idx} scope={`NewsFeedPost-${post?.id || idx}`}>
                        <View style={styles.postCard}>
                            {/* Header bài viết */}
                            <View style={styles.postHeader}>
                                <View style={styles.postAvatarCircle}>
                                    {avatarUri ? (
                                        <Image source={{ uri: avatarUri }} style={styles.fullImage} />
                                    ) : (
                                        <Text style={styles.avatarPlaceholder}>{post?.author?.charAt(0) || 'U'}</Text>
                                    )}
                                </View>
                                <View style={styles.postHeaderTextContainer}>
                                    <Text style={styles.postAuthorName}>{post?.author || 'Ẩn danh'}</Text>
                                    <View style={styles.postTimeRow}>
                                        <Text style={styles.postTimeLabel}>{post?.timestamp || 'Vừa xong'} • </Text>
                                        <Globe size={11} color="#65676B" />
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.moreBtn}>
                                    <MoreHorizontal size={20} color="#65676B" />
                                </TouchableOpacity>
                            </View>

                            {/* Nội dung bài viết */}
                            {post?.content ? (
                                <View style={styles.postContentContainer}>
                                    <Text style={styles.postMainText}>{post.content}</Text>
                                </View>
                            ) : null}

                            {/* Ảnh bài viết */}
                            {Array.isArray(post?.images) && post.images.length > 0 && (
                                <View style={styles.imageGalleryContainer}>
                                    {post.images.length === 1 ? (
                                        extractUri(post.images[0]) && (
                                            <Image
                                                source={{ uri: extractUri(post.images[0]) as string }}
                                                style={styles.singleImage}
                                                resizeMode="cover"
                                            />
                                        )
                                    ) : (
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            {post.images.map((img: any, i: number) => {
                                                const uri = extractUri(img);
                                                return uri ? (
                                                    <Image key={i} source={{ uri }} style={styles.galleryImage} />
                                                ) : null;
                                            })}
                                        </ScrollView>
                                    )}
                                </View>
                            )}

                            {/* Thống kê Like/Comment */}
                            <View style={styles.postStats}>
                                <View style={styles.likeStats}>
                                    {likesCount > 0 && (
                                        <>
                                            <View style={styles.likeBadge}>
                                                <ThumbsUp size={10} color="white" fill="white" />
                                            </View>
                                            <Text style={styles.statsText}>{likesCount}</Text>
                                        </>
                                    )}
                                </View>
                                <View style={styles.commentStats}>
                                    {(post?.comments_count || post?.comments) ? (
                                        <Text style={styles.statsText}>{post?.comments_count || post?.comments} bình luận</Text>
                                    ) : null}
                                </View>
                            </View>

                            {/* Nút hành động */}
                            <View style={styles.postActions}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => toggleLike(idx, post?.id)}
                                    activeOpacity={0.6}
                                >
                                    <ThumbsUp size={18} color={hasLiked ? "#1877F2" : "#65676B"} fill={hasLiked ? "#1877F2" : "transparent"} />
                                    <Text style={[styles.actionButtonText, hasLiked && { color: '#1877F2' }]}>Thích</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => toggleComments(post?.id)}
                                    activeOpacity={0.6}
                                >
                                    <MessageSquare size={18} color="#65676B" />
                                    <Text style={styles.actionButtonText}>Bình luận</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton} activeOpacity={0.6}>
                                    <Share2 size={18} color="#65676B" />
                                    <Text style={styles.actionButtonText}>Chia sẻ</Text>
                                </TouchableOpacity>
                            </View>

                            {showComments[post?.id] && post?.id && (
                                <View style={{ borderTopWidth: 1, borderTopColor: '#f0f2f5' }}>
                                    <ErrorBoundary scope="CommentBlock">
                                        <CommentBlock data={{ context_type: 'NEWS_FEED', context_id: post.id }} />
                                    </ErrorBoundary>
                                </View>
                            )}
                        </View>
                    </ErrorBoundary>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    socialFeedContainer: { gap: 16 },
    postCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 1, borderWidth: 1, borderColor: '#e2e8f0' },

    postHeader: { flexDirection: 'row', padding: 16, alignItems: 'center', gap: 12 },
    postAvatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    fullImage: { width: '100%', height: '100%' },
    avatarPlaceholder: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },

    postHeaderTextContainer: { flex: 1 },
    postAuthorName: { fontSize: 15, fontWeight: 'bold', color: '#1c1e21', marginBottom: 2 },
    postTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    postTimeLabel: { fontSize: 12, color: '#65676b' },
    moreBtn: { padding: 4 },

    postContentContainer: { paddingHorizontal: 16, paddingBottom: 12 },
    postMainText: { fontSize: 15, color: '#050505', lineHeight: 21 },

    imageGalleryContainer: { marginBottom: 0 },
    singleImage: { width: '100%', height: width * 0.6 },
    galleryImage: { width: width * 0.8, height: width * 0.6, marginLeft: 16 },

    postStats: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
    likeStats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    likeBadge: { backgroundColor: '#1877F2', borderRadius: 10, padding: 3, borderWidth: 1, borderColor: '#fff' },
    commentStats: { flexDirection: 'row', alignItems: 'center' },
    statsText: { fontSize: 13, color: '#65676B' },

    postActions: { flexDirection: 'row', paddingVertical: 4 },
    actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
    actionButtonText: { fontSize: 14, fontWeight: '600', color: '#65676B' }
});
