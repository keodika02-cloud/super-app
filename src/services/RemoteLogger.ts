/**
 * src/services/RemoteLogger.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Dịch vụ gửi LOG từ App về Backend QVC.
 * Giúp debug từ xa khi App bị trắng màn hoặc crash trên máy người dùng.
 * ──────────────────────────────────────────────────────────────────────────────
 */
import { Platform } from 'react-native';
import { ApiClient } from './ApiClient';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { getDeviceInfo } from '../utils/DeviceMetadata';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

class RemoteLoggerService {
    private isEnabled = true;

    /**
     * Gửi log về server (Fire-and-forget)
     */
    public async log(level: LogLevel, message: string, context: any = {}) {
        if (!this.isEnabled) return;

        const deviceInfo = getDeviceInfo();
        const payload = {
            level,
            message,
            context: {
                ...context,
                device: {
                    model: deviceInfo.model,
                    os: Platform.OS,
                    os_version: Platform.Version,
                    is_emulator: !deviceInfo.is_device,
                },
                timestamp: new Date().toISOString(),
            },
        };

        // Ghi ra console local trước
        const color = level === 'ERROR' || level === 'FATAL' ? '\x1b[31m' : '\x1b[32m';
        console.log(`${color}[RemoteLog:${level}]\x1b[0m ${message}`, context);

        // Gửi về server (Không đợi phản hồi để tránh block UI)
        try {
            ApiClient.fetchSafe(API_ENDPOINTS.V3.APP.LOGS, payload, 'POST').catch(() => {
                // Im lặng nếu gửi log fail để tránh vòng lặp vô tận
            });
        } catch (e) {
            // Safe fallback
        }
    }

    public info(msg: string, ctx?: any) { this.log('INFO', msg, ctx); }
    public warn(msg: string, ctx?: any) { this.log('WARN', msg, ctx); }
    public error(msg: string, ctx?: any) { this.log('ERROR', msg, ctx); }
    public fatal(msg: string, ctx?: any) { this.log('FATAL', msg, ctx); }
}

export const RemoteLogger = new RemoteLoggerService();
