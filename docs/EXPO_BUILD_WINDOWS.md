# Build Expo App trên Windows – Kinh nghiệm & Tránh Lỗi

## Setup ban đầu (1 lần duy nhất)

```powershell
# Cài Node.js LTS từ nodejs.org (không dùng winget, hay bị path lỗi)
# Sau khi cài, kiểm tra:
node -v   # phải >= 18.x
npm -v    # phải >= 9.x

# Cài EAS CLI toàn cục
npm install -g eas-cli expo-cli

# Nếu lỗi "execution policy" trên PowerShell:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## Khởi tạo project (Dùng khi tạo mới)

```powershell
# Tạo project mới (dùng --template để tránh interactive prompt)
npx create-expo-app@latest . --template blank-typescript

# KHÔNG dùng: npx create-expo-app@latest --template default@sdk-53
# VÌ: sdk-53 là tên alias, dễ bị fallback về phiên bản sai trên Windows
```

---

## Cài dependencies – Quy trình đúng

### Bước 1: Native modules – dùng `expo install` trước
```powershell
# Expo install tự chọn phiên bản compatible với SDK hiện tại
npx expo install expo-camera expo-location expo-device expo-crypto expo-network
npx expo install expo-secure-store expo-notifications expo-local-authentication
npx expo install expo-image-picker expo-document-picker expo-image-manipulator
npx expo install expo-file-system expo-updates expo-web-browser expo-application

# Nếu lỗi peer dependency:
npm install --legacy-peer-deps [package-name]
```

### Bước 2: Npm packages thường – dùng npm sau
```powershell
npm install --legacy-peer-deps ^
  axios zustand zod date-fns clsx ^
  @tanstack/react-query @tanstack/react-query-persist-client ^
  @react-native-async-storage/async-storage ^
  react-hook-form @hookform/resolvers ^
  react-native-webview ^
  @shopify/flash-list ^
  nativewind react-native-reanimated ^
  react-native-pager-view

# Lưu ý: ^ ở cuối dòng là line continuation trong PowerShell (cmd thì dùng ^)
# Nếu lỗi, chạy từng nhóm nhỏ (5-6 package mỗi lần)
```

---

## Lỗi thường gặp & Cách xử lý

### ❌ `npm ERR! ERESOLVE unable to resolve dependency tree`
```powershell
# Nguyên nhân: Peer dependency conflict giữa các package
# Fix: Thêm --legacy-peer-deps
npm install --legacy-peer-deps [packages]
```

### ❌ `Error: npm install exited with non-zero code: 1` (từ expo install)
```powershell
# Nguyên nhân: expo install gọi npm bên trong mà thiếu flag
# Fix: Cài thẳng bằng npm với legacy-peer-deps
npm install --legacy-peer-deps [package-name]
```

### ❌ `Get-ChildItem: A positional parameter cannot be found`
```powershell
# Nguyên nhân: Gõ lệnh CMD (dir /s /b) trong PowerShell
# Fix: Dùng PowerShell syntax hoặc mở cmd.exe
Get-ChildItem -Recurse -Filter "*.php"  # PowerShell equivalent của dir /s /b
```

### ❌ App crash khi import expo-camera / expo-location trực tiếp trong component
```typescript
// ❌ SAI – crash trên Expo Go / Simulator
import { Camera } from 'expo-camera';
function MyComponent() { return <Camera />; }

// ✅ ĐÚNG – bọc trong HardwareService với try/catch
import { HardwareService } from '@services/HardwareService';
const photo = await HardwareService.capturePhoto();
```

### ❌ `Metro bundler stuck` hoặc cache cũ gây lỗi lạ
```powershell
# Xóa cache và khởi động lại
npx expo start --clear

# Hoặc nặng hơn:
Remove-Item -Recurse -Force .expo
Remove-Item -Recurse -Force node_modules\.cache
npx expo start --clear
```

### ❌ `EXPO_PUBLIC_*` biến không đọc được
```powershell
# Nguyên nhân: File .env không được load khi chạy
# Fix: Đảm bảo file .env nằm ở ROOT project (cùng cấp package.json)
# Kiểm tra:
Get-Content .env

# Tên biến BẮT BUỘC bắt đầu bằng EXPO_PUBLIC_ mới đọc được từ JS
# Biến không có prefix này sẽ không accessible trong app code
```

### ❌ `babel-preset-expo` lỗi với nativewind
```javascript
// babel.config.js – thứ tự plugins QUAN TRỌNG
module.exports = {
  presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
  plugins: [
    'nativewind/babel',
    'react-native-reanimated/plugin', // BẮT BUỘC CUỐI CÙNG
  ],
};
```

### ❌ `[warn] No native splash screen registered` hoặc icon không hiện
```powershell
# Sau khi sửa app.json, PHẢI prebuild lại
npx expo prebuild --clean

# Hoặc nếu chỉ test Expo Go (không cần native):
npx expo start --clear
```

### ❌ Push notification không nhận được trên Android Emulator
```
# Android Emulator KHÔNG hỗ trợ push notification
# Phải test trên thiết bị thật hoặc dùng Expo Push Notification Tool:
# https://expo.dev/notifications
```

---

## Quy trình build chuẩn (Mỗi lần release)

```powershell
# 1. Đăng nhập EAS
eas login

# 2. Build Android (Internal Testing)
eas build --platform android --profile preview

# 3. Build Production (Google Play)
eas build --platform android --profile production

# 4. Build iOS (cần macOS hoặc EAS cloud)
eas build --platform ios --profile production

# 5. Submit lên Store
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

---

## Checklist trước khi Submit Store

- [ ] `app.json`: bundleIdentifier, package, version, versionCode đúng
- [ ] Google Services file: `google-services.json` (Android) ở root
- [ ] Apple Privacy: tất cả `NS*UsageDescription` đã điền tiếng Việt
- [ ] Nút "Xóa tài khoản" có trong ProfileScreen (bắt buộc Apple)
- [ ] Privacy Policy URL hoạt động
- [ ] Test offline mode
- [ ] Test trên thiết bị thật (không chỉ Simulator)
