import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
    KeyboardAvoidingView, Platform, ActivityIndicator, Image as RNImage, Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChatStore, Message } from '../../src/stores/useChatStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { socketService } from '../../src/services/SocketService';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { ApiClient } from '../../src/services/ApiClient';
import { API_ENDPOINTS } from '../../src/config/api-endpoints';
import { RemoteLogger } from '../../src/services/RemoteLogger';

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const convoId = Number(Array.isArray(id) ? id[0] : id) || 0;

    const { user } = useAuthStore();
    const { activeMessages, fetchMessages, addMessage, isLoadingMessages, updateConversationLatest } = useChatStore();

    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            await sendMediaFile(asset.uri, 'image');
        }
    };

    const sendMediaFile = async (uri: string, type: 'image' | 'file') => {
        setIsSending(true);
        try {
            // Optimistic UI cho ảnh
            const optimisticMsg: Message = {
                id: Date.now(),
                conversation_id: convoId,
                sender_id: user?.id || 0,
                content: uri, // Dùng tạm URI local để hiện ảnh ngay
                type: type,
                created_at: new Date().toISOString()
            };
            addMessage(convoId, optimisticMsg);

            // Upload thực tế
            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const fileType = match ? `image/${match[1]}` : `image`;

            await ApiClient.postSafe(API_ENDPOINTS.CHAT.INTERNAL.SEND_MESSAGE, {
                conversation_id: convoId,
                file: {
                    uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                    name: filename || 'upload.jpg',
                    type: fileType,
                },
                type: type
            });
        } catch (error) {
            console.error('[ChatDetail] Gui media loi:', error);
        } finally {
            setIsSending(false);
        }
    };

    // Khởi tạo fetch data và bind socket pool
    useEffect(() => {
        if (!convoId) return;

        fetchMessages(convoId, 1);

        // Lang nghe phong Real-time riêng cua Hoi thoai
        socketService.listenPrivate(`conversation.${convoId}`, 'MessageSent', (data) => {
            console.log(`[Real-time Convo ${convoId}] Nhan tin nhan:`, data);
            if (data.message && data.message.sender_id !== user?.id) {
                addMessage(convoId, data.message);

                // Bao cho Backend la tui da doc tin nhan nay
                ApiClient.postSafe(API_ENDPOINTS.CHAT.INTERNAL.MARK_READ, { id: convoId });
            }
        });

        // Tu dong Mark as Read khi vao phong
        ApiClient.postSafe(API_ENDPOINTS.CHAT.INTERNAL.MARK_READ, { id: convoId });

    }, [convoId]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const currentText = inputText.trim();
        setInputText(''); // Xóa text ngay de Optimistic UX
        setIsSending(true);

        try {
            // Fake 1 cai tin nhan tren man hinh truoc
            const optimisticMsg: Message = {
                id: Date.now(), // Fake ID
                conversation_id: convoId,
                sender_id: user?.id || 0,
                content: currentText,
                type: 'text',
                created_at: new Date().toISOString()
            };
            addMessage(convoId, optimisticMsg);

            // Goi that xuoong Backend
            const res = await ApiClient.actionSafe(API_ENDPOINTS.CHAT.INTERNAL.SEND_MESSAGE, {
                conversation_id: convoId,
                content: currentText,
                type: 'text'
            });

            if (!res) {
                RemoteLogger.warn(`[ChatDetail] Send message failed (null response) for convo ${convoId}`);
            }
        } catch (error: any) {
            RemoteLogger.error(`[ChatDetail] Send message crash avoided: ${error.message}`);
            console.error('[ChatDetail] Gui loi:', error);
        } finally {
            setIsSending(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.sender_id === user?.id;

        return (
            <View style={[styles.msgRow, isMe ? styles.msgMe : styles.msgThem]}>
                <View style={[styles.msgBubble, isMe ? styles.bubbleMe : styles.bubbleThem, item.type === 'image' && styles.bubbleImage]}>
                    {item.type === 'image' ? (
                        <RNImage
                            source={{ uri: item.content }}
                            style={styles.msgImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={[styles.msgText, isMe ? styles.textMe : styles.textThem]}>
                            {item.content || '...'}
                        </Text>
                    )}
                </View>
                <Text style={styles.msgTime}>
                    {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </Text>
            </View>
        );
    };

    return (
        <ScreenWrapper showOfflineBanner={true}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backIcon}>⬅️</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Hội thoại {convoId ? `#${convoId}` : ''}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {isLoadingMessages && activeMessages.length === 0 ? (
                    <View style={styles.centerLoad}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : (
                    <FlatList
                        data={activeMessages} // Nho la mang nay dang order tu moi nhat tro di neu fetch dung
                        renderItem={renderMessage}
                        keyExtractor={(item) => String(item.id || Math.random())}
                        inverted={true} // Xoay doc danh sach tu duoi len tren (nhu Zalo)
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                <View style={styles.inputArea}>
                    <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                        <Text style={styles.attachIcon}>📷</Text>
                    </TouchableOpacity>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Nhắn tin..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Text style={styles.sendIcon}>🚀</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    centerLoad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        elevation: 2
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    backIcon: { fontSize: 24 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
    listContent: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 16 },
    msgRow: { marginBottom: 12, maxWidth: '80%' },
    msgMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    msgThem: { alignSelf: 'flex-start', alignItems: 'flex-start' },
    msgBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
    bubbleMe: { backgroundColor: '#3b82f6', borderBottomRightRadius: 4 },
    bubbleThem: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
    bubbleImage: { padding: 4, borderRadius: 12 },
    msgImage: { width: 220, height: 160, borderRadius: 10 },
    msgText: { fontSize: 15, lineHeight: 20 },
    textMe: { color: '#fff' },
    textThem: { color: '#1e293b' },
    msgTime: { fontSize: 11, color: '#94a3b8', marginTop: 4, marginHorizontal: 4 },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0'
    },
    attachBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    attachIcon: { fontSize: 22 },
    textInput: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        maxHeight: 120,
        minHeight: 44,
        fontSize: 15,
        marginHorizontal: 8
    },
    sendBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#3b82f6', borderRadius: 22 },
    sendBtnDisabled: { backgroundColor: '#cbd5e1' },
    sendIcon: { fontSize: 20, color: '#fff' }
});
