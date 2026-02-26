/**
 * src/services/SocketService.ts
 * Quản lý kết nối WebSocket tới Laravel Reverb (Chat System).
 */
import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';
import { Env } from '../config/env';
import { StorageService } from './StorageService';

// Cần gán Pusher cho window để Echo tìm thấy trong môi trường React Native if needed
// Khai báo global an toàn cho React Native
if (typeof global !== 'undefined') {
    (global as any).Pusher = Pusher;
}
if (typeof window !== 'undefined') {
    (window as any).Pusher = Pusher;
}

class SocketService {
    private echo: Echo<any> | null = null;
    private isInitialized = false;

    /**
     * Khởi tạo kết nối Echo
     */
    async init() {
        if (this.isInitialized) return;

        const token = await StorageService.getToken();
        if (!token) {
            console.warn('[SocketService] Chưa có token, trì hoãn kết nối.');
            return;
        }

        try {
            this.echo = new Echo({
                broadcaster: 'reverb',
                key: Env.EXPO_PUBLIC_CHAT_REVERB_KEY,
                wsHost: Env.EXPO_PUBLIC_CHAT_SOCKET_URL,
                wsPort: Env.EXPO_PUBLIC_CHAT_REVERB_PORT,
                wssPort: Env.EXPO_PUBLIC_CHAT_REVERB_PORT,
                forceTLS: Env.EXPO_PUBLIC_CHAT_REVERB_SCHEME === 'https',
                enabledTransports: ['ws', 'wss'],
                authEndpoint: `${Env.EXPO_PUBLIC_CHAT_API_URL}/broadcasting/auth`,
                auth: {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                },
            });

            this.isInitialized = true;
            console.info('[SocketService] Laravel Echo (Reverb) initialized.');

            // Lắng nghe các event chung toàn hệ thống
            this.echo.connector.pusher.connection.bind('state_change', (states: any) => {
                console.info(`[SocketService] Connection state: ${states.current}`);
            });

        } catch (error) {
            console.error('[SocketService] Init error:', error);
        }
    }

    /**
     * Lắng nghe một channel
     */
    listen(channelName: string, eventName: string, callback: (data: any) => void) {
        if (!this.echo) return;

        // Private channel tự động thêm prefix if needed (Echo handles it)
        this.echo.channel(channelName).listen(eventName, callback);
    }

    /**
     * Lắng nghe private channel
     */
    listenPrivate(channelName: string, eventName: string, callback: (data: any) => void) {
        if (!this.echo) return;
        this.echo.private(channelName).listen(eventName, callback);
    }

    /**
     * Ngắt kết nối
     */
    disconnect() {
        if (this.echo) {
            this.echo.disconnect();
            this.isInitialized = false;
            this.echo = null;
        }
    }

    /**
     * Trả về instance echo để gọi các hàm nâng cao
     */
    getEcho() {
        return this.echo;
    }
}

export const socketService = new SocketService();
