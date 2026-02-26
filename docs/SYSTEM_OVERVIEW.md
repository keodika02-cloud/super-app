# Tài Liệu Tổng Quan Hệ Thống QVC 2026

> **Dành cho:** Lập trình viên và AI Agent  
> **Lưu ý QUAN TRỌNG:** Toàn bộ 4 project được **mount (ánh xạ mạng)** từ các VPS về máy local tại `f:\project\`. **KHÔNG THỂ chạy lệnh** (`npm`, `php artisan`, `git`...) trực tiếp trên các thư mục này.

---

## 1. TỔNG QUAN HỆ THỐNG

```
f:\project\
├── appqvc2026\     ← Mobile App (Expo + React Native)
├── backend\        ← Backend Laravel (API chạy tại crm.maytinhquocviet.com)
├── frontend\       ← Frontend Web (chạy tại crm.maytinhquocviet.com)
└── www\
    ├── chat\       ← Chat Server (Node.js, chạy tại chat.maytinhquocviet.com)
    └── thienduc.vn\ ← Landing/Marketing site (chạy tại thienduc.vn)
```

---

## 2. TỪNG PROJECT CHI TIẾT

### A. `/backend` → `crm.maytinhquocviet.com/api`
**Loại:** Laravel PHP  
**Chạy live tại:** `https://crm.maytinhquocviet.com/api`  
**Không thể** chạy `php artisan`, `composer`, `migrate` v.v. tại local – chỉnh sửa file rồi đẩy/lưu, server sẽ tự nhận.

**Cấu trúc API quan trọng:**
```
app/Http/Controllers/Api/
├── V3/
│   ├── AppAuthController.php       — Đăng nhập, 2FA, Google OAuth, Token
│   ├── AppConfigController.php     — Bootstrap (version, maintenance), GPS config
│   ├── AppAttendanceController.php — Chấm công, nhận ảnh, phát hiện GPS giả
│   ├── AppNewsFeedController.php   — Bảng tin nội bộ, bài đăng
│   ├── AppNotificationController.php — Push notification, đánh dấu đã đọc
│   └── Admin/
│       ├── AppScreenController.php      — Quản lý màn hình SDUI theo screen_slug
│       ├── AppMenuItemController.php    — Quản lý menu item, icon, màu sắc, hành động
│       ├── AppFullConfigController.php  — Đồng bộ DB ↔ JSON snapshot
│       └── AppNewsFeedAdminController.php — Quản lý bài đăng, duyệt nội dung
```

**API Prefix chuẩn:** `/api/v3/app/...`  
**Auth:** Bearer Token (lưu trong app via SecureStore)  
**Response format chuẩn (`AppV3Response` trait):**
```json
{
  "success": true,
  "data": { ... },
  "message": "..."
}
```

**Cơ chế SDUI 2 lớp:**
1. Kiểm tra `storage/app/sdui_factory_defaults.json` trước (Zero-latency)
2. Nếu không có → truy vấn Database bảng `app_screens` và `app_menu_items`

---

### B. `/frontend` → `crm.maytinhquocviet.com`
**Loại:** React/Vue Web App  
**Chạy live tại:** `https://crm.maytinhquocviet.com`  
**Mục đích:** Giao diện CRM Web, quản trị viên dùng để quản lý dữ liệu.  
**Lưu ý:** Không thể chạy `npm` hay build tại local.

---

### C. `/www/chat` → `chat.maytinhquocviet.com`
**Loại:** Node.js + Laravel Echo Server (WebSocket Reverb)  
**Chạy live tại:** `https://chat.maytinhquocviet.com`  
**API Prefix:** `/api/v1/internal/...`  
**Kết nối từ App Mobile:** Qua `SocketService.ts` – dùng Laravel Echo + Pusher-js

**Endpoints chat chính:**
- `GET /api/v1/internal/conversations` — Danh sách hội thoại
- `GET /api/v1/internal/messages?conversation_id=X` — Tin nhắn của một cuộc hội thoại
- `POST /api/v1/internal/messages` — Gửi tin nhắn mới

---

### D. `/www/thienduc.vn` → `thienduc.vn`
**Loại:** PHP/Static landing page  
**Chạy live tại:** `https://thienduc.vn`  
**Mục đích:** Website marketing/giới thiệu công ty. Không liên quan đến App Mobile.

---

## 3. APP MOBILE (`/appqvc2026`)
**Framework:** Expo SDK 54 + React Native 0.81 + Expo Router  
**Chạy:** `npx expo start --clear` tại `f:\project\appqvc2026`  
**Kết nối:** trực tiếp tới `crm.maytinhquocviet.com/api` và `chat.maytinhquocviet.com/api`

