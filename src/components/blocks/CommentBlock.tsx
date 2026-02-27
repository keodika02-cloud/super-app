import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../../services/ApiClient';
import { API_ENDPOINTS } from '../../config/api-endpoints';

interface CommentBlockProps {
    data: {
        context_type: string;
        context_id: string | number;
        placeholder?: string;
    };
}

export const CommentBlock: React.FC<CommentBlockProps> = ({ data }) => {
    const [comment, setComment] = useState('');
    const queryClient = useQueryClient();

    // Fetch comments if NEWS_FEED
    const { data: remoteComments = [], isLoading } = useQuery({
        queryKey: ['comments', data.context_type, data.context_id],
        queryFn: async () => {
            if (data.context_type === 'NEWS_FEED') {
                const ep = { ...API_ENDPOINTS.V3.APP.NEWS_FEED_COMMENTS };
                ep.path = ep.path.replace('{id}', String(data.context_id)) as any;
                const res = await ApiClient.fetchSafe(ep, undefined, 'GET');
                return res?.comments || [];
            }
            return [];
        },
        enabled: !!data.context_id && data.context_type === 'NEWS_FEED'
    });

    const mutation = useMutation({
        mutationFn: async (text: string) => {
            if (data.context_type === 'NEWS_FEED') {
                const ep = { ...API_ENDPOINTS.V3.APP.NEWS_FEED_COMMENT_ADD };
                ep.path = ep.path.replace('{id}', String(data.context_id)) as any;
                return ApiClient.fetchSafe(ep, { content: text }, 'POST');
            } else {
                // Sync data khác qua functional sync
                return ApiClient.fetchSafe(API_ENDPOINTS.V3.APP.FUNCTIONAL_SYNC, {
                    context_type: data.context_type,
                    context_id: data.context_id,
                    data: { comment: text }
                }, 'POST');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', data.context_type, data.context_id] });
            queryClient.invalidateQueries({ queryKey: ['news-feed'] });
            setComment('');
        },
        onError: () => {
            Alert.alert('Lỗi', 'Không thể gửi bình luận, vui lòng thử lại.');
        }
    });

    const handleSend = () => {
        if (!comment.trim()) return;
        mutation.mutate(comment.trim());
    };

    return (
        <View style={styles.container}>
            <View style={styles.titleRow}>
                <Text style={styles.title}>Thảo luận trực tuyến</Text>
                <Text style={styles.contextInfo}>{data.context_type} #{data.context_id}</Text>
            </View>

            <View style={styles.list}>
                {isLoading ? (
                    <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                    remoteComments.map((item: any) => (
                        <View key={item.id} style={styles.commentItem}>
                            <View style={styles.avatar}>
                                {item.avatar ? (
                                    <Text style={styles.avatarTxt}>{item.user && item.user.length > 0 ? item.user.charAt(0) : '?'}</Text> // Replace if using real Avatar Image
                                ) : (
                                    <Text style={styles.avatarTxt}>{item.user && item.user.length > 0 ? item.user.charAt(0) : '?'}</Text>
                                )}
                            </View>
                            <View style={styles.bubble}>
                                <Text style={styles.user}>{item.user}</Text>
                                <Text style={styles.text}>{item.text}</Text>
                                <Text style={styles.time}>{item.time}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.inputArea}>
                <TextInput
                    style={styles.input}
                    placeholder={data.placeholder || "Nội dung trao đổi..."}
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    editable={!mutation.isPending}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={mutation.isPending}>
                    {mutation.isPending ? (
                        <ActivityIndicator size="small" color="#3b82f6" />
                    ) : (
                        <Text style={styles.sendIcon}>✈️</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 16, marginVertical: 16 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    title: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    contextInfo: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold' },
    list: { marginBottom: 16 },
    commentItem: { flexDirection: 'row', marginBottom: 12 },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
    avatarTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
    bubble: { flex: 1, marginLeft: 10, backgroundColor: '#f1f5f9', padding: 10, borderRadius: 12 },
    user: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
    text: { fontSize: 14, color: '#334155', marginTop: 2 },
    time: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
    inputArea: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 4 },
    input: { flex: 1, minHeight: 40, paddingVertical: 8, color: '#1e293b' },
    sendBtn: { marginLeft: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    sendIcon: { fontSize: 20 }
});
