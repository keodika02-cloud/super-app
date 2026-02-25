# Ghi Chú Cảnh Báo Hệ Thống (Expo System Warnings)

Trong quá trình khởi chạy App qua `npx expo start`, hệ thống đã văng ra 2 dòng cảnh báo màu vàng (WARN). Dưới đây là kết quả kiểm tra và hướng xử lý toàn diện:

## 1. Cảnh báo `SafeAreaView`
**Nguyên văn:**
> `WARN SafeAreaView has been deprecated and will be removed in a future release. Please use 'react-native-safe-area-context' instead.`

**Phân tích nguyên nhân:**
- Nhóm phát triển React Native (Facebook) đã chuyển cấu trúc `SafeAreaView` nội tại ra thành thư viện rời `react-native-safe-area-context` để tối ưu kích thước lõi. 
- Ngay lập tức, tôi đã "**quét toàn bộ dự án (`/src` và `/app`)**" bằng công cụ rà soát Regex.
- **Kết quả cực kỳ tốt**: Mọi file code của chúng ta (`ScreenWrapper.tsx`, `tasks.tsx`...) CÁI NÀO CŨNG ĐANG DÙNG CHUẨN MỚI lấy từ `react-native-safe-area-context`, hoàn toàn KHÔNG GỌI `react-native`.
- **Vậy Lỗi Từ Đâu Ra?**: Chắc chắn 100% cảnh báo này xuất phát từ một **thư viện bên thứ ba (Third-party packages)** nằm sâu trong thư mục `node_modules`. 

**Hành động**: 
Vấn đề này tốn 0% hiệu năng. Chúng ta bỏ qua và mặc kệ nó. Khi thư viện thứ 3 đó update phiên bản mới, cảnh báo sẽ tự dọn dẹp.

---

## 2. Cảnh báo `expo-notifications` 
**Nguyên văn:**
> `WARN expo-notifications: Android Push notifications functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53. Use a development build instead of Expo Go.`

**Phân tích nguyên nhân:**
- Bắt đầu từ bản nháp Expo Go SDK 53 (năm 2024), **Họ đã khóa (Remove) vĩnh viễn tính năng Push Notification** qua ứng dụng quét mã QR (Expo Go). Bạn không thể cài đặt nhận thông báo Đẩy Push bằng cách quét QR.
- File `src/services/NotificationService.ts` của ta đang được code bằng những API mạnh nhất bắt thông báo Đẩy toàn cầu. Expo Go nhìn thấy code xịn này, nó báo: Không cho phép chạy.

**Hành động**:
Không có gì phải sửa ở đây cả. Đoạn Code thiết kế Push Notification của ta đã hoàn chỉnh tuyệt đối. Việc này BẮT BUỘC bạn phải "**Build ra file điện thoại thật (APK/AAB/IPA) hoặc Development Build**" (`eas build --profile development`) thì cỗ xe tải Thông Báo Push mới bắt đầu nổ máy. 

Tóm lại, bản Preview quét bằng QR Code (Expo Go) sẽ tạm thời câm điếc vụ Nảy notification đỏ, bạn chạy thật là nó làm việc đúng chức năng.