### 3.1 Cấu hình môi trường (`.env`)
```
EXPO_PUBLIC_API_URL=https://crm.maytinhquocviet.com/api    ← Backend chính
EXPO_PUBLIC_CRM_URL=https://crm.maytinhquocviet.com         ← URL mở WebView CRM
EXPO_PUBLIC_CHAT_API_URL=https://chat.maytinhquocviet.com/api
EXPO_PUBLIC_CHAT_SOCKET_URL=chat.maytinhquocviet.com
EXPO_PUBLIC_CHAT_REVERB_KEY=v8b9ezbiusabn3kcqago
EXPO_PUBLIC_CHAT_REVERB_PORT=443
EXPO_PUBLIC_USE_MOCK=false   ← TRUE = giả lập GPS/Camera (chỉ dùng khi dev Simulator)
EXPO_PUBLIC_ENV=development  ← production khi build Store
```

> **⚠️ QUAN TRỌNG:** `EXPO_PUBLIC_USE_MOCK=true` sẽ giả lập toàn bộ GPS và Camera ngay cả trên thiết bị thật. **Chỉ bật khi dùng iOS/Android Simulator.**

### 3.2 Cấu trúc thư mục App
```
appqvc2026/
├── app/                        ← Expo Router Pages (file-based routing)
│   ├── _layout.tsx             ← Root layout: ErrorBoundary + Auth Guard + Sentry
│   ├── (auth)/login.tsx        ← Màn hình đăng nhập
│   └── (main)/
│       ├── _layout.tsx         ← Tab Bar (Cấu hình cứng 5 Tab: Trang chủ, CRM, Cuộc trò chuyện, Khám phá, Hồ sơ)
│       ├── index.tsx           ← Trang chủ (Bảng tin) → SDUI
│       ├── crm.tsx             ← WebView nhúng Hệ thống quản lý CRM Quốc Việt
│       ├── chat.tsx            ← Chat nội bộ (Realtime - Reverb)
│       ├── more.tsx            ← Khám phá (Danh sách Chấm công, Báo cáo, Lịch...) → SDUI
│       └── profile.tsx         ← Hồ sơ cá nhân
│       ├── (ẩn) checkin.tsx      ← Chấm công (GPS + Camera) - Gọi từ Tab Khám phá
│       ├── (ẩn) reports.tsx      ← Báo cáo phân tích - Gọi từ Tab Khám phá
│       ├── (ẩn) tasks.tsx        ← Danh sách Công Việc - Gọi từ Tab Khám phá
│       └── (ẩn) notifications.tsx ← Thông báo tổng hợp - Gọi từ Tab Khám phá
│
└── src/
    ├── config/
    │   ├── api-endpoints.ts    ← SINGLE SOURCE OF TRUTH: toàn bộ Endpoint + Zod Schema
    │   ├── ScreenConfigs.ts    ← Config từng màn hình SDUI (cacheKey, fallback layout)
    │   ├── env.ts              ← Validate biến môi trường (Fail-fast nếu thiếu)
    │   └── query-keys.ts       ← Hằng số cache key TanStack Query
    │
    ├── services/
    │   ├── ApiClient.ts        ← Gọi API an toàn: tự parse Zod, retry, timeout
    │   ├── HardwareService.ts  ← GPS, Camera, FaceID, Device Info – Tự fallback Mock
    │   ├── StorageService.ts   ← AsyncStorage wrapper (get/set/delete config)
    │   ├── NotificationService.ts ← Push notification (Expo Notifications)
    │   ├── SocketService.ts    ← WebSocket chat (Laravel Echo + Reverb)
    │   ├── MediaService.ts     ← Upload ảnh/file lên Server
    │   └── BridgeService.ts    ← Giao tiếp với WebView CRM (postMessage)
    │
    ├── hooks/
    │   ├── useHybridData.ts    ← Anti-Crash: Cache → API → Hardcoded Fallback
    │   ├── useNavigation.ts    ← Tải Tab Bar từ Backend (điều khiển từ Server)
    │   └── useScreenData.ts    ← Wrapper TanStack Query với staleTime/retry
    │
    ├── components/
    │   ├── layout/
    │   │   ├── SafeScreen.tsx   ← Wrapper màn hình SDUI (tích hợp useHybridData)
    │   │   └── ScreenWrapper.tsx ← Nền tảng: SafeAreaView + Offline Banner
    │   ├── error/
    │   │   └── ErrorBoundary.tsx ← Chặn crash UI, báo Sentry, hiện nút "Tải lại"
    │   └── blocks/             ← Các UI Block do Backend điều khiển (SDUI)
    │       ├── SduiEngine.tsx  ← Bộ não: nhận mảng block JSON → render component
    │       ├── ImageBlock.tsx  ← Ảnh (có skeleton placeholder khi loading/offline)
    │       ├── GridMenuBlock.tsx ← Menu lưới icon
    │       ├── BannerBlock.tsx ← Thông báo màu sắc
    │       ├── GpsBlock.tsx    ← Card hiển thị tọa độ
    │       ├── CameraBlock.tsx ← Nút chụp ảnh
    │       ├── UploadBlock.tsx ← Nút tải tệp
    │       ├── CommentBlock.tsx ← Khung chat/bình luận
    │       ├── SocialFeedBlock.tsx ← Danh sách bài đăng
    │       ├── ProfileHeaderBlock.tsx ← Header người dùng
    │       ├── SummaryCardBlock.tsx ← Thẻ thống kê số liệu
    │       ├── HtmlBlock.tsx   ← Nhúng HTML/CSS tùy biến
    │       └── UnknownBlock.tsx ← Block dự phòng (khi Backend trả type lạ)
    │
    └── stores/
        └── useAuthStore.ts     ← Zustand store: token, user info, login/logout
```

