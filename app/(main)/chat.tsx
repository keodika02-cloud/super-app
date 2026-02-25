import React, { useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeScreen } from '../../src/components/layout/SafeScreen';
import { SCREEN_CONFIGS } from '../../src/config/ScreenConfigs';
import { socketService } from '../../src/services/SocketService';
import { useAuthStore } from '../../src/stores/useAuthStore';

export default function ChatScreen() {
    const { user } = useAuthStore();

    useEffect(() => {
        socketService.init();
    }, []);

    const renderItem = ({ item }: { item: any }, refetch: () => void) => {
        const otherParticipant = item.participants?.find((p: any) => p.user.id !== user?.id) || item.participants?.[0];
        const displayName = item.name || otherParticipant?.user.name || 'Hội thoại';
        const avatar = otherParticipant?.user.avatar || null;

        return (
            <TouchableOpacity style={styles.convoItem}>
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
                        <Text style={styles.convoName} numberOfLines={1}>{displayName}</Text>
                        <Text style={styles.convoTime}>{item.last_message_at ? new Date(item.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                    </View>
                    <Text style={styles.lastMsg} numberOfLines={1}>{item.last_message_content || 'Bắt đầu trò chuyện...'}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeScreen config={SCREEN_CONFIGS.CHAT} showScroll={false}>
            {(conversations, isRefreshing, refetch) => (
                <View style={styles.container}>
                    <View style={styles.absoluteActions}>
                        <TouchableOpacity style={styles.newChatBtn}>
                            <Text style={styles.newChatIcon}>📝</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={conversations}
                        renderItem={(props) => renderItem(props, refetch)}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor="#3b82f6" />}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyTxt}>Chưa có hội thoại nào.</Text>
                                <Text style={styles.emptySub}>Hãy bắt đầu trò chuyện với đồng nghiệp.</Text>
                            </View>
                        }
                    />
                </View>
            )}
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    absoluteActions: {
        position: 'absolute',
        top: -55,
        right: 16,
        zIndex: 10,
    },
    newChatBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    newChatIcon: { fontSize: 20 },
    listContent: { paddingHorizontal: 16, paddingBottom: 40 },
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
