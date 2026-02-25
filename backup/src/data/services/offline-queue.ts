import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckInPayload } from '@/data/api/attendance.api';

const QUEUE_KEY = 'hrm_offline_queue';

export const OfflineQueueService = {
    /**
     * Thêm request vào hàng đợi
     */
    async addToQueue(payload: CheckInPayload): Promise<void> {
        try {
            // 1. Lấy hàng đợi hiện tại
            const currentQueueRaw = await AsyncStorage.getItem(QUEUE_KEY);
            const currentQueue: CheckInPayload[] = currentQueueRaw
                ? JSON.parse(currentQueueRaw)
                : [];

            // 2. Thêm mới (Tránh trùng lặp UUID)
            const exists = currentQueue.some(item => item.uuid === payload.uuid);
            if (!exists) {
                currentQueue.push(payload);

                // 3. Lưu lại
                await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(currentQueue));
                console.log(`📦 [OfflineQueue] Saved item ${payload.uuid}. Total: ${currentQueue.length}`);
            }
        } catch (error) {
            console.error('Failed to save offline queue:', error);
        }
    },

    /**
     * Lấy và xóa hàng đợi (để sync)
     */
    async popQueue(): Promise<CheckInPayload[]> {
        try {
            const currentQueueRaw = await AsyncStorage.getItem(QUEUE_KEY);
            if (!currentQueueRaw) return [];

            const queue = JSON.parse(currentQueueRaw);

            // Clear queue sau khi lấy
            await AsyncStorage.removeItem(QUEUE_KEY);
            return queue;
        } catch (error) {
            console.error('Failed to pop offline queue:', error);
            return [];
        }
    },

    /**
     * Đếm số lượng pending
     */
    async getCount(): Promise<number> {
        try {
            const currentQueueRaw = await AsyncStorage.getItem(QUEUE_KEY);
            return currentQueueRaw ? JSON.parse(currentQueueRaw).length : 0;
        } catch (error) {
            return 0;
        }
    },
};