---

## 4. HỆ THỐNG SDUI (Server-Driven UI)

Đây là tính năng cốt lõi: **Backend điều khiển giao diện App mà không cần cập nhật Store.**

### Luồng hoạt động:
```
Backend (JSON) → ApiClient → SduiLayout Parser (Zod) → SduiEngine → Native UI
```

### API lấy layout:
```
GET /api/v3/app/ui-layout                       ← Trang chủ (HOME)
GET /api/v3/app/ui-layout?screen_slug=goto_reports ← Màn hình Reports
GET /api/v3/app/ui-layout?screen_slug=goto_more   ← Màn hình More
```

### Danh sách Blocks hỗ trợ:
| `type` (JSON) | Component File | Các tham số `data` |
|:---|:---|:---|
| `ProfileHeaderBlock` | ProfileHeaderBlock.tsx | `greeting` |
| `GridMenuBlock` | GridMenuBlock.tsx | `title`, `items[]{label, icon, action, bg_color}` |
| `BannerBlock` | BannerBlock.tsx | `title`, `subtitle`, `action`, `action_label` |
| `ImageBlock` | ImageBlock.tsx | `url`, `aspect_ratio`, `resize_mode`, `action` |
| `SummaryCardBlock` | SummaryCardBlock.tsx | `title`, `subtitle`, `stats[]{label, value}` |
| `GpsBlock` | GpsBlock.tsx | `label`, `auto_refresh` |
| `CameraBlock` | CameraBlock.tsx | `label`, `required`, `context_type`, `context_id` |
| `UploadBlock` | UploadBlock.tsx | `label`, `accept_types[]`, `max_size_mb`, `context_type`, `context_id` |
| `CommentBlock` | CommentBlock.tsx | `placeholder`, `context_type`, `context_id` |
| `SocialFeedBlock` | SocialFeedBlock.tsx | `posts[]{author, content, images[], likes, comments}` |
| `HtmlBlock` | HtmlBlock.tsx | `html`, `css`, `js`, `height` |
| `StoryBlock` | StoryBlock.tsx | `items[]{label, avatar, is_seen}` |
| `PostComposerBlock` | PostComposerBlock.tsx | `placeholder` |

### Hành động (Actions):
| `action` string | Kết quả |
|:---|:---|
| `OPEN_WEB_URL` | Mở trình duyệt |
| `NAVIGATE` | Chuyển màn hình nội bộ |
| `OPEN_MAP` | Mở bản đồ GPS |
| `CALL_PHONE` | Mở bàn phím gọi điện |
| `OPEN_WEB_RATING` | Mở trang đánh giá/hỗ trợ |
| `NONE` | Không làm gì |

---

## 5. CHIẾN LƯỢC ANTI-CRASH (3 LỚP)

Mọi màn hình SDUI đều bảo vệ bởi `useHybridData`:

```
Lớp 1: CACHE (AsyncStorage)  → Hiện giao diện ngay lập tức (< 200ms)
          ↓ (nền)
Lớp 2: API (Backend live)    → Cập nhật giao diện sau khi load xong
          ↓ (nếu thất bại)
Lớp 3: FALLBACK cứng        → Mảng block định nghĩa sẵn trong ScreenConfigs.ts
```

Toàn bộ dữ liệu API còn được lọc qua **Zod Schema** trước khi render, đảm bảo kiểu dữ liệu chính xác 100%.

---

## 6. QUY TẮC CHO AI AGENT

> Tuân thủ những điều này để không làm hỏng hệ thống:

1. **Không chạy lệnh** (`npm run`, `php artisan`, `git`...) – các thư mục là **mount từ VPS**, lệnh sẽ thất bại hoặc ảnh hưởng xấu đến server live.
2. **Chỉnh sửa file trực tiếp** – save là server nhận ngay.
3. **Chỉnh sửa Schema Zod** tại `src/config/api-endpoints.ts` nếu muốn thêm/bớt trường API – đây là Single Source of Truth.
4. **Không bao giờ import `SafeAreaView` từ `react-native`** – luôn dùng từ `react-native-safe-area-context`.
5. **`EXPO_PUBLIC_USE_MOCK`** trong `.env` chỉ được đặt `true` khi test trên Simulator. Thiết bị thật phải để `false`.
6. **Thêm Block mới** cần: (a) tạo file Component trong `src/components/blocks/`, (b) đăng ký Schema Zod trong `api-endpoints.ts`, (c) đăng ký trong `SduiEngine.tsx`.
7. **SafeAreaView warning** xuất hiện từ package `@sentry/react-native` trong `node_modules` – đây là cảnh báo thư viện bên thứ 3, không phải lỗi của code chúng ta, **bỏ qua**.
