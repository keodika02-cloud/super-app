import React, { useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { socketService } from '../../src/services/SocketService';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useChatStore } from '../../src/stores/useChatStore';
import { router } from 'expo-router';

export default function ChatScreen() {
    const { user } = useAuthStore();
    const { conversations, isLoadingConvos, fetchConversations, updateConversationLatest } = useChatStore();

    useEffect(() => {
        socketService.init();
        fetchConversations(); // Lấy data khi vừa vô màn hình

        // Listen Real-time global cho User hiện tại (Tất cả tin nhắn nhắm đến user này)
        if (user?.id) {
            socketService.listenPrivate(`App.Models.User.${user.id}`, 'MessageSent', (data) => {
                console.log('[Real-time] Vừa nhận tin nhắn mới:', data);
                if (data.message) {
                    // Update preview ở tab Hội thoại
                    updateConversationLatest(
                        data.message.conversation_id,
                        data.message.content,
                        data.message.created_at,
                        true
                    );
                }
            });
        }

    }, [user?.id]);

    const onRefresh = useCallback(() => {
        fetchConversations(true);
    }, []);

    const renderItem = ({ item }: { item: any }) => {
        const otherParticipant = item.participants?.find((p: any) => p.user?.id !== user?.id) || item.participants?.[0];
        const displayName = item.name || otherParticipant?.user?.name || 'Hội thoại';
        const avatar = otherParticipant?.user?.avatar || null;

        return (
            <TouchableOpacity
                style={styles.convoItem}
                onPress={() => router.push(`/chat/${item.id}`)}
            >
                <View style={styles.avatarWrapper}>
                    {avatar ? (
                        <Image source={{ uri: avatar }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarTxt}>{displayName.charAt(0)}</Text>
                        </View>
                    )}
                    <View style={styles.onlineBadge} />
                </View>

                <View style={styles.convoBody}>
                    <View style={styles.convoHeader}>
                        <Text style={styles.convoName} numberOfLines={1}>{displayName || 'Hội thoại'}</Text>
                        <Text style={styles.convoTime}>{item.last_message_at ? new Date(item.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                    </View>
                    <Text style={styles.lastMsg} numberOfLines={1}>{item.last_message_content || 'Bắt đầu trò chuyện...'}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper showOfflineBanner={true}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Hội thoại nội bộ</Text>
                    <TouchableOpacity
                        style={styles.newChatBtn}
                        onPress={() => router.push('/chat/create')}
                    >
                        <Text style={styles.newChatIcon}>📝</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={conversations}
                    renderItem={renderItem}
                    keyExtractor={(item) => String(item.id || Math.random())}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={isLoadingConvos} onRefresh={onRefresh} tintColor="#3b82f6" />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTxt}>Chưa có hội thoại nào</Text>
                            <Text style={styles.emptySub}>Hãy bắt đầu trò chuyện với đồng nghiệp.</Text>
                        </View>
                    }
                />
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: '#f8fafc',
    },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
    newChatBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        elevation: 4,
    },
    newChatIcon: { fontSize: 16, color: '#fff' },
    listContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 },
    convoItem: {
        flexDirection: 'row',
        paddingVertical: 12,
        marginBottom: 8,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 16,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    avatarWrapper: { position: 'relative' },
    avatar: { width: 56, height: 56, borderRadius: 28 },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center'
    },
    avatarTxt: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: '#fff'
    },
    convoBody: { flex: 1, marginLeft: 12 },
    convoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    convoName: { fontSize: 17, fontWeight: '700', color: '#1e293b', flex: 1 },
    convoTime: { fontSize: 12, color: '#64748b' },
    lastMsg: { fontSize: 14, color: '#64748b', lineHeight: 20 },
    emptyState: { marginTop: 100, alignItems: 'center', justifyContent: 'center' },
    emptyTxt: { fontSize: 18, fontWeight: '600', color: '#64748b' },
    emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 4 }
});
