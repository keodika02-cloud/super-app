import apiClient from '@/core/api/client';
import * as Crypto from 'expo-crypto';
import { Coordinates } from '@/core/hardware/location';
import { CapturedPhoto } from '@/core/hardware/camera';

export interface Office {
    id: number;
    code: string;
    name: string;
    address: string;
    lat: number;
    long: number;
    radius: number;
}

export interface CheckInPayload {
    uuid: string; // ✅ Idempotency Key
    latitude: number;
    longitude: number;
    accuracy: number;
    photo_base64?: string;
    is_mock: boolean;
    created_at: number; // Timestamp lúc bấm
    device_id?: string;
}

export interface CheckInResponse {
    id: number;
    user_id: number;
    check_in_time: string;
    location: string;
    status: 'success';
}

export const AttendanceApi = {
    /**
     * Get Attendance Config (Allowed Locations & Wifi)
     */
    getAttendanceConfig: async (): Promise<{ offices: Office[] }> => {
        return apiClient.get('/app/hrm/allowed-locations');
    },

    /**
     * Check In
     */
    checkIn: async (payload: CheckInPayload): Promise<CheckInResponse> => {
        return apiClient.post('/app/hrm/check-in', payload);
    },

    /**
     * Check Out
     */
    checkOut: async (payload: CheckInPayload): Promise<CheckInResponse> => {
        return apiClient.post('/app/hrm/check-out', payload);
    },

    /**
     * Helper: Tạo Payload chuẩn
     */
    createPayload: (location: Coordinates, photo: CapturedPhoto | null): CheckInPayload => ({
        uuid: Crypto.randomUUID(), // Tạo ID duy nhất ngay tại Client
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        is_mock: location.is_mock,
        photo_base64: photo?.base64,
        created_at: Date.now(),
    }),
};
