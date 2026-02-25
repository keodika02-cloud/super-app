import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../../../src/services/ApiClient';
import { API_ENDPOINTS } from '../../../src/config/api-endpoints';
import { safeArray, safeStr } from '../../../src/utils/safe';

const { width } = Dimensions.get('window');

export const SocialFeedBlock = ({ data }: { data: any }) => {
    const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({});

    // Cố gắng gọi API, nếu fail thì UI sẽ im lặng vì đã có fallback hoặc ErrorBoundary lo
    const { data: realFeed, refetch } = useQuery({
        queryKey: ['news-feed'],
        queryFn: async () => {
            const res = await ApiClient.fetchSafe(API_ENDPOINTS.V3.APP.NEWS_FEED, {});
            return res.posts || [];
        },
        staleTime: 1000 * 60, // 1 phút
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // @ts-ignore
            window.newsFeedRefetch = refetch;
        }
    }, [refetch]);

    const toggleLike = (idx: number) => {
        setLikedPosts(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    // Hyrid Data: Ưu tiên realFeed từ API, nếu chưa có thì dùng data truyền từ SDUI (có thể là mock)
    const postsToRender = realFeed && realFeed.length > 0 ? realFeed : safeArray(data.posts);

    if (postsToRender.length === 0) return null;

    return (
        <View style={styles.socialFeedContainer}>
            {postsToRender.map((post: any, idx: number) => (
                <View key={idx} style={styles.postCard}>
                    <View style={styles.postHeader}>
                        <View style={styles.postAvatar}>
                            {post.avatar ? (
                                <Image source={{ uri: post.avatar }} style={styles.avatarImg} />
                            ) : (
                                <Text style={styles.avatarPlaceholder}>👤</Text>
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.postAuthor}>{safeStr(post.author)}</Text>
                            <Text style={styles.postTime}>{safeStr(post.timestamp || 'Vừa xong')} • 🌐</Text>
                        </View>
                        <TouchableOpacity><Text style={{ color: '#94a3b8', fontSize: 20 }}>•••</Text></TouchableOpacity>
                    </View>

                    <Text style={styles.postContent}>{safeStr(post.content)}</Text>

                    {safeArray(post.images).length > 0 && (
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
                        <Text style={styles.statsText}>👍 {likedPosts[idx] ? (post.likes || 0) + 1 : (post.likes || 0)}</Text>
                        <Text style={styles.statsText}>{post.comments || 0} bình luận</Text>
                    </View>

                    <View style={styles.postActions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(idx)}>
                            <Text style={[styles.actionText, likedPosts[idx] && { color: '#3b82f6' }]}>
                                {likedPosts[idx] ? '💙 Đã thích' : '👍 Thích'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Text style={styles.actionText}>💬 Bình luận</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Text style={styles.actionText}>🔗 Chia sẻ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    socialFeedContainer: { gap: 12 },
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
