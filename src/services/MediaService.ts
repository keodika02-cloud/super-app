/**
 * src/services/MediaService.ts
 * SINGLE RESPONSIBILITY: Mọi thao tác file/ảnh đi qua đây.
 *
 * Tái sử dụng cho: Chấm công ảnh, Chat (sau này), Đơn từ, Avatar, Báo cáo
 *
 * HardwareGuard:
 *   - Simulator → không crash, trả placeholder hoặc null
 *   - Thiếu quyền → throw lỗi tường minh với hướng dẫn mở cài đặt
 */
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as Device from 'expo-device';
import { Alert, Platform, InteractionManager } from 'react-native';
import { ApiClient } from './ApiClient';
import { Env } from '../config/env';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MediaResult {
    uri: string;
    type: string;      // 'image/jpeg', 'application/pdf'...
    name: string;
    size?: number;
}

export interface UploadResult {
    file_id: number;
    url: string;
    thumbnail_url?: string;
    original_name: string;
    mime_type: string;
    size_kb: number;
}

// Mock Image (1x1 black pixel) từ backup/useSafeHardware
const MOCK_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// ─── Chọn ảnh từ thư viện ────────────────────────────────────────────────────

async function pickImage(): Promise<MediaResult | null> {
    try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Cần quyền truy cập ảnh',
                'Vui lòng cấp quyền Thư viện ảnh trong Cài đặt để tiếp tục.',
                [{ text: 'OK' }],
            );
            return null;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (result.canceled || !result.assets[0]) return null;

        const asset = result.assets[0];
        return {
            uri: asset.uri,
            type: asset.mimeType ?? 'image/jpeg',
            name: asset.fileName ?? `photo_${Date.now()}.jpg`,
            size: asset.fileSize,
        };
    } catch (err) {
        console.error('[MediaService] pickImage lỗi:', err);
        return null;
    }
}

// ─── Chụp ảnh bằng camera ────────────────────────────────────────────────────

async function capturePhoto(): Promise<MediaResult | null> {
    const shouldUseMock = !Device.isDevice || Env.EXPO_PUBLIC_USE_MOCK;

    // [HARDENING]: Simulator / Dev MOCK không có camera thật
    if (shouldUseMock) {
        console.warn(`[MediaService] Cảnh báo: Sử dụng Camera Mock. (Device: ${Device.isDevice}, MOCK_FLAG: ${Env.EXPO_PUBLIC_USE_MOCK})`);
        return {
            uri: MOCK_IMAGE_BASE64,
            type: 'image/png',
            name: `mock_capture_${Date.now()}.png`,
            size: 1024,
        };
    }

    try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Cần quyền Camera',
                'Vui lòng cấp quyền Camera trong Cài đặt để tiếp tục.',
                [{ text: 'OK' }],
            );
            return null;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.8,
        });

        if (result.canceled || !result.assets[0]) return null;

        const asset = result.assets[0];
        return {
            uri: asset.uri,
            type: asset.mimeType ?? 'image/jpeg',
            name: asset.fileName ?? `capture_${Date.now()}.jpg`,
            size: asset.fileSize,
        };
    } catch (err) {
        console.error('[MediaService] capturePhoto lỗi:', err);
        return null;
    }
}

// ─── Nén ảnh trước khi upload ────────────────────────────────────────────────

async function compressImage(uri: string, quality = 0.7): Promise<string> {
    try {
        // [HARDENING]: Dùng InteractionManager để tránh drop frame UI khi xử lý nén ảnh nặng
        return await new Promise<string>((resolve, reject) => {
            InteractionManager.runAfterInteractions(async () => {
                try {
                    const result = await ImageManipulator.manipulateAsync(
                        uri,
                        [{ resize: { width: 1024 } }],
                        { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
                    );
                    resolve(result.uri);
                } catch (e) {
                    reject(e);
                }
            });
        });
    } catch (err) {
        console.error('[MediaService] compressImage lỗi, dùng ảnh gốc:', err);
        return uri; // Fallback về ảnh gốc
    }
}

// ─── Chọn file tài liệu (PDF, Word...) ───────────────────────────────────────

async function pickDocument(types?: string[]): Promise<MediaResult | null> {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: types ?? ['application/pdf', 'application/msword', '*/*'],
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets[0]) return null;

        const asset = result.assets[0];
        return {
            uri: asset.uri,
            type: asset.mimeType ?? 'application/octet-stream',
            name: asset.name,
            size: asset.size,
        };
    } catch (err) {
        console.error('[MediaService] pickDocument lỗi:', err);
        return null;
    }
}

// ─── Upload file lên server ───────────────────────────────────────────────────

async function uploadFile(
    media: MediaResult,
    folder: 'avatars' | 'reports' | 'checkins' | 'attachments' = 'attachments',
    onProgress?: (percent: number) => void,
): Promise<UploadResult> {
    // Nén ảnh nếu là image
    const isImage = media.type.startsWith('image/');
    const uri = isImage ? await compressImage(media.uri) : media.uri;

    const formData = new FormData();
    // React Native FormData không dùng Blob – dùng object đặc biệt
    formData.append('file', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        type: media.type,
        name: media.name,
    } as any);
    formData.append('folder', folder);

    // [HARDENING]: Dùng progress thật từ Axios (đã được bọc trong ApiClient v2)
    const result = await ApiClient.uploadFormData<UploadResult>(
        '/v2/media/upload',
        formData,
        120000,
        onProgress // Truyền callback xuống tận Axios
    );

    return result;
}

// ─── Lấy kích thước file ─────────────────────────────────────────────────────

async function getFileSize(uri: string): Promise<number> {
    try {
        const info = await FileSystem.getInfoAsync(uri);
        return info.exists ? (info as any).size ?? 0 : 0;
    } catch {
        return 0;
    }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const MediaService = {
    pickImage,
    capturePhoto,
    compressImage,
    pickDocument,
    uploadFile,
    getFileSize,
};
