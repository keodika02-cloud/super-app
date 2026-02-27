# Audit Hệ Thống QVC Mobile V3 - Checklist Toàn Diện

Bản báo cáo này tổng hợp trạng thái thực tế của Backend và Frontend, cấu trúc dữ liệu và các tính năng điều khiển.

## 1. BACKEND (Laravel V3 Standard)
Các API được thiết kế theo tiêu chuẩn `AppV3Response`, đảm bảo 100% không crash và có lỗi trả về chuẩn JSON.

### A. Controllers Điều khiển (Sdui & Config)
| File Name | Tính Năng | Trạng Thái |
| :--- | :--- | :--- |
| `AppConfigController.php` | Cung cấp Bootstrap (Version, Maintenance) & Global Config (GPS Radius, Theme). | ✅ Hoạt động |
| `Admin/AppScreenController.php` | Quản lý Layout của từng màn hình (`screen_slug`). | ✅ Hoạt động |
| `Admin/AppMenuItemController.php` | Điều khiển menu Grid, tùy chỉnh màu sắc, icon, hành động từ xa. | ✅ Hoạt động |
| `Admin/AppFullConfigController.php`| Công cụ đồng bộ (Sync) giữa Database và file vật lý JSON. | ✅ Hoạt động |

### B. Controllers Nghiệp vụ (Data)
| File Name | Tính Năng | Trạng Thái |
| :--- | :--- | :--- |
| `AppAttendanceController.php` | Xử lý Chấm công, nhận diện GPS Giả (Mock), lưu trữ ảnh minh chứng. | ✅ Hoạt động |
| `AppNewsFeedController.php` | Trả về bảng tin nội bộ, tích hợp Like/Comment. | ✅ Hoạt động |
| `AppNotificationController.php` | Quản lý thông báo đẩy (Push) và trạng thái Đã đọc. | ✅ Hoạt động |

---

## 2. FRONTEND (Expo Router & SDUI Engine)
Cấu trúc Modular, tách biệt logic phần cứng và giao diện điều khiển từ Server.

### A. Lõi Hệ Thống (Core & Services)
| Đường dẫn / File | Vai Trò Thực Dụng |
| :--- | :--- |
| `src/services/ApiClient.ts` | **Xương sống**: Tự động bắt lỗi, validate dữ liệu qua Zod trước khi nạp vào giao diện. |
| `src/services/HardwareService.ts`| **Bảo vệ**: Điều phối Camera, GPS, Biometrics. Tự động fallback nếu thiếu quyền. |
| `src/hooks/useHybridData.ts` | **Anti-Crash**: Ưu tiên Cache -> Gọi API -> Fallback cứng (nếu mất mạng hoàn toàn). |
| `src/components/blocks/SduiEngine.tsx`| **Bộ não**: Đọc JSON từ Backend và render ra các Block tương ứng. |

### B. Danh sách Blocks (UI Components)
Cấu trúc nhận diện từ Backend:
- `ImageBlock`: Banner ảnh (`url`, `aspect_ratio`).
- `GridMenuBlock`: Các nút chức năng nhanh (`items`, `bg_color`).
- `BannerBlock`: Thông báo quan trọng (`title`, `action`).
- `GpsBlock`: Card tọa độ (`label`, `auto_refresh`).
- `CameraBlock`: Nút chụp ảnh (`action_context`).
- `UploadBlock`: Chọn tệp PDF/JPG (`max_size_mb`).

---

## 3. CẤU TRÚC DỮ LIỆU GỬI / NHẬN (Contracts)

### A. Layout Request (App -> Backend)
- **Method**: `GET`
- **Path**: `/api/v3/app/ui-layout?screen_slug=goto_home`
- **Response**: Mảng các Blocks chuẩn SDUI.

### B. Chấm công Submission (App -> Backend)
- **Method**: `POST`
- **Path**: `/api/v3/app/checkin`
- **Payload**:
  - `latitude / longitude`: Tọa độ thực từ cảm biến.
  - `is_mock`: `boolean` (0/1) - App tự phát hiện nếu user dùng app Fake GPS.
  - `photo`: File ảnh (Multipart).
  - `uuid`: Mã định danh duy nhất của lượt chấm công (tránh gửi trùng).

---

## 4. CÁC ĐIỂM CẦN LƯU Ý (Audit Notes)
1. **GPS Mocking**: Đã fix trong file `.env`. Hiện tại `EXPO_PUBLIC_USE_MOCK=false`, App sẽ ưu tiên lấy tọa độ từ vệ tinh thật.
2. **Offline Data**: Mọi màn hình SDUI đều được lưu vào `AsyncStorage`. Khi không có mạng, App vẫn hiện giao diện cũ (Last Good State).
3. **An Toàn Dữ Liệu**: Mọi phản hồi từ Backend đều đi qua bộ lọc **Zod Schema** tại `src/config/api-endpoints.ts`. Nếu Backend trả dữ liệu sai cấu trúc, App sẽ hiện dữ liệu Fallback thay vì bị Crash màn hình trắng.
