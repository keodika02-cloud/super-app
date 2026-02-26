import { create } from 'zustand';
import { ApiClient } from '../services/ApiClient';
import { API_ENDPOINTS } from '../config/api-endpoints';

export interface UserInfo {
    id: number;
    name: string;
    avatar: string | null;
    role: string;
    status: string;
}

interface UserState {
    users: UserInfo[];
    isLoadingUsers: boolean;
    fetchAllUsers: () => Promise<void>;
    searchUsers: (query: string) => Promise<UserInfo[]>;
}

export const useUserStore = create<UserState>((set) => ({
    users: [],
    isLoadingUsers: false,

    fetchAllUsers: async () => {
        set({ isLoadingUsers: true });
        try {
            const res = await ApiClient.fetchSafe(API_ENDPOINTS.CHAT.INTERNAL.USERS_ALL) as any;
            const list = Array.isArray(res) ? res : (res?.data || []);
            set({ users: list });
        } catch (error) {
            console.error('[UserStore] Fetch users error:', error);
        } finally {
            set({ isLoadingUsers: false });
        }
    },

    searchUsers: async (query: string) => {
        if (!query.trim()) return [];
        try {
            const res = await ApiClient.fetchSafe(API_ENDPOINTS.CHAT.INTERNAL.USERS_SEARCH, { q: query }) as any;
            return Array.isArray(res) ? res : (res?.data || []);
        } catch (error) {
            console.error('[UserStore] Search users error:', error);
            return [];
        }
    }
}));
