# Hướng dẫn Build và Test App QVC 2026 (Expo Framework)

Dự án này sử dụng Expo Framework. Dưới đây là quy trình thao tác từ môi trường lập trình viên cho đến khi xuất xưởng ra Public Store.

## 1. Test trên điện thoại thực tế với Expo Go
Cách nhanh nhất để test app trên máy thật trong nội bộ network.

**Các bước:**
1. Đảm bảo máy tính và điện thoại **cùng kết nối chung một mạng Wifi**.
2. Cài đặt ứng dụng **Expo Go** trên điện thoại (Từ App Store trên iOS hoặc Google Play trên Android).
3. Mở Terminal tại thư mục gốc của dự án (`appqvc2026`).
4. Chạy lệnh:
   ```bash
   npm start
   ```
   Hoặc `npx expo start`
5. Terminal sẽ in ra một mã **QR Code**.
6. **Trên iOS**: Mở ứng dụng Camera mặc định, quét mã QR và bấm vào thông báo màu vàng để mở trên Expo Go.
   **Trên Android**: Mở ứng dụng Expo Go, chọn "Scan QR Code" và quét mã trên terminal.
7. Khi có thay đổi code, app sẽ tự động Reload (Fast Refresh).

> [!WARNING]
> Nếu Expo Go không kết nối được, bấm `Shift + c` trong terminal để xóa cache, rồi thử đổi cổng mạng sang Tunnel bằng cách chạy `npx expo start --tunnel`.
> 
> **Lưu ý SDK 53:** Từ phiên bản SDK 53, Expo Go không còn hỗ trợ nhận thông báo đẩy (Push Notifications) trên Android. Bạn cần build **Development Client** (`eas build --profile development`) để test thông báo.

---

## 2. Build Ứng dụng Web (SPA Mode)
Dự án có thể chạy trực tiếp trên nền web độc lập.

**Test Web Cục bộ:**
```bash
npm run web
```
Lệnh này sẽ mở trình duyệt và chạy app y hệt localhost.

**Build ra Static Bundle dùng để đưa lên Server (Nginx/Apache/Vercel):**
```bash
npx expo export -p web
```
Sau khi chạy, thư mục `dist` sẽ được sinh ra. Bạn có thể copy thư mục `dist` này lên bất cứ host web nào.

---

## 3. Build & Triển khai bằng EAS (Expo Application Services)
Dự án được cấu hình sử dụng công cụ cloud build của Expo là EAS.

### Chuẩn bị môi trường EAS
1. Cài đặt CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Đăng nhập vào tài khoản Expo:
   ```bash
   eas login
   ```

### 3.1. Build cho Android
**Tạo file APK (để test nội bộ / gửi file cho nhân viên):**
```bash
eas build --platform android --profile preview
```
- Quá trình build sẽ chạy trên Cloud của Expo. 
- Sau khoảng 5-10 phút, bạn sẽ nhận được một đường link để tải file `.apk` về cài đặt thủ công.

**Tạo file AAB (để đưa lên Google Play Store):**
```bash
eas build --platform android --profile production
```
- Khi được hỏi tạo Keystore, chọn tự động tạo.
- Tải file `.aab` được cấu hình production và tải lên Google Play Console.

### 3.2. Build cho iOS
Việc build iOS phức tạp hơn do yêu cầu chứng chỉ từ Apple. Bạn cần phải có tài khoản Apple Developer (99$/năm).

**Tạo bản build để test nội bộ (AdHoc):**
```bash
eas build --platform ios --profile preview
```
- Bạn sẽ được yêu cầu đăng nhập tài khoản Apple Developer.
- EAS sẽ tự động tạo Certificate và Provisioning Profile.
- Bạn phải đăng ký UUID của các thiết bị iPhone/iPad muốn cho phép cài đặt nội bộ.

**Tạo bản build để đưa lên TestFlight / App Store:**
```bash
eas build --platform ios --profile production
```
- EAS tự động cấp phát profile cho Production.
- Tệp IPA sẽ được tạo. Bạn có thể push thẳng lên App Store Connect bằng lệnh: `eas submit -p ios`

---

## Tóm tắt các Profile Build (trong file eas.json)

- `development`: Build Development Client (dùng để test các thư viện native mà Expo Go không hỗ trợ).
- `preview`: Build ứng dụng ở chế độ Release (nhanh hơn dev) nhưng phục vụ test nội bộ (APK hoặc AdHoc).
- `production`: Cấu hình hoàn chỉnh, tối ưu dung lượng, sẵn sàng submit lên kho ứng dụng chính thức.
