import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { HardwareService, SafeLocation } from '../../services/HardwareService';

interface GpsBlockProps {
    data: {
        label: string;
        auto_refresh?: boolean;
    };
}

export const GpsBlock: React.FC<GpsBlockProps> = ({ data }) => {
    const [location, setLocation] = useState<SafeLocation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshLocation = async () => {
        setLoading(true);
        setError(null);
        try {
            const loc = await HardwareService.getLocation();
            setLocation(loc);
        } catch (err: any) {
            setError('Không thể xác nhận vị trí. Thử lại?');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Lần đầu mount: chỉ lấy nếu đã có quyền (silently)
        getLocationSilently();
    }, []);

    const getLocationSilently = async () => {
        try {
            const loc = await HardwareService.getLocation(false);
            setLocation(loc);
        } catch { } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>{data.label}</Text>
                {loading && <ActivityIndicator size="small" color="#3b82f6" />}
                {!loading && (
                    <TouchableOpacity onPress={refreshLocation} style={styles.refreshBtn}>
                        <Text style={styles.retryTxt}>🔄 Làm mới</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={[styles.locCard, error ? styles.errorCard : {}]}>
                <Text style={[styles.locTxt, error ? styles.errorTxt : {}]}>
                    📍 {error || (location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 'Đang lấy tọa độ...')}
                </Text>
                {location?.is_mock && !error && (
                    <Text style={styles.mockBadge}>MÔ PHỎNG</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginVertical: 12, paddingHorizontal: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    label: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
    refreshBtn: { padding: 4 },
    retryTxt: { fontSize: 12, color: '#3b82f6', fontWeight: 'bold' },
    locCard: {
        backgroundColor: '#f8fafc',
        height: 60,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    errorCard: { borderColor: '#fee2e2', backgroundColor: '#fef2f2' },
    errorTxt: { color: '#ef4444' },
    locTxt: { fontSize: 14, color: '#334155', fontWeight: '500' },
    mockBadge: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#f59e0b',
        backgroundColor: '#fef3c7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4
    }
});
