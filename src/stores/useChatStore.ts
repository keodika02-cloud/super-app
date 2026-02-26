import { create } from 'zustand';
import { ApiClient } from '../services/ApiClient';
import { API_ENDPOINTS } from '../config/api-endpoints';

export interface Message {
    id: number;
    conversation_id: number;
    sender_id: number;
    content: string;
    type: 'text' | 'image' | 'file';
    created_at: string;
    is_read?: boolean;
}

export interface Conversation {
    id: number;
    name: string | null;
    is_group: boolean;
    last_message_content: string | null;
    last_message_at: string | null;
    unread_count: number;
    participants: any[];
}

interface ChatState {
    conversations: Conversation[];
    activeMessages: Message[];
    isLoadingConvos: boolean;
    isLoadingMessages: boolean;

    // Actions
    fetchConversations: (forceConfig?: boolean) => Promise<void>;
    fetchMessages: (convoId: number, page?: number) => Promise<void>;
    addMessage: (convoId: number, msg: Message) => void;
    updateConversationLatest: (convoId: number, content: string, time: string, isUnread?: boolean) => void;
    createConversation: (params: { name?: string, type: 'individual' | 'group', user_ids: number[] }) => Promise<Conversation | null>;
}

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    activeMessages: [],
    isLoadingConvos: false,
    isLoadingMessages: false,

    fetchConversations: async (forceConfig = false) => {
        set({ isLoadingConvos: true });
        try {
            const res = await ApiClient.fetchSafe(API_ENDPOINTS.CHAT.INTERNAL.CONVERSATIONS) as any;
            // Có thể res là mảng luôn hoặc { data: [] }
            const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
            set({ conversations: list });
        } catch (error) {
            console.error('[ChatStore] Fetch convos err:', error);
        } finally {
            set({ isLoadingConvos: false });
        }
    },

    fetchMessages: async (convoId: number, page = 1) => {
        set({ isLoadingMessages: true });
        try {
            const res = await ApiClient.fetchSafe(API_ENDPOINTS.CHAT.INTERNAL.MESSAGES, { conversation_id: convoId, page }) as any;

            // Xử lý list (Backend trả về mảng hoặc { data: [] })
            const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);

            if (page === 1) {
                set({ activeMessages: list }); // Replace nếu ở trang 1
            } else {
                set((state) => ({ activeMessages: [...state.activeMessages, ...list] })); // Append nếu load page > 1
            }
        } catch (error) {
            console.error('[ChatStore] Fetch messages err:', error);
        } finally {
            set({ isLoadingMessages: false });
        }
    },

    addMessage: (convoId, msg) => {
        set((state) => {
            // Nếu tin nhắn thuộc về phòng đang mở thì nhét vô mảng
            const newActiveMsgs = msg.conversation_id === convoId
                ? [msg, ...state.activeMessages] // Lưu ý FlatList Inverted => đẩy lên đầu
                : state.activeMessages;

            return { activeMessages: newActiveMsgs };
        });

        // Cập nhật preview ở màn hình ngoài
        get().updateConversationLatest(convoId, msg.content, msg.created_at, true);
    },

    updateConversationLatest: (convoId, content, time, isUnread = false) => {
        set((state) => {
            const newList = state.conversations.map(c => {
                if (c.id === convoId) {
                    return {
                        ...c,
                        last_message_content: content,
                        last_message_at: time,
                        unread_count: isUnread ? c.unread_count + 1 : c.unread_count
                    };
                }
                return c;
            });
            newList.sort((a, b) => {
                const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                return timeB - timeA;
            });
            return { conversations: newList };
        });
    },

    createConversation: async (params) => {
        try {
            const res = await ApiClient.postSafe(API_ENDPOINTS.CHAT.INTERNAL.CREATE_CONVERSATION, params) as any;
            const newConvo = res?.data || res;
            if (newConvo && newConvo.id) {
                set((state) => ({ conversations: [newConvo, ...state.conversations] }));
                return newConvo;
            }
            return null;
        } catch (error) {
            console.error('[ChatStore] Create conversation error:', error);
            return null;
        }
    }
}));
