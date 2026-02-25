import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { Alert } from 'react-native';
import { AttendanceApi, Office } from '@/data/api/attendance.api';
import { LocationService } from '@/core/hardware/location';
import { OfflineQueueService } from '@/data/services/offline-queue';
import { haversine } from '@/utils/geo';
import { useState, useEffect, useCallback } from 'react';


const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export function useCheckIn() {
    const queryClient = useQueryClient();

    // 1. STATE QUẢN LÝ
    const [currentOffice, setCurrentOffice] = useState<Office | null>(null);
    const [isValidLocation, setIsValidLocation] = useState(false);
    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

    // 2. FETCH CONFIG TỪ SERVER (React Query)
    const { data: config } = useQuery({
        queryKey: ['attendanceConfig'],
        queryFn: AttendanceApi.getAttendanceConfig,
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    // 3. LOGIC TỰ ĐỘNG VALIDATE (REACTIVE)
    // Tự động chạy lại mỗi khi:
    // - Có tọa độ người dùng mới (userLocation)
    // - HOẶC Danh sách văn phòng mới tải về xong (config.offices)
    useEffect(() => {
        if (!userLocation || !config?.offices) return;

        let bestOffice: Office | null = null;
        let minDistance = Infinity;

        config.offices.forEach((office) => {
            const distance = haversine(
                userLocation.latitude,
                userLocation.longitude,
                office.lat,
                office.long
            );

            // Kiểm tra bán kính
            if (distance <= office.radius) {
                // Nếu có nhiều văn phòng chồng lấn, lấy cái gần nhất
                if (distance < minDistance) {
                    minDistance = distance;
                    bestOffice = office;
                }
            }
        });

        // Cập nhật State kết quả
        if (bestOffice) {
            setIsValidLocation(true);
            setCurrentOffice(bestOffice);
        } else {
            setIsValidLocation(false);
            setCurrentOffice(null);
        }

    }, [userLocation, config?.offices]); // <--- Dependency Array quan trọng

    // 4. HÀM NHẬN VỊ TRÍ TỪ UI
    // UI chỉ cần ném tọa độ vào đây, useEffect bên trên sẽ lo phần tính toán
    const validateLocation = useCallback((lat: number, long: number) => {
        setUserLocation({ latitude: lat, longitude: long });
    }, []);

    // 5. GỬI API CHẤM CÔNG
    const mutation = useMutation({
        mutationFn: async ({ location, photo }: { location: any, photo: any }) => {
            if (!currentOffice) throw new Error('Vị trí không hợp lệ');

            // Build Payload (Thêm address và office_id để Backend lưu log chi tiết)
            const payload = {
                ...AttendanceApi.createPayload(location, photo),
                address: currentOffice.address,
                office_id: currentOffice.id,
                uuid: generateUUID(), // Dùng hàm tạo 36 ký tự
            };

            // Kiểm tra mạng
            const netStatus = await Network.getNetworkStateAsync();
            if (!netStatus.isConnected || !netStatus.isInternetReachable) {
                await OfflineQueueService.addToQueue(payload);
                throw new Error('OFFLINE_SAVED');
            }

            // Gửi Online
            return await AttendanceApi.checkIn(payload);
        },
        onError: (error: any) => {
            if (error.message === 'OFFLINE_SAVED') {
                Alert.alert('Đã lưu Offline', 'Dữ liệu sẽ tự động gửi khi có mạng.');
            } else {
                Alert.alert('Lỗi chấm công', error.message || 'Vui lòng thử lại');
            }
        },
        onSuccess: () => {
            Alert.alert('Thành công', `Đã chấm công tại: ${currentOffice?.name}`);
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
    });

    return {
        ...mutation,
        offices: config?.offices || [],
        currentOffice,
        isValidLocation,
        userLocation, // Trả về để UI hiển thị debug
        validateLocation
    };
}