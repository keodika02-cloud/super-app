# HỒ SƠ THIẾT KẾ HỆ THỐNG: QVC APP

Phiên bản: 6.0 (Production Ready - Hybrid Architecture)
Backend: Laravel 12 (Real API) | Frontend: Expo SDK 53 (Hardware Guard)
Kiến trúc: Server-Driven UI (SDUI) + Clean Architecture
Mục tiêu: Render động 100% từ JSON Server & Zero-Crash trên Antigravity.________________________________________
CHƯƠNG 1: TỔNG QUAN THIẾT KẾ HỆ THỐNG

## 1.1. TỔNG QUAN CÔNG NGHỆ & PHIÊN BẢN (STRICT STACK)

Yêu cầu tuân thủ chính xác phiên bản này. Đây là bộ khung "Safe List" đã được kiểm chứng độ tương thích giữa Expo Go và Apple/Google.
Thành phần Công nghệ / Thư viện | Phiên bản | Ghi chú Lý do chọn (Compliance & Stability)
:--- | :--- | :---
Framework | Expo SDK 53 (React Native 0.76) | Chuẩn ổn định nhất hiện tại, hỗ trợ OTA Update.
Language | TypeScript v5.x (Strict Mode) | Bắt buộc để map chính xác Type từ Laravel.
Styling | **NativeWind v4** + Reanimated | Tương thích Tailwind, hiệu năng cao.
Routing | Expo Router v3.5+ | Routing theo file (File-based), hỗ trợ Deep Link.
State | Zustand + TanStack Query v5 | Quản lý Server State và Global State.
Network | **Axios (ApiClient Hardened)** | Interceptor xử lý Envelope, Circuit Breaker, Rate Limit.
Storage | **StorageService** | Wrapper thông minh cho SecureStore & AsyncStore.
Hardware | expo-camera, expo-location | Bọc trong **HardwareGuard** (useSafeHardware).

### 1.2. CHIẾN LƯỢC KẾT NỐI "HYBRID" (REAL API - MOCK INPUT)

Đây là kiến trúc đặc thù để phát triển App Real trên môi trường Cloud (Antigravity).

1. Luồng dữ liệu xuống (Downstream - Output):
o App kết nối TRỰC TIẾP với Server Laravel thật (<https://crm.maytinhquocviet.com>).
o Không Mock API. Nhận JSON thật, xử lý lỗi thật.
2. Luồng dữ liệu lên (Upstream - Input):
o Do Antigravity không có Camera/GPS vật lý.
o Hệ thống sử dụng cơ chế HardwareGuard:
 Nếu là Máy thật: Gọi Sensor thật.
 Nếu là Antigravity: Tự động trả về Dữ liệu giả lập hợp lệ (Ảnh Base64 đen, Tọa độ văn phòng) để Server chấp nhận xử lý.

### 1.3. HỢP ĐỒNG DỮ LIỆU (JSON CONTRACT)

Phần này định nghĩa cấu trúc JSON chung. Frontend và Backend phải tuân thủ tuyệt đối.
A. Cấu trúc Phản hồi Chuẩn (Envelope Response)
Khớp hoàn toàn với file Backend: app/Traits/ApiResponse.php

````
// File: src/types/api.ts

export interface ApiResponse<T> {
  code: number;           // 200: Success, 4xx/5xx: Error
  status: string;         // "success" | "error"
  message: string;        // Message hiển thị cho User (Toast)
  data: T;                // Payload dữ liệu chính
  meta?: {                // Metadata cho phân trang (Pagination)
    page: number;
    limit: number;
    total: number;
    last_page: number;
  };
  trace_id: string;       // ID truy vết lỗi (Quan trọng khi debug)
  error?: {               // Chi tiết lỗi (nếu có)
    type: string;         // VD: "VALIDATION_ERROR"
    details: any;
  };
}
````

B. Cấu trúc Server-Driven UI (SDUI Blocks)
Khớp hoàn toàn với file Backend: app/Models/AppComponent.php & ScreenController.php

````
// File: src/types/sdui.ts

// 1. Các loại Block mà hệ thống hỗ trợ (Dựa trên Reality Engine V4.0)
export type BlockType = 
  | 'ProfileHeaderBlock'  // Header thông tin user
  | 'GridMenuBlock'       // Menu lưới chức năng 
  | 'BannerBlock'         // Thẻ banner quảng cáo
  | 'SummaryCardBlock'    // Thẻ báo cáo nhanh
  | 'SocialFeedBlock'     // Bảng tin mạng xã hội
  | 'HtmlBlock'           // Khối nội dung HTML tùy chỉnh
  | 'StoryBlock'          // Danh sách story người dùng
  | 'FeedActionBlock'     // Các nút hành động nhanh trên feed
  | 'PostComposerBlock';  // Ô soạn thảo bài viết

// 2. Định nghĩa Hành động (Action)
export interface AppAction {
  type: 'NAVIGATE' | 'API_CALL' | 'OPEN_URL';
  target: string;                // Route name (VD: "checkin") hoặc URL
  payload?: Record<string, any>; // Dữ liệu bổ sung
}

// 3. Định nghĩa Module Render (Atomic Components)
export interface UIBlock {
  id: string;                    // Unique ID cho Key React
  type: BlockType;
  data: any;                     // Payload dữ liệu đặc thù cho từng Block
  action?: AppAction;
}

// 4. Response của API /v3/app/ui-layout
export interface ScreenData {
  layout: UIBlock[];
}
````

C. Cấu trúc Action Payload
Hệ thống sử dụng cơ chế "Command Pattern". Thay vì nhiều API, ta dùng 1 API duy nhất để xử lý hành động.

````
export type ActionType = 'CHECKIN' | 'REPORT' | 'BLOCK' | 'REQUEST_LEAVE';
export interface ActionPayload {
  type: ActionType;
  payload: Record<string, any>; // Dữ liệu tùy biến theo type
}
````

D. Quy tắc Thời gian & Định dạng (Data Format)

1. DateTime: Server BẮT BUỘC trả về chuẩn ISO 8601 UTC (YYYY-MM-DDTHH:mm:ssZ).
o Frontend: Sử dụng date-fns để convert sang Local Time khi hiển thị.
o Tuyệt đối không: Trả về string format sẵn như "22/01/2026" (gây khó khăn khi tính toán logic "cách đây bao lâu").
2. Money: Server trả về number (VD: 100000), Frontend tự format tiền tệ (100.000 đ).

1.4. DANH SÁCH COMPONENT & FUNCTION DÙNG CHUNG (REUSABLE CORE)
Hệ thống được chia thành các module tái sử dụng tối đa, tránh viết code lặp lại.
A. Core Functions (Logic nền tảng)
Tên Function | File | Nhiệm vụ & Logic
--- | --- | ---
**useSafeHardware** | `src/core/hardware/` | QUAN TRỌNG NHẤT: Trả về Mock GPS/Camera nếu chạy trên Antigravity, tránh crash.
**ApiClient** | `src/services/` | Hardened Axios: Bóc Envelope, Circuit Breaker, xử lý 429/401 tự động.
**StorageService** | `src/services/` | Wrapper cho SecureStore (Token) và AsyncStore (Config). Tự động fallback trên Web.
**useScreenData** | `src/hooks/` | SDUI Fetcher: Gọi `/v3/app/ui-layout`, hỗ trợ Offline-first.
**useAuthStore** | `src/stores/` | Quản lý phiên đăng nhập, hydrate dữ liệu từ bộ nhớ khi khởi động.

B. UI Components (Giao diện chuẩn)
Tên Component | File | Mô tả & Cách dùng
--- | --- | ---
**LayoutEngine** | `src/core/sdui/` | Render mảng blocks. Fail-safe: Widget lạ -> Null (Prod) / ErrorBox (Dev).
**ScreenWrapper** | `src/components/layout/` | Khung màn hình: Xử lý SafeArea, Offline Banner đồng bộ.
**GlassCard** | `src/components/ui/` | Thẻ kính mờ: UI đặc trưng của QVC App, dùng cho mọi khối thông tin.
**AppButton** | `src/components/ui/` | Nút chuẩn: Hỗ trợ loading, disabled state và gradient style.
**ErrorBoundary**| `src/components/error/`| Bọc ngoài cùng: Bắt lỗi runtime, tránh App bị văng (Crash).

### 1.6. CHIẾN LƯỢC PHÒNG VỆ & "ZERO-CRASH" (HARDENING)
Dự án áp dụng các kỹ thuật cao cấp để đảm bảo App không bao giờ bị văng (Crash) dù Server trả về dữ liệu sai hoặc mất mạng đột ngột.

1.  **Response Hardening (Zod Validation)**:
    - Mọi API call đều được bọc trong `fetchSafe`.
    - Dữ liệu trả về được validate bằng Zod Schema. Nếu sai cấu trúc, App sẽ dùng `fallbackRes` thay vì crash.
2.  **Circuit Breaker & Rate Limit**:
    - `ApiClient` tích hợp cơ chế tự ngắt nếu Server lỗi liên tục, tránh làm treo tài nguyên điện thoại.
    - Xử lý mã lỗi 429 (Too Many Requests) bằng cách tạm dừng và hiển thị thông báo "Hệ thống đang bận".
3.  **Global Logout Guard**:
    - Response Interceptor tự động xóa trắng thông tin phiên và đẩy user về màn Login nếu nhận mã 401 (Unauthorized).
4.  **Hardware Mocking**:
    - Sử dụng `HardwareGuard` để cung cấp dữ liệu giả lập cho GPS/Camera khi chạy trên môi trường không có phần cứng (như Antigravity).

1.5. DANH SÁCH API CHỨC NĂNG (V3 HARDENED)
Hệ thống sử dụng Prefix `/v3/app/` cho mọi endpoint mới để đảm bảo tính Zero-Crash và Mock-Compatibility.

Endpoint | Method | Mô tả & Logic
--- | --- | ---
`/v3/app/bootstrap` | GET | Lấy config khởi động, version, force_update.
`/v3/app/ui-layout` | GET | SDUI Engine: Trả về mảng layout các blocks.
`/v3/app/login` | POST | Login v3: Trả về { token, user } chuẩn Envelope.
`/v3/app/user` | GET | Lấy thông tin Profile của phiên đăng nhập hiện tại.
`/v3/app/news-feed` | GET | Lấy danh sách bài viết mạng nội bộ (hỗ trợ phân trang).
`/v3/app/checkin` | POST | Chấm công: Gửi ảnh, GPS và UUID định danh.
`/v3/app/logs` | POST | Ghi log lỗi từ Client lên Server để debug (Zero-Crash report).

1.3. CẤU TRÚC THƯ MỤC VẬT LÝ (DIRECTORY STRUCTURE)
Cấu trúc này hỗ trợ Clean Architecture, tách biệt logic Mock/Real và SDUI.

````
```
mobile-app/
├── app/                        # [Expo Router] File-based Routing
│   ├── (auth)/                 # Luồng đăng nhập
│   ├── (main)/                 # Màn hình chính (index.tsx, checkin.tsx, crm.tsx...)
│   └── _layout.tsx             # Root Layout (Sentry, Providers)
├── src/
│   ├── components/             # UI Components (layout, ui, error, blocks)
│   ├── config/                 # Env, API Endpoints, Query Client
│   ├── core/                   # Logic cốt lõi (HardwareGuard, SDUI Engine, Storage)
│   ├── domain/                 # Type definitions & Entities
│   ├── hooks/                  # Custom Hooks (useScreenData, useNetworkStatus)
│   ├── screens/                # UI Screens Logic thực tế
│   ├── services/               # ApiClient, HardwareService, MediaService...
│   ├── stores/                 # Zustand Stores (useAuthStore)
│   └── utils/                  # Helpers & ActionRegistry
├── assets/                     # Fonts, Images
└── app.json                    # Expo Config
```

````

1.4. CHIẾN LƯỢC PHẦN CỨNG (HARDWARE STRATEGY)
Do chạy trên Antigravity (Linux), Frontend phải giả lập dữ liệu đầu vào trước khi gọi API thật.
File: src/core/hardware/useSafeHardware.ts

1. Input (GPS/Camera):
o Kiểm tra Device.isDevice.
o Nếu false (Antigravity): Trả về tọa độ cố định (Vinh City) và ảnh Base64 đen.
o Nếu true (Real Device): Gọi expo-location và expo-camera.
2. Output (API Call):
o Luôn gọi API số 11 (/api/app/action) với payload đã lấy được (Dù là thật hay giả).
1.4. GIAO THỨC CÀI ĐẶT & KHỞI TẠO (INSTALLATION PROTOCOL)
Chỉ dẫn này đảm bảo cài đặt thành công ngay lần đầu, bao gồm cả các thư viện native phức tạp.
Bước 1: Khởi tạo Project (Expo SDK 53)
npx create-expo-app@latest quocviet-super-app --template default@sdk-53
cd quocviet-super-app
Bước 2: Cài đặt Core UI & Navigation (NativeWind v4)

````
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar react-native-svg
# Cài NativeWind v4 & Reanimated (Cho hiệu ứng Glass/BottomSheet)
npx expo install nativewind react-native-reanimated
npm install --save-dev tailwindcss
````

Bước 3: Cài đặt Logic & Data Layer

````
# Data Fetching & State
npm install axios @tanstack/react-query @tanstack/react-query-persist-client zustand zod clsx tailwind-merge date-fns
# Icon Set (Bắt buộc theo App.js)
npm install lucide-react-native
# Network Status (Để phát hiện mất mạng) 
npx expo install @react-native-community/netinfo
````

Bước 4: Cài đặt Native Modules (Camera, Storage, Notification) Lệnh này cài đúng version cho SDK 53, sửa lỗi Camera cũ.

````
# Cài đặt Native Modules (Hardware Safe List)
npx expo install expo-camera expo-location expo-file-system expo-image-manipulator expo-local-authentication
# Storage & Device Info
npx expo install expo-secure-store expo-device expo-constants
# Notification 
npx expo install expo-notifications
````

1.5. HƯỚNG DẪN CODE CHO AI (AI INSTRUCTION SET)
Khi bạn đưa hồ sơ này cho AI, hãy kèm theo các chỉ dẫn sau để tránh lỗi logic:

1. Quy tắc Hardware Guard (QUAN TRỌNG NHẤT - ANTIGRAVITY SURVIVAL):
• CẤM: Tuyệt đối không import trực tiếp expo-camera, expo-location trong UI Component.
• BẮT BUỘC: Phải sử dụng hook useSafeHardware.
• LOGIC: Trong hook này, kiểm tra !Device.isDevice. Nếu là Antigravity/Simulator, phải trả về Mock Data Hợp lệ (VD: Base64 ảnh đen, Tọa độ cố định) để khi gọi API thật, Server không trả về lỗi Validation.
2. Quy tắc SDUI (Server-Driven UI Mapping):
• API Endpoint: /api/app/screens/{code}.
• Mapping: Dữ liệu trả về nằm trong response.data.blocks.
• Dynamic Action: Khi user tương tác (bấm nút), KHÔNG viết logic cứng. Phải gọi handleAction(action) với object action nhận từ JSON (khớp model AppAction của Backend).
3. Quy tắc Envelope (Laravel Compatibility):
• Mọi Request phải đi qua apiClient (Axios Interceptor).
• Unwrap: AI phải viết code để tự động bóc tách:
o Input: { code: 200, data: { ... }, trace_id: "..." }
o Output cho UI: Chỉ lấy phần { ... } bên trong data.
• Error Handling: Nếu code !== 200, Interceptor phải throw lỗi ngay lập tức để React Query bắt được (catch).
4. Quy tắc Môi trường (Zero-Crash):
• CẤM: Không cài đặt react-native-mmkv (Gây lỗi JSI trên Cloud). Dùng expo-secure-store.
• FAIL FAST: Nếu thiếu biến EXPO_PUBLIC_API_URL, App phải crash ngay khi khởi động.

1.6. CƠ CHẾ "FAIL FAST" & PHÒNG VỆ (DEFENSIVE SYSTEMS)
Mục tiêu: App sẽ từ chối khởi động nếu thiếu cấu hình, và từ chối render nếu dữ liệu sai lệch.
A. Kiểm tra Biến môi trường (Strict Env Validation)
Không chỉ dùng zod để định nghĩa, ta phải cài đặt cơ chế Crash-on-Launch tại file khởi nguồn.
• File: src/config/env.ts
• Logic yêu cầu AI thực hiện:
Ví dụ mẫu:

````
import { z } from 'zod';
const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url({ message: "❌ API URL không hợp lệ!" }),
  EXPO_PUBLIC_USE_MOCK: z.string().refine(val => val === 'true' || val === 'false', {
    message: "❌ USE_MOCK phải là 'true' hoặc 'false'"
  }),
  // Bắt buộc phải có nếu chạy Prod
  EXPO_PUBLIC_SENTRY_DSN: z.string().optional(),
});

// Thực thi kiểm tra ngay lập tức
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  // In lỗi đẹp ra console
  console.error("🛑 LỖI CẤU HÌNH NGHIÊM TRỌNG (FATAL CONFIG ERROR):");
  console.error(JSON.stringify(_env.error.format(), null, 2));
  
  // Throw Error để App sập ngay, không cho chạy tiếp
  throw new Error("⚠️ APP KHÔNG THỂ KHỞI ĐỘNG DO LỖI FILE .ENV");
}

export const Env = _env.data;
````

B. Kiểm soát Hợp đồng JSON (Runtime Contract Enforcement)
TypeScript chỉ kiểm tra lúc code (compile-time). Khi chạy (runtime), nếu Server/Mock trả về dữ liệu thiếu trường quan trọng, App vẫn có thể chạy sai. HTTP 200 chưa chắc đã là thành công.
• Yêu cầu: Sử dụng zod để validate Response API trước khi đưa vào State.
• Quy tắc:

1. Nếu status !== 200: Ném lỗi Business Error.
2. Nếu cấu trúc JSON sai (VD: thiếu layout): Crash ngay ở môi trường Dev để Dev biết Server đang trả sai.
C. Cơ chế SDUI "No-Fail" (Widget Registry Guard)
Tránh trường hợp Server trả về type: "BANNER_TET" mà App chưa code Widget này dẫn đến màn hình trắng xóa.
• Logic xử lý (trong LayoutEngine.tsx):
Ví dụ mẫu:

````
const WIDGET_REGISTRY: Record<string, React.FC<any>> = {
  HEADER_BANNER: HomeHeaderWidget,
  GRID_MENU: QuickActionWidget,
};
export const LayoutEngine = ({ data }) => {
  return data.map((block, index) => {
    const Widget = WIDGET_REGISTRY[block.type];
    // FAIL FAST ở môi trường DEV: Báo lỗi đỏ rực
    if (!Widget) {
      if (__DEV__) {
        return <ErrorBox msg={`❌ Chưa code Widget: ${block.type}`} />;
      }
      // Ở PROD: Ẩn đi âm thầm để user không thấy lỗi
      return null;
    }

    return <Widget key={index} data={block.data} />;
  });
};
````

D. Phiên bản tối thiểu (Version Lock)
Chặn người dùng dùng App cũ với API mới (tránh crash do thiếu tính năng Native mới).
• Logic: Kiểm tra version_meta.global_ver từ JSON. Nếu version này lớn hơn version trong app.json, hiện màn hình bắt buộc cập nhật (Force Update Screen) ngay lập tức, không cho vào trong.
E. Điều kiện về "Envelope Unwrapping" (Bóc tách dữ liệu)
• Lỗi hiện tại: Chỉ kiểm tra HTTP Status.
• Điều kiện mới bắt buộc:
o Hệ thống Network (Axios Interceptor) phải kiểm tra trường code nằm bên trong JSON body.
o Logic: Ngay cả khi HTTP Status là 200, nếu body.code !== 200, hệ thống phải coi đó là Lỗi (Exception) và ném ra Alert/Toast cho người dùng, không được phép xử lý tiếp như thành công.
F. Điều kiện về "JSI Ban" (Chặn thư viện C++)
• Lỗi hiện tại: Chỉ nói chung chung về thư viện.
• Điều kiện mới bắt buộc:
o Trong quá trình AI chọn thư viện hoặc setup, CẤM TUYỆT ĐỐI việc import hoặc cài đặt react-native-mmkv hay realm.
o Nếu phát hiện các thư viện này trong package.json, quy trình build coi như thất bại (vì Antigravity chạy Expo Go không hỗ trợ JSI tùy chỉnh).

Chương 2: Pháo Đài Xác Thực & Bảo Mật (Auth Module)
PHẦN 1: PHẢN BIỆN CHIẾN LƯỢC (GÓC NHÌN NGƯỜI ĐÃ THẤT BẠI)

1. Giả định cốt lõi sai lầm
Bạn đang giả định: "Module Auth chỉ cần Login thành công là xong." Thực tế: Auth là cánh cửa đầu tiên mà Apple/Google kiểm tra. Họ không quan tâm bạn Login hay như thế nào, họ quan tâm:
• "Tại sao có nút Login Google mà không có Apple?" (Apple Guideline 4.8).
• "Tại sao tạo tài khoản được mà không xóa được ngay trong App?" (Guideline 5.1.1).
• "Tại sao bấm Login trên máy ảo Linux (Antigravity) lại sập App?" (Do gọi thư viện Native sai).
2. Lỗ hổng khiến tôi từng trả giá lớn nhất
Đó là Social Login trên môi trường ảo.
• Sai lầm: Tôi tích hợp SDK Google/Apple chuẩn.
• Hậu quả: Khi chạy trên Simulator/Antigravity, nút "Sign in with Apple" gây crash vì nó yêu cầu Native UI của iOS. Nút Google gây crash vì thiếu trình duyệt để mở Pop-up.
• Giá phải trả: Team mất 3 ngày chỉ để setup môi trường dev cho người mới, vì cứ clone về là lỗi Auth.
3. Điểm mù về Tuân thủ (Compliance Blindspot)
Dev thường quên "Privacy Policy".
• Trên màn hình Login, nếu không có dòng nhỏ "Bằng việc đăng nhập, bạn đồng ý với Điều khoản & Chính sách bảo mật" (kèm link), Google Play sẽ từ chối App vì thu thập dữ liệu người dùng mà không thông báo.

2.1. ĐẶC TẢ KỸ THUẬT & THƯ VIỆN (TECH SPECS)
Yêu cầu cài đặt chính xác danh sách này. Tuyệt đối không thêm bớt để đảm bảo chạy trên Expo Go.

1. Lưu trữ Token (Secure Storage):
o Sử dụng: expo-secure-store.
o BẮT BUỘC: Thay thế hoàn toàn react-native-mmkv (Gây crash trên Antigravity). Dùng để lưu access_token, refresh_token.
2. Lưu trữ Config (Cache):
o Sử dụng: @react-native-async-storage/async-storage.
o Mục đích: Lưu thông tin không nhạy cảm (Theme, Last Email, Onboarding Status).
3. Mạng xã hội (Social Auth):
o Sử dụng: expo-apple-authentication (Cho iOS) và expo-auth-session/providers/google (Cho Google).
o Lưu ý Antigravity: Phải bọc trong lớp HardwareGuard (sẽ mô tả ở mục 2.4).
4. Sinh trắc học (Biometrics):
o Sử dụng: expo-local-authentication.
o Mục đích: FaceID/TouchID thay cho nhập pass.

2.2. HỢP ĐỒNG DỮ LIỆU & TYPE (STRICT DATA CONTRACT)
Định nghĩa luật dữ liệu khớp với Backend Laravel thật. Nếu Server trả về sai luật này, App sẽ báo lỗi ngay (Crash in Dev) để không chạy sai logic.
A. Quy tắc Envelope (Bắt buộc):
• Mọi API Auth (Login, Me, Social) đều phải trả về JSON theo cấu trúc: { code, status, message, data, trace_id }.
• Hệ thống chỉ chấp nhận thành công khi code === 200.

A. Mô hình Người dùng (User Entity)
File: src/modules/auth/auth.types.ts

````
{
  "id": 101,
  "ulid": "01HR5XQ7...", // Mã định danh duy nhất (dùng cho API public thay ID số)
  "name": "Nguyen Van A",
  "email": "nhanvien@quocviet.com",
  "phone": "0987654321",
  "avatar": "https://cdn.quocviet.com/avatars/u101_v2.jpg",
  "role": "STAFF", // STAFF, MANAGER, ADMIN
  "status": "ACTIVE", // ACTIVE, BLOCKED, SCHEDULED_DELETE (Đang chờ xóa)
  "department": {
    "id": 5,
    "name": "Phòng Kỹ Thuật"
  },
  


  "settings": {
    "receive_notification": true,
    "language": "vi",
    "theme": "light" // dark/light
  },
  "compliance": {
    "is_verified": true, // Đã xác thực Email/SĐT
    "delete_scheduled_at": null // Nếu khác null -> Đang chờ xóa (theo yêu cầu Apple)
  },
  "created_at": "2025-01-15T08:00:00Z"
}
````

B. Phản hồi Đăng nhập (Login Response)
Hệ thống Mock và Real API bắt buộc trả về đúng cấu trúc này:

````
{
  "code": 200,
  "status": "success",
  "message": "Đăng nhập thành công",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDEsImlhdCI6MTcwNjE1...",
    "token_type": "Bearer",
    "expires_in": 31536000,
    "user": {
      "id": 101,
      "ulid": "01HR5XQ7PZ5...",
      "name": "Nguyen Van A",
      "email": "nhanvien@quocviet.com",
      "phone": "0987654321",
      "avatar": "https://cdn.quocviet.com/avatars/u101_small.jpg",
      "role": "STAFF",
      "permissions": [
        "action.checkin",
        "action.report",
        "view.news",
        "view.timesheet",
        "social.comment"
      ],
      "status": "ACTIVE",
      "dept_name": "Kỹ Thuật",
      "department": {
        "id": 5,
        "name": "Phòng Kỹ Thuật",
        "code": "TECH"
      },
      "hrm_info": {
        "employee_code": "QV101",
        "job_title": "Nhân viên IT",
        "current_shift": "HANH_CHINH",
        "is_remote_allowed": false,
        "checkin_radius_limit": 100
      },
      "settings": {
        "receive_noti": true,
        "language": "vi",
        "theme": "light"
      },
      "compliance": {
        "is_verified": true,
        "delete_scheduled_at": null
      },
      "security": {
        "last_login_at": "2026-01-21T18:00:00Z",
        "last_login_ip": "113.160.x.x"
      }
    }
  },
  "trace_id": "ulid_auth_login_001"
}
````

C. Zod Schema (Validation Rules)
Sử dụng để validate input tại UI và response từ API:

````
import { z } from 'zod';

/**
 * 1. SCHEMA CON (Sub-schemas)
 */
// Thông tin phòng ban
const DepartmentSchema = z.object({
  id: z.number(),           // ID phòng ban (số)
  name: z.string(),         // Tên phòng ban (Chuỗi)
  code: z.string(),         // Mã phòng (VD: "TECH")
});

// Thông tin nhân sự & chấm công (Quan trọng cho Smart Check-in)
const HrmInfoSchema = z.object({
  employee_code: z.string(),        // Mã nhân viên (VD: "QV101")
  job_title: z.string(),            // Chức danh
  current_shift: z.string(),        // Ca làm việc hiện tại
  is_remote_allowed: z.boolean(),   // Cho phép chấm công ở nhà? (true/false)
  checkin_radius_limit: z.number(), // Bán kính chấm công cho phép (mét)
});

// Cài đặt cá nhân
const SettingsSchema = z.object({
  receive_noti: z.boolean(),        // Nhận thông báo?
  language: z.string(),             // Ngôn ngữ (vi/en)
  theme: z.enum(['light', 'dark']).optional(), // Giao diện Sáng/Tối
});

// Tuân thủ kiểm duyệt (Store Compliance)
const ComplianceSchema = z.object({
  is_verified: z.boolean(),                 // Đã xác thực danh tính chưa
  delete_scheduled_at: z.string().nullable() // Ngày dự kiến xóa (null nếu ko xóa)
});

// Bảo mật
const SecuritySchema = z.object({
  last_login_at: z.string().datetime().optional(), // Thời gian đăng nhập cuối (ISO 8601)
  last_login_ip: z.string().optional(),            // IP đăng nhập cuối
});

/**
 * 2. USER SCHEMA (Đối tượng chính)
 */
export const UserSchema = z.object({
  // Định danh
  id: z.number(),
  ulid: z.string(), // ID dạng chuỗi bảo mật hơn

  // Thông tin cơ bản
  name: z.string(),
  email: z.string().email(), // Tự động kiểm tra định dạng email
  phone: z.string().nullable().optional(), // Có thể null hoặc không gửi
  avatar: z.string().url().nullable(),     // Phải là URL hợp lệ hoặc null

  // Phân quyền & Trạng thái
  role: z.enum(['STAFF', 'MANAGER', 'ADMIN']), // Chỉ chấp nhận 3 giá trị này
  permissions: z.array(z.string()), // Mảng các quyền (VD: ["action.checkin"])

  status: z.enum(['ACTIVE', 'BLOCKED', 'SCHEDULED_DELETE']),

  // Thông tin hiển thị nhanh
  dept_name: z.string(),

  // Các Object lồng nhau (Nested Objects)
  department: DepartmentSchema.optional(),
  hrm_info: HrmInfoSchema.optional(), // Có thể undefined nếu user là Admin/Guest
  settings: SettingsSchema.optional(),
  compliance: ComplianceSchema,       // Bắt buộc phải có để check luật Apple
  security: SecuritySchema.optional(),
});

/**
 * 3. LOGIN DATA SCHEMA
 * Cấu trúc phần "data" trong phản hồi login
 */
export const LoginDataSchema = z.object({
  access_token: z.string(),       // JWT Token
  token_type: z.literal('Bearer'),// Bắt buộc phải là chữ "Bearer"
  expires_in: z.number(),         // Thời gian hết hạn (giây)
  user: UserSchema,               // Object User đã định nghĩa ở trên
});

/**
 * 4. RESPONSE ENVELOPE SCHEMA
 * Cấu trúc bọc ngoài cùng của mọi API
 */
export const LoginResponseSchema = z.object({
  code: z.number(),                       // HTTP Status Code (200)
  status: z.enum(['success', 'fail', 'error']), // Trạng thái API
  message: z.string(),                    // Thông báo (VD: "Đăng nhập thành công")
  data: LoginDataSchema,                  // Dữ liệu chính
  trace_id: z.string(),                   // ID truy vết lỗi
});

// Xuất type để dùng trong TypeScript
export type User = z.infer<typeof UserSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
````

2.3. KIẾN TRÚC LƯU TRỮ HỖN HỢP (HYBRID STORAGE STRATEGY)
Xây dựng lớp vỏ bọc để AI không gọi lộn xộn giữa Secure và Async.
Yêu cầu kỹ thuật:

1. Tạo module StorageService.
2. Tách biệt rõ hai hàm: setToken() (Mã hóa) và setConfig() (Không mã hóa).
3. Cơ chế Fallback: AI phải viết logic kiểm tra Platform.OS. Nếu đang chạy trên Web (Antigravity Preview) mà SecureStore không hỗ trợ, phải tự động fallback sang localStorage hoặc cookie để không crash App.
4. Logic Cốt lõi (Core Logic)
Hệ thống không được gọi trực tiếp thư viện storage. Phải đi qua lớp trung gian StorageService.
• Logic Phân luồng (Branching Logic):
o Nếu dữ liệu là Token (access_token, refresh_token): BẮT BUỘC dùng SecureStore (Mã hóa).
o Nếu dữ liệu là Config (theme, last_email): Dùng AsyncStorage (Không mã hóa, tốc độ nhanh).
o Antigravity Guard (Quan trọng): Trên môi trường Web/Linux (Antigravity), SecureStore không hoạt động. Hệ thống phải tự động fallback sang localStorage hoặc AsyncStorage thường để Dev không bị chặn khi test.
5. Đặc tả Hàm & Luồng xử lý (Function Specification)
A. Hàm saveToken(token: string)
• Bước 1: Kiểm tra Platform.OS.
• Bước 2 - Nhánh Web/Antigravity:
o Gọi AsyncStorage.setItem('AUTH_TOKEN', token). (Chấp nhận rủi ro bảo mật ở môi trường Dev để đổi lấy khả năng chạy được).
• Bước 3 - Nhánh Mobile (iOS/Android):
o Gọi SecureStore.setItemAsync('AUTH_TOKEN', token).
o Yêu cầu: Cần bọc trong try-catch. Nếu thiết bị không hỗ trợ mã hóa (máy quá cũ), fallback về AsyncStorage nhưng ghi log cảnh báo.
B. Hàm getToken()
• Bước 1: Kiểm tra Platform.OS.
• Bước 2: Gọi hàm getItem tương ứng (như lúc save).
• Bước 3 - Null Check: Nếu không tìm thấy token, trả về null (Không được trả về undefined hay chuỗi rỗng "").
C. Hàm clearSession() (Dùng khi Logout)
• Logic: Phải xóa sạch CẢ HAI kho (Secure và Async).
o await SecureStore.deleteItemAsync('AUTH_TOKEN')
o await AsyncStorage.removeItem('USER_PROFILE')
• Lý do: Nếu chỉ xóa Token mà quên xóa Profile, lần sau mở app User vẫn thấy tên mình (Profile cũ) nhưng gọi API lại lỗi 401. Trải nghiệm rất tệ.
6. Cảnh báo Lỗi (Fail-Safe)
• CẤM: Không được sử dụng react-native-mmkv. Nếu phát hiện thư viện này trong package.json -> Báo lỗi Build ngay.
• Async: Tất cả hàm Storage phải là async/await vì thao tác đọc ghi đĩa không bao giờ là đồng bộ.
2.4: CHIẾN LƯỢC XÁC THỰC HỖN HỢP (HYBRID AUTH STRATEGY)
Mục tiêu: Đăng nhập thành công API thật trên mọi môi trường mà không bị Apple/Google chặn.
7. Logic Luồng Login Truyền Thống (User/Pass) - API AUTH-01
Đây là luồng "xương sống", chạy được trên cả Antigravity lẫn máy thật.
• Bước 1 - Validate:
o Sử dụng zod để kiểm tra: Email phải đúng định dạng, Pass > 6 ký tự.
o Nếu sai: Hiển thị lỗi màu đỏ ngay dưới ô input (Client-side validation). Không gọi API.
• Bước 2 - Gọi API:
o Gửi POST /api/v1/auth/login.
o Payload: { email, password, device_id: Constants.deviceId }.

• Bước 3 - Xử lý Response (Envelope):
o Nếu code == 200:
 Lưu access_token vào Storage (qua Facade 2.3).
 Lưu user (bao gồm permissions) vào useAuthStore (Zustand).
o Nếu code == 401: Hiển thị Toast "Sai tài khoản hoặc mật khẩu".
o Nếu code == 403 (Banned): Hiển thị Modal "Tài khoản bị khóa. Liên hệ Admin".
2. Logic Luồng Social Login (Antigravity Guard) - API AUTH-02
Đây là nơi dễ gây Crash nhất.
• Vấn đề: Trên Antigravity, bạn không thể mở App Google hay Apple để lấy identityToken.
• Giải pháp Logic (AI Instruction):
o Bước 1: Khi User bấm nút "Google Login".
o Bước 2: Kiểm tra cấu hình và môi trường.
    - Nếu `Env.EXPO_PUBLIC_ENABLE_GOOGLE_AUTH === false`: Ẩn hoặc chặn nút Google Login (Dùng cho App Store Submission).
    - Nếu `!Device.isDevice` (Môi trường ảo): KHÔNG gọi SDK Google. Thay vào đó, gọi thẳng API Login với tài khoản Test cứng.
    - Nếu là Máy thật: Gọi SDK GoogleSignin.signIn(). Lấy idToken. Gửi lên API Auth endpoint.
3. Logic Sinh trắc học (Biometrics)
• Bước 1 - Kiểm tra phần cứng:
o Gọi LocalAuthentication.hasHardwareAsync().
o Trên Antigravity: Luôn trả về false. -> Ẩn nút vân tay.
o Trên Máy thật: Trả về true -> Hiện nút vân tay.

• Bước 2 - Xác thực:
o Khi bấm nút -> Gọi authenticateAsync().
o Nếu thành công -> Lấy Token từ **StorageService.getItem('token')**.
o Lưu ý: Không bao giờ gửi vân tay lên Server. Server chỉ nhận Token qua Header Authorization.
4. Logic Tuân thủ Apple/Google (Compliance Logic)
AI phải tự động chèn các đoạn code sau vào UI:
• Privacy Policy Link:
o Ở cuối màn hình Login, phải có Text link dẫn đến trang web chính sách bảo mật.
o Sử dụng WebBrowser.openBrowserAsync(url) để mở, không dùng Linking.openURL (để user không bị thoát khỏi App).
• Nút Xóa Tài khoản (Delete Account):
o Đặt tại: ProfileScreen.
o Màu sắc: Đỏ (Destructive action).
o Logic gọi API AUTH-07 (Delete).
o Cảnh báo: Phải có Alert.alert xác nhận 2 lần: "Bạn chắc chắn muốn xóa? Dữ liệu không thể phục hồi."
________________________________________
2.5. THIẾT KẾ GIAO DIỆN & TRẢI NGHIỆM (UI/UX BLUEPRINT)
Áp dụng phong cách Glassmorphism đồng bộ. Giao diện sáng mặc định, có áp dụng chức năng darkmode
A. Màn hình Đăng nhập (Login Screen)
• Background: Gradient động (Blue + Purple blobs) trên nền xám nhạt #F5F5F7.
• Card trung tâm: Sử dụng component GlassCard (Reused from Core).
• Logo: Icon App có bóng đổ.
• Input Fields:
o Sử dụng react-hook-form kết hợp zod để validate.
o Style: Rounded-xl, Border mỏng.
• Action Buttons:
o Primary: "Đăng nhập" (Gradient Blue).
o Biometrics: Icon vân tay (Chỉ hiện nếu useSafeHardware trả về hasHardware: true).
• Compliance Footer (BẮT BUỘC):
o Dòng text nhỏ: "Bằng việc đăng nhập, bạn đồng ý với [Điều khoản] và [Chính sách bảo mật]".
o Hành động: Bấm vào mở WebBrowser (không thoát app).
B. Trải nghiệm Sinh trắc học (Biometric UX)
• Logic:
o Sau khi Login thành công lần đầu -> Hỏi "Bật đăng nhập nhanh?".
o Nếu đồng ý -> Lưu refresh_token vào SecureStore.
o Lần sau mở App -> Gọi authenticateAsync -> Nếu khớp -> Lấy token từ SecureStore -> Gọi API AUTH-06 (Get Me).
________________________________________
2.6. CƠ CHẾ PHÒNG VỆ & FAIL FAST (DEFENSIVE RULES)
Các quy tắc an toàn tuyệt đối cho môi trường Hybrid.

1. Strict Token Storage (Thay thế MMKV):
• Quy tắc: Tuyệt đối không lưu Access/Refresh Token vào AsyncStorage (dễ bị đọc trộm).
• Giải pháp: Sử dụng expo-secure-store.
• Antigravity Guard: Trên môi trường Web/Linux, SecureStore có thể không hoạt động. Phải viết hàm wrapper setSecureItem để fallback sang localStorage (chỉ trong môi trường Dev) để không crash App.

2. State Hydration Guard:
• Khi App khởi động, hệ thống phải chờ AuthStore load xong dữ liệu từ đĩa lên RAM.
• Hiển thị SplashScreen cho đến khi isHydrated = true. Tránh hiện tượng nhấp nháy màn hình Login rồi mới nhảy vào Home.
3. Hardware Guard (Biometric):
• Trước khi gọi authenticateAsync, bắt buộc kiểm tra !Device.isDevice.
• Nếu là Antigravity: Ẩn nút vân tay hoàn toàn (để tránh crash do gọi Native Module trên Linux).

________________________________________
2.7. KỊCH BẢN KIỂM THỬ (ACCEPTANCE CRITERIA)
Đảm bảo luồng chạy đúng với Real API.
• Happy Path: Nhập User/Pass thật (Database Laravel) -> Gọi API Login -> Lưu Token -> Chuyển vào Home. Tắt App mở lại -> Tự động vào Home (nhờ Token lưu trong SecureStore).
• Fail Path: Nhập sai Pass -> API trả 401 -> App hiện Toast lỗi đỏ (đọc từ message của Server).
• Network Path: Tắt mạng -> Bấm Login -> App báo "Không có kết nối" (nhờ Axios Interceptor/NetInfo), không được treo loading mãi mãi.
• Compliance Path: Bấm vào link "Chính sách bảo mật" -> Mở trình duyệt in-app thành công.
________________________________________

2.8. CƠ CHẾ "KILL SWITCH" & ĐIỀU HƯỚNG TỰ ĐỘNG
Mục tiêu: App phải tự động xử lý khi bị Server từ chối (Token hết hạn, Bị Ban).
A. Global Logout Interceptor (Cơ chế tự đăng xuất) Đây là logic nằm trong apiClient (Axios Interceptor). Frontend không được check 401 ở từng màn hình, mà phải check ở cổng mạng chung.
• Quy tắc:

1. Khi nhận response lỗi 401 Unauthorized hoặc 403 Forbidden từ bất kỳ API nào.
2. Hành động tức thì:
 Xóa sạch Token trong SecureStore.
 Xóa sạch User Profile trong AsyncStorage.
 Điều hướng ngay lập tức về LoginScreen.
 Hiển thị Toast: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
B. Post-Login Sequence Ngay sau khi Đăng nhập thành công, đừng vào Home ngay. Hãy thực hiện "Quy trình xin quyền" (Permission Priming) để Chương 3 hoạt động mượt mà.
• Logic:
3. Login thành công -> Lưu Token.
4. Check quyền: Camera và Location.
5. Nếu chưa cấp quyền:
 Hiện Modal giải thích: "App cần Camera để chấm công & Vị trí để xác thực."
 User bấm "OK" -> Gọi requestPermissionsAsync().
6. Mới cho vào HomeScreen.
• Lý do: Nếu để vào màn Chấm công mới xin quyền, User dễ bấm nhầm "Từ chối" và làm hỏng tính năng chính.
2.9. HƯỚNG DẪN THỰC THI CHO AI (AI PROMPT - FINAL)
Đây là lệnh chính xác để AI xây dựng module Auth kết nối Server thật.
"Dựa trên Hồ sơ thiết kế Chương 2 (Revised), hãy triển khai Module Auth kết nối Real Laravel API:
7. Cài đặt: npx expo install expo-secure-store expo-local-authentication expo-web-browser npm install @react-native-async-storage/async-storage react-hook-form zod (Lưu ý: KHÔNG cài react-native-mmkv).
8. Storage Layer (src/core/storage/index.ts):
o Viết hàm setToken/getToken sử dụng SecureStore.
o Thêm logic: Nếu Platform.OS === 'web', fallback sang localStorage để chạy được trên Antigravity Preview.
9. Data Layer (Real API):
o Tạo AuthRepository gọi apiClient.post('/auth/login').
o Input: { email, password, device_id }.
o Output: Map chính xác theo JSON Envelope: { code, data: { access_token, user } }.
10. UI Implementation:
o Code LoginScreen sử dụng GlassCard.
o Thêm link Privacy Policy ở cuối màn hình (Dùng expo-web-browser).
o Biometrics: Chỉ render nút vân tay nếu Device.isDevice === true VÀ hasHardware === true.
11. State Management:
o Setup `useAuthStore` (Zustand).
o Khi Login thành công: Sử dụng `StorageService` để lưu Token (Secure) và User (AsyncStorage). Tự động xử lý fallback trên các môi trường Simulator/Web.
12. Error Handling & Post-Login:
o Global Logout: In apiClient.ts, add a response interceptor. If error.response.status === 401, execute useAuthStore.getState().logout() immediately to clear data and redirect to Login.
o Permission Priming: After a successful login, check for Camera & Location permissions. If not granted, trigger a request dialog BEFORE navigating to the Home Screen. This prepares the app for the Attendance module.
Chương 3: Nghiệp vụ Chấm Công & Định Vị (Attendance Module)
3.1. ĐẶC TẢ KỸ THUẬT & THƯ VIỆN (TECH SPECS)
Yêu cầu AI/Dev sử dụng đúng bộ thư viện tương thích Expo SDK 53+.
Chức năng Thư viện / Công nghệ Lý do chọn & Lưu ý sống còn
Định danh expo-crypto Dùng randomUUID() để tạo Unique ID cho mỗi lần chấm công. Bắt buộc để hỗ trợ Offline Mode và chống duplicate.
Định vị expo-location Lấy tọa độ GPS và độ chính xác (accuracy). Phải bọc trong HardwareGuard.
Check thiết bị expo-device Phân biệt máy thật vs Simulator. Nếu là Simulator -> Tự động gửi cờ is_mock: true.
Mạng expo-network Kiểm tra trạng thái Internet để quyết định gọi API ngay hay lưu vào hàng đợi (Queue).
State TanStack Query Sử dụng useMutation với cơ chế retry và persist để xử lý đồng bộ ngầm.

3.2. HỢP ĐỒNG DỮ LIỆU (STRICT DATA CONTRACT)
Frontend chỉ thu thập dữ liệu thô (Raw Data). Server quyết định Đúng/Sai.
A. Dữ liệu Gửi đi (Request Payload)
Endpoint: POST /api/app/hrm/check-in

````
export interface CheckInPayload {
{
  "uuid": "string",         // BẮT BUỘC: UUID v4 (Unique per request)
  "latitude": 10.7626,      // GPS Latitude
  "longitude": 106.6601,    // GPS Longitude
  "is_mock": false,         // True nếu phát hiện Fake GPS hoặc chạy trên Simulator
  "device_info": {
    "model": "iPhone 15",
    "os": "iOS 17.2"
  }
}
````

B. Dữ liệu Phản hồi (Response)
Frontend dựa vào code để xử lý UI, không dựa vào text message.
Trường hợp Thành công (200 OK):

````
{
  "code": 200,
  "status": "success",
  "data": {
    "log_id": 998877,
    "time": "08:15:22",
    "type": "CHECK_IN", // Server tự detect IN hay OUT
    "status": "LATE",   // UI hiển thị màu Cam
    "status_label": "Đi muộn 15 phút",
    "office_name": "Văn phòng Chính",
    "distance_meters": 12.5 // Khoảng cách thực tế tính bởi Server
  }
}
````

Trường hợp Lỗi (Xử lý UI):
• 400 (Quá xa): Hiển thị Alert "Bạn đang cách văn phòng X mét".
• 403 (Fake GPS): Hiển thị Màn hình đỏ cảnh báo gian lận.
3.3. CHIẾN LƯỢC "HARDWARE GUARD" & ANTI-CHEAT
Để đảm bảo App chạy được trên cả Máy ảo (Antigravity) và Máy thật (Production) mà không Crash.
A. Hook useSafeLocation (An toàn tuyệt đối)
Logic xử lý trong src/core/hardware/useSafeLocation.ts:

1. Check Môi trường:
o Nếu !Device.isDevice (Simulator): Trả về tọa độ văn phòng (Mock) + is_mock: true. -> Giúp Dev test được luồng thành công.
2. Check Quyền (Máy thật):
o Gọi requestForegroundPermissionsAsync().
o Nếu từ chối: Ném lỗi PERMISSION_DENIED. UI hiển thị nút "Mở Cài đặt".
3. Lấy Tọa độ:
o Dùng getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).
o Nếu location.mocked === true: Gán is_mock: true.
B. Logic Server-Authority (Server quyết định)
• Cũ: Client tính khoảng cách -> Nếu xa thì chặn. (Dễ bị hack bằng cách sửa code JS).
• Mới: Client LUÔN GỬI tọa độ lên Server. Server tính toán và trả về kết quả.
o Nếu Server trả 200: Chúc mừng.
o Nếu Server trả 400: Hiển thị lỗi từ Server.

________________________________________
3.4. THIẾT KẾ GIAO DIỆN (UI BLUEPRINT)
Màn hình CheckInScreen.tsx chia làm 3 trạng thái chính:

1. State: IDLE (Chờ chấm công)
o Hiển thị Map (hoặc Ảnh văn phòng).
o Hiển thị: "Độ chính xác GPS: 10m" (Xanh lá).
o Nút to: "CHẤM CÔNG".
2. State: LOADING (Đang xử lý)
o Disable nút bấm.
o Hiển thị Spinner "Đang định vị & Đồng bộ...".
3. State: OFFLINE (Mất mạng)
o Phát hiện qua NetInfo.
o Nút đổi màu Vàng: "LƯU OFFLINE".
o Hiển thị Toast: "Đã lưu vào hàng đợi. Sẽ gửi khi có mạng."

________________________________________
3.5. CƠ CHẾ OFFLINE & IDEMPOTENCY (QUAN TRỌNG)
Chấm công không được phép thất bại do rớt mạng mạng.
Quy trình 4 Bước:

1. Bước 1 (User bấm nút): App sinh ngay UUID (ví dụ: abc-123).
2. Bước 2 (Gửi Request): Gọi API kèm UUID.
3. Bước 3 (Mất mạng):
o React Query (Persist Client) lưu request này vào bộ nhớ máy.
o UI báo "Đã chấm công (Offline)".
4. Bước 4 (Có mạng lại):
o App tự động gửi lại request cũ (kèm UUID cũ).
o Backend kiểm tra: "UUID abc-123 đã tồn tại chưa?".
o Nếu có rồi -> Trả về kết quả cũ (Thành công).
o Nếu chưa -> Tạo mới.
o Kết quả: Không bao giờ bị trùng 2 lần chấm công.

________________________________________
3.6. HƯỚNG DẪN THỰC THI CHO AI (AI PROMPT)
Copy đoạn này cho AI để triển khai Frontend:
"Dựa trên Hồ sơ thiết kế Chương 3 (Revised V2) và Backend API /api/app/hrm/check-in, hãy triển khai Frontend:

1. Cài đặt: npx expo install expo-location expo-device expo-crypto expo-network.
2. Core Logic:
o Tạo src/core/hardware/useSafeLocation.ts: Xử lý lấy GPS an toàn, tự động Mock nếu là Simulator.
o Tạo src/data/hooks/useCheckIn.ts: Dùng TanStack Query useMutation. Tạo UUID bằng expo-crypto trước khi gọi API.
3. API Integration:
o Kết nối tới POST /api/app/hrm/check-in.
o Xử lý lỗi 400 (Quá xa) và 403 (Fake GPS) để hiện Alert.
4. UI Screen (CheckInScreen.tsx):
o Hiển thị trạng thái GPS.
o Nút bấm xử lý được cả Online (Gửi ngay) và Offline (Lưu Queue).
o Tuyệt đối không crash nếu User từ chối quyền GPS (Hiện nút Mở cài đặt)."
3.8. CƠ CHẾ OFFLINE & BACKGROUND SYNC Chấm công không được phép thất bại do lỗi mạng.
• Thư viện: @tanstack/react-query-persist-client (Đã cài ở Chương 1).
• Logic (Mutation):
5. Khi bấm "Check In": Gọi useMutation với networkMode: 'offlineFirst'.
6. Nếu có mạng: Gửi API ngay -> Trả về Success.
7. Nếu mất mạng:
 React Query tự động lưu Request vào AsyncStorage (Persist Cache).
 UI hiển thị: "Đã lưu chấm công (Chờ đồng bộ)".
 Khi có mạng lại: Hệ thống tự động đẩy request đi (Background Sync).

Chương 4: Quản lý Công việc & Số hóa Quy trình (Task Module)
4.1. ĐẶC TẢ KỸ THUẬT & THƯ VIỆN (TECH SPECS)
Yêu cầu AI/Dev sử dụng bộ thư viện tối ưu hiệu năng hiển thị.
Chức năng Thư viện / Công nghệ Lý do chọn (Fail Fast Standard)
Danh sách (List) @shopify/flash-list BẮT BUỘC: Thay thế FlatList. Nhanh gấp 5 lần, không bị trắng màn hình khi cuộn nhanh trên Android yếu/Simulator.
Xử lý ngày tháng date-fns Nhẹ hơn Moment.js. Dùng để tính toán "Deadline còn 2 ngày" hoặc "Quá hạn 5 phút".
Tab View react-native-pager-view Để vuốt qua lại giữa các tab "Việc cần làm" / "Việc đã giao" mượt mà.
Form nhâp liệu react-hook-form Quản lý form Tạo việc (Tiêu đề, Mô tả, Người nhận) hiệu năng cao.
File đính kèm expo-document-picker Chọn file đính kèm vào task. (Cần fallback trên Simulator nếu không có file system).
State Sync TanStack Query Dùng tính năng Optimistic Updates: Bấm "Hoàn thành" -> UI đổi màu ngay lập tức -> Mới gọi API.

4.2. HỢP ĐỒNG DỮ LIỆU (STRICT DATA CONTRACT)
Định nghĩa cấu trúc Task để đảm bảo FE/BE (Mock) khớp nhau từng milimet.
A. Mô hình Công việc (Task Entity)
File: src/modules/task/task.types.ts (mẫu)
Lưu ý: Client không được tự quy định màu sắc. Phải dùng màu do Server trả về.

````
export interface TaskUser {
  id: number;
  name: string;
  avatar: string; // URL
}

export interface Task {
  task_id: number;           // Khớp JSON: task_id (không phải id)
  title: string;             // "Thiết kế Banner"
  description_short: string; // Mô tả ngắn cho List view
  
  // Server-Driven UI Fields (Quan trọng)
  status_key: string;        // "in_progress" (Dùng để logic)
  status_name: string;       // "Đang thực hiện" (Dùng để hiển thị)
  status_color: string;      // "#3498db" (Dùng để tô màu Badge)
  
  priority: string;          // "high"
  priority_name: string;     // "Gấp"
  
  deadline: string;          // ISO Date
  deadline_text: string;     // "Còn 2 giờ" (Server tính sẵn)
  
  assignee: TaskUser;
  created_at: string;
}

export interface TaskListResponse {
  summary: { total: number; doing: number; late: number };
  tasks: Task[];
}
````

B. Payload Tạo/Sửa (Mutation)

````
export interface CreateTaskPayload {
  title: string;
  description: string;
  assignee_id: number;
  deadline: string;
  priority: TaskPriority;
  attachments?: any[]; // File object từ DocumentPicker
}
````

4.3. KIẾN TRÚC MOCK LOGIC (LOGIC-FIRST)
Vấn đề lớn nhất khi làm Mock là: Filter/Sort không chạy. AI thường hard-code trả về cả list. Chương này yêu cầu AI viết Logic giả lập Database ngay tại Frontend.
Sơ đồ luồng: TaskListScreen ➔ TaskService ➔ Mock Query Engine ➔ JSON Store.
Logic Giả lập Bộ lọc (Mock Engine)
Tại src/modules/task/services/task.mock.ts:
AI phải code hàm fetchTasks(filter) có logic sau:

1. Input: Nhận vào status ("TODO", "DONE") hoặc keyword ("Banner").
2. Process:
o Lấy toàn bộ mảng JSON gốc.
o Dùng array.filter() để lọc theo Status.
o Dùng string.includes() để tìm kiếm theo Title.
o Dùng array.sort() để sắp xếp Deadline gần nhất lên đầu.
3. Delay: setTimeout 500ms để giả lập mạng lag -> Test Skeleton Loading.
Ngoài ra, Vì App dựa vào Server để tô màu (status_color) và tính giờ (deadline_text), nên Mock Repository phải "thông minh" hơn.
Logic Mock (Yêu cầu AI thực hiện trong task.mock.ts): Thay vì chỉ trả về JSON tĩnh, Mock Repo phải chạy logic "giả lập Server":
4. Tính deadline_text: Dùng date-fns tính khoảng cách từ now đến deadline.
o Nếu < 0: Trả về "Quá hạn X ngày".
o Nếu > 0: Trả về "Còn X ngày".
5. Gán status_color:
o todo -> #95a5a6 (Xám)
o in_progress -> #3498db (Xanh dương)
o review -> #f1c40f (Vàng)
o done -> #2ecc71 (Xanh lá)
6. Filter: Lọc mảng theo status_key nếu có tham số filter.
4.4. THIẾT KẾ GIAO DIỆN (UI BLUEPRINT)
Sử dụng Layout Glassmorphism và màu sắc định danh.
A. Màn hình Danh sách (Task List)
7. Header:
o Thanh tìm kiếm (Search Bar) trong suốt (Glass).
o Bộ lọc ngang (Chips): [Tất cả] [Chờ duyệt] [Đang làm] [Quá hạn].
8. Danh sách (FlashList):
o Task Card:
 Nền trắng/80, bo góc rounded-2xl.
 Cạnh trái có vạch màu (Color Bar) chỉ mức độ ưu tiên: Đỏ (High), Vàng (Medium), Xanh (Low).
 Avatar người nhận bên phải.
 Deadline: Nếu quá hạn -> Hiển thị text Đỏ "Quá hạn 2 ngày".
9. Empty State: Nếu không có task -> Hiển thị hình minh họa (Vector) + Nút "Tạo việc ngay".
B. Màn hình Chi tiết (Task Detail)
10. Status Dropdown: Nút bấm đổi trạng thái ngay trên Header.
11. Tab View con:
o Tab Thông tin: Mô tả, File đính kèm.
o Tab Trao đổi: Khung chat comment (như Zalo).
o Tab Lịch sử: Log "A đã đổi trạng thái sang Done lúc 10:00".

Phần setting có thể để như sau:
A. Task List Item (Component: TaskCard.tsx)
• Container: GlassCard (bg-white/90).
• Header Card:
o Trái: Tiêu đề Task (Bold, truncate 2 dòng).
o Phải: Priority Badge (Icon Flag + màu theo Priority).
• Body Card:
o Dòng 1: description_short (Text xám nhỏ).
o Dòng 2:
 Icon Calendar + deadline_text. Logic UI: Nếu text chứa "Quá hạn" -> Tô màu đỏ. Nếu "Còn..." -> Tô màu xanh.
• Footer Card:
o Trái: Avatar Assignee (Circle 24px).
o Phải: Status Badge (Pill shape). Quan trọng: backgroundColor lấy trực tiếp từ item.status_color.
B. Deep Linking Integration
• Cấu hình src/app/[...unmatched].tsx hoặc useURL để bắt link.
• Quy tắc:
o URL: quocvietapp://task/501
o Hành động: App tự động navigate vào màn hình TaskDetailScreen và gọi API lấy chi tiết task 501.

________________________________________
4.5. CƠ CHẾ PHÒNG VỆ & HIỆU NĂNG (DEFENSIVE RULES)
Các quy tắc để App không bị "đơ" khi load nhiều việc.

1. Skeleton Loading Guard:
o Tuyệt đối không để màn hình trắng khi đang load API.
o Bắt buộc: Phải code TaskSkeletonItem (các khối xám nhấp nháy) và hiển thị nó khi isLoading === true.
2. Date Safety Guard:
o Ngày tháng từ Server có thể null hoặc sai format.
o Quy tắc: Tạo hàm formatDateSafe(dateString) trong src/core/utils/date.ts.
o Nếu date lỗi/null -> Trả về "Không có hạn". Không được crash app vì lỗi Invalid Date.
3. List Performance Guard:
o Với FlashList, bắt buộc phải set estimatedItemSize. Nếu AI quên -> App sẽ cảnh báo performance.
o Không render ảnh gốc quá lớn trong list. Dùng link ảnh thumbnail hoặc resizeMode="cover".
4. Optimistic UI (Trải nghiệm mượt):
o Khi user tích vào ô "Hoàn thành", App phải gạch chéo task ngay lập tức (Update Local State), không chờ Server phản hồi.
o Nếu Server lỗi -> Rollback lại trạng thái cũ và hiện Toast báo lỗi.
5. Null Safe Rendering:
o JSON assignee có thể null (việc chưa giao).
o Rule: Nếu assignee null, hiển thị Avatar mặc định (Icon User xám) và text "Chưa giao". Không được crash.
6. FlashList Configuration:
o Bắt buộc set estimatedItemSize={120} (Chiều cao trung bình của 1 card).
o Nếu không set, List sẽ bị nhảy (jump) khi scroll ngược lên.
7. File URI Guard (Cho Document Picker):
o Trên Android (Antigravity), URI trả về có thể là content://.
o Rule: Mock Repository phải chấp nhận cả file:// và content://. Không được validate cứng đuôi file (extension) vì content:// thường không có đuôi.

4.6. HƯỚNG DẪN THỰC THI CHO AI (AI PROMPT)
Copy lệnh này cho AI:
"Dựa trên Hồ sơ thiết kế Chương 4 (Task Module), hãy triển khai:

1. Cài đặt: npm install @shopify/flash-list date-fns react-native-pager-view expo-document-picker.
2. Data Layer:
• Tạo src/modules/task/task.types.ts khớp 100% với interface Task (có status_color, deadline_text).
• Tạo TaskMockRepository: Viết hàm giả lập logic Server (tự động tính deadline_text dựa trên ngày hiện tại và gán màu status_color theo trạng thái).
3. Mock Logic: Viết hàm getTasks(filter) trong Mock Repo có khả năng lọc mảng JSON theo status và search keyword. Giả lập delay 1s.
4. UI Component:
o TaskCard.tsx: Dùng Glassmorphism, hiển thị vạch màu Priority.
o TaskList.tsx: Dùng @shopify/flash-list với estimatedItemSize={100}.
o TaskSkeleton.tsx: Hiển thị khi đang load.
o Dùng lucide-react-native: Icon Calendar cho hạn chót, Flag cho độ ưu tiên.
5. Utils: Viết helper getDeadlineText(date) dùng date-fns để trả về 'Hôm nay', 'Ngày mai', hoặc 'Quá hạn X ngày'.
6. List View:
• Sử dụng @shopify/flash-list hiển thị danh sách.
• Implement RefreshControl để kéo xuống reload lại Mock Data.
7. Deep Link:
• Cấu hình expo-linking để log ra console khi user mở app bằng link quocvietapp://task/123."
8. Lưu ý: Xử lý trường hợp danh sách rỗng (Empty State) đẹp mắt."

CHƯƠNG 5: CHIẾN LƯỢC DỮ LIỆU & ĐỒNG BỘ (OFFLINE-FIRST)
Mục tiêu: App phải hiển thị dữ liệu ngay lập tức (dù không có mạng) và tự động gửi dữ liệu chờ (Pending) khi có mạng trở lại.
5.1. KIẾN TRÚC LƯU TRỮ (CACHE STRATEGY)
Chúng ta chia dữ liệu làm 2 loại để xử lý:
Loại Dữ liệu Ví dụ Chiến lược Offline Công nghệ
Server State (Dữ liệu từ Server) Danh sách Task, Lịch sử chấm công, Profile. Cache-First: Luôn hiển thị dữ liệu cũ trong Cache trước, sau đó âm thầm fetch mới (Background Refetch). TanStack Query + AsyncStorage Persister
Client State (Hành động của User) Lệnh Check-in, Tạo Task mới, Submit Form. Queue (Hàng đợi): Lưu vào hàng đợi "Pending". Khi có mạng -> Tự động bắn API. Zustand + Persist Middleware
Công nghệ sử dụng (tech stack)
• Quản lý Server State: @tanstack/react-query (v5).
• Plugin lưu trữ: @tanstack/react-query-persist-client.
• Kho lưu trữ: @react-native-async-storage/async-storage (Tương thích Expo Go).
• Network Listener: expo-network (Để lắng nghe trạng thái mạng).
5.2. KIẾN TRÚC "OFFLINE-FIRST"
Chúng ta chia dữ liệu làm 2 luồng: Đọc (Read) và Ghi (Write).
A. Luồng Đọc (Caching Strategy - stale-while-revalidate)
• Cơ chế: Khi mở App, hiển thị ngay dữ liệu từ AsyncStorage (cũ cũng được). Sau đó âm thầm gọi API lấy dữ liệu mới. Nếu có mới -> Tự động cập nhật UI.
• Cấu hình cacheTime: 24h (Dữ liệu tồn tại trong máy 1 ngày).
• Cấu hình staleTime: 5 phút (Trong 5 phút đầu, không gọi lại API để tiết kiệm pin/data).
B. Luồng Ghi (Mutation Queue)
• Vấn đề: User bấm "Check-in" khi mất mạng.
• Giải pháp:

1. Optimistic Update: App báo "Check-in thành công" ngay lập tức trên UI.
2. Pause Mutation: React Query phát hiện mất mạng -> Tạm dừng request.
3. Queue: Request nằm trong hàng đợi, được lưu vào AsyncStorage.
4. Resume: Khi có mạng (NetInfo báo Online) -> React Query tự động đẩy request đi.

5.3. CẤU HÌNH QUERY CLIENT (FILE CODE MẪU)
Yêu cầu AI thay thế file src/config/query-client.ts bằng nội dung này để kích hoạt Offline Mode.

````
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

// 1. Cấu hình thời gian Cache
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // Giữ rác 24h (Garbage Collection)
      staleTime: 1000 * 60 * 5,    // Dữ liệu cũ sau 5 phút
      retry: 2,                    // Thử lại 2 lần nếu lỗi
      networkMode: 'offlineFirst', // QUAN TRỌNG: Cho phép chạy khi offline
    },
    mutations: {
      networkMode: 'offlineFirst', // Cho phép bấm nút khi offline
      retry: 3,                    // Tự động retry khi có mạng
    },
  },
});

// 2. Cấu hình Persister (Lưu vào ổ cứng)
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 3000, // Chỉ lưu xuống đĩa mỗi 3s để đỡ lag
});

// 3. Auto Refetch khi App focus trở lại
AppState.addEventListener('change', (status) => {
  if (status === 'active') {
    queryClient.invalidateQueries(); // Refresh dữ liệu khi mở lại app
  }
});
````

5.4. SETUP "NGƯỜI GÁC CỔNG MẠNG" (NETWORK GUARD)
Tạo file src/core/hooks/useNetworkStatus.ts. Hook này giúp App biết khi nào cần Sync.
Logic yêu cầu AI code:

````
import * as Network from 'expo-network';
import { onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useNetworkStatus() {
  useEffect(() => {
    // 1. Lắng nghe trạng thái mạng
    // Note: Expo Go cần config đặc biệt để bắt sự kiện real-time
    const interval = setInterval(async () => {
      const status = await Network.getNetworkStateAsync();
      // Báo cho React Query biết để nó tự pause/resume request
      onlineManager.setOnline(!!status.isConnected && !!status.isInternetReachable);
    }, 5000); // Check mỗi 5s

    return () => clearInterval(interval);
  }, []);
}
````

5.5. QUY TRÌNH "SYNC" SAU KHI CÓ MẠNG (SYNC PROTOCOL)
Để đảm bảo dữ liệu toàn vẹn khi kết nối lại:

1. Bước 1 (Resume): React Query tự động đẩy các Mutation (Lệnh Ghi) đang chờ trong hàng đợi.
2. Bước 2 (Refresh): Sau khi đẩy xong, App tự động gọi queryClient.invalidateQueries() để tải dữ liệu mới nhất từ Server về (phòng trường hợp dữ liệu trên Server đã bị người khác sửa).
3. UI Feedback: Hiển thị một Toast nhỏ góc dưới: "Đã đồng bộ dữ liệu" để User yên tâm.

Chương 6: Số hóa Quy trình & Form Động (Request Module)

5.1. ĐẶC TẢ KỸ THUẬT & THƯ VIỆN (TECH SPECS)
Yêu cầu sử dụng các thư viện hỗ trợ render form linh hoạt và xử lý file.
Chức năng Thư viện / Công nghệ Lý do chọn (Fail Fast Standard)
Quản lý Form react-hook-form BẮT BUỘC: Quản lý state của form động (dynamic fields) hiệu quả nhất.
Schema Validation zod Validate dữ liệu form thay đổi theo từng loại đơn (Conditional Validation).
Chọn File/Ảnh expo-image-picker & expo-document-picker Cho phép user chụp hóa đơn hoặc chọn file PDF từ máy.
Xem ảnh/PDF react-native-image-viewing Xem trước (Preview) ảnh hóa đơn khi bấm vào.
Bàn phím react-native-keyboard-aware-scroll-view Giải quyết triệt để vấn đề bàn phím che nút Submit trên các form dài.
Form UI Components Factory Tự xây dựng cơ chế render: Nhận JSON -> Trả về Input/Datepicker/UploadButton tương ứng.

5.2. HỢP ĐỒNG DỮ LIỆU (STRICT DATA CONTRACT)
Định nghĩa cấu trúc cho Form Động. Server (Mock) sẽ trả về cấu hình form.
A. Cấu hình Form (Form Schema - Server Driven)
File: src/modules/request/request.types.ts

````
export type FieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'DATE_RANGE' | 'PHOTO' | 'MONEY';

// Định nghĩa 1 trường nhập liệu
export interface FormFieldConfig {
  name: string;             // VD: "reason", "total_amount"
  label: string;            // VD: "Lý do", "Số tiền"
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];       // Cho dropdown
}

// Định nghĩa Loại đơn (Request Type)
export interface RequestTypeConfig {
  type_key: string;         // "leave_absence", "payment"
  type_name: string;        // "Xin nghỉ phép"
  fields: FormFieldConfig[]; // Danh sách các trường cần nhập
}
````

B. Chi tiết Đơn & Timeline (Chiều Đọc - Mới Bổ Sung)
Cấu trúc này khớp với JSON request_detail trong Đặc tả API.

````
export interface ApprovalStep {
  step: number;
  approver: string;         // "Trần Văn Sếp"
  action: string;           // "Chờ duyệt", "Đã duyệt"
  time: string | null;      // "10:00 30/12"
  status: 'done' | 'current' | 'pending'; // Dùng để tô màu (Xanh/Vàng/Xám)
}
export interface RequestDetail {
  request_id: number;
  type_name: string;        // "Xin nghỉ phép"
  status_key: string;       // "pending"
  status_name: string;      // "Chờ duyệt"
  status_color: string;     // "#f1c40f"
  
  // Dữ liệu động (Render dạng Key-Value)
  details: Record<string, any>; 
  
  // Quy trình duyệt (Render Timeline)
  approval_flow: ApprovalStep[];
  
  attachments: string[];    // URL file
}
````

C. Payload Gửi đi (Submit Payload)

````
export interface CreateRequestPayload {
  type_key: string;         // Loại đơn
  data: Record<string, any>; // Dữ liệu động: { reason: "...", amount: 500000 }
  attachments: string[];    // Mảng URL file (sau khi đã upload xong)
}
````

5.3. KIẾN TRÚC MOCK LOGIC (UPLOAD SIMULATION)
Trên môi trường Antigravity hoặc chưa có Server, việc upload file thật là không thể. Cần cơ chế Mock Upload.
Sơ đồ luồng: FormScreen ➔ FileService.upload() ➔ Mock Upload Engine ➔ Fake URL.
A. Chiến lược Mock Upload
Tại src/core/services/file.mock.ts: AI phải code hàm mockUpload(fileUri) xử lý được cả content:// (Android Antigravity):

1. Input: Nhận URI (file:// hoặc content://).
2. Validation: Kiểm tra file size (giả lập) hoặc đuôi file.
3. Process:
o setTimeout 1.5 giây (Giả lập mạng 4G upload).
o Trả về URL giả: <https://mock-server.com/uploads/file_${Date.now()}.jpg>.
o Lưu ý: Không cần upload thật, chỉ cần trả về string URL để Form lưu lại.
4. UI Feedback: Trong lúc chờ, UI phải hiện thanh Progress Bar chạy từ 0% -> 100%.

________________________________________

5.4. THIẾT KẾ GIAO DIỆN (UI BLUEPRINT)
Sử dụng Factory Pattern để render form.
A. Màn hình Tạo đơn (Create Request Screen)

1. Dropdown chọn loại đơn:
o Khi user chọn "Xin nghỉ phép" -> Gọi hàm getFormConfig('leave_absence').
o Lấy về mảng fields từ Mock Data.
2. Dynamic Form Container:
o Chạy vòng lặp qua mảng fields.
o Switch Case:
 Nếu type === 'DATE': Render component <DateInput />.
 Nếu type === 'MONEY': Render component <CurrencyInput />.
 Nếu type === 'PHOTO': Render component <UploadWidget />.
3. Form Factory: Component nhận vào type và trả về Input tương ứng.
o MONEY type: Phải tự động format 100000 -> 100.000 đ khi gõ, nhưng giá trị lưu vào form là số 100000.
4. Submit Button:
o Trạng thái disabled khi formState.isValid === false.
o Trạng thái loading khi đang upload ảnh.

5. Nút Gửi: Disabled nếu form chưa hợp lệ (check bằng react-hook-form + zod).
B. Màn hình Chi tiết (Request Detail)
6. Timeline (Quy trình duyệt):
o Vẽ sơ đồ dọc: [User Tạo] -> [Quản lý Duyệt] -> [Giám đốc Duyệt].
o Vẽ một đường kẻ dọc bên trái.
o Các node (chấm tròn):
7. Màu xanh (done): Đã xong.
8. Màu vàng (current): Đang đợi người này.
9. Màu xám (pending): Bước tương lai.
10. File đính kèm: Hiển thị dạng Thumbnail nhỏ, bấm vào phóng to toàn màn hình.

________________________________________
5.5. CƠ CHẾ PHÒNG VỆ (DEFENSIVE RULES)

1. Data Coercion Guard (Zod):
o Các trường số (NUMBER, MONEY) từ Input thường trả về String.
o Bắt buộc: Dùng zod.preprocess() để chuyển đổi sang Number trước khi validate.
o Ví dụ AI prompt: amount: z.preprocess((val) => Number(val), z.number().min(1000))

2. Form Reset Guard:
o Khi User đổi loại đơn (VD: từ Nghỉ phép -> Thanh toán), BẮT BUỘC phải reset toàn bộ dữ liệu form cũ. Nếu không, dữ liệu rác (VD: start_date) sẽ bị gửi kèm sang đơn Thanh toán.
3. Upload Guard:
o Không cho phép gửi đơn khi file đang upload (chưa có URL).
o Button "Gửi" phải hiển thị Loading khi đang upload ảnh.
4. Keyboard Guard:
o Với form dài, bàn phím sẽ che mất ô nhập dưới cùng.
o Bắt buộc: Bọc toàn bộ Form trong KeyboardAwareScrollView (thư viện react-native-keyboard-aware-scroll-view hoặc cấu hình KeyboardAvoidingView chuẩn).

________________________________________
5.6. HƯỚNG DẪN THỰC THI CHO AI (AI PROMPT)
Copy lệnh này cho AI:
"Dựa trên Hồ sơ thiết kế Chương 5 (Request Module), hãy triển khai:

1. Cài đặt: npm install expo-image-picker expo-document-picker react-hook-form zod react-native-keyboard-aware-scroll-view.
2. Data Layer:
o Định nghĩa FormFieldConfig, RequestTypeConfig và quan trọng là RequestDetail (bao gồm approval_flow).
o Tạo RequestMockRepository trả về cấu hình form cho 2 loại: 'Nghỉ phép' (Date Range, Lý do) và 'Thanh toán' (Số tiền, Ảnh hóa đơn).
3. Mock Upload: Tạo service mockUpload giả lập delay 2s và trả về URL ảnh giả, chấp nhận cả URI content:// (Android).
4. UI Component (Dynamic Engine):
o Tạo FormFactory.tsx: Nhận vào fieldConfig và render component tương ứng.
o Component UploadWidget.tsx: Có thanh progress bar giả lập.
o Xử lý Zod Schema động: Tạo hàm generateSchema(fields) để biến mảng config thành Zod Object. Lưu ý dùng z.preprocess để ép kiểu số.
5. Screen: Màn hình CreateRequestScreen và RequestDetailScreen sử dụng useWatch để theo dõi loại đơn và render lại form tương ứng.
6. Lưu ý:
o Xử lý KeyboardAwareScrollView để không bị che bàn phím."
o Test kỹ KeyboardAwareScrollView để không bị che nút Gửi."

BẢNG TỔNG HỢP CÁC THƯ VIỆN SỬ DỤNG
7. NHÓM CORE & NAVIGATION (NỀN TẢNG)
Đây là khung sườn bắt buộc để App chạy được.
Thư viện Mục đích sử dụng Nguồn tham chiếu
expo Framework chính (SDK 53+).  1
expo-router Điều hướng màn hình dựa trên file (File-based routing).  2
expo-linking Xử lý Deep Linking (VD: quocvietapp://task/123).  3
react-native-safe-area-context Xử lý hiển thị trên các máy có tai thỏ/Dynamic Island.  4
react-native-screens Tối ưu hóa bộ nhớ cho các màn hình điều hướng.  5
expo-constants Lấy thông tin cấu hình hệ thống.  6
expo-status-bar Quản lý thanh trạng thái pin/sóng.  7

1. NHÓM UI & STYLING (GIAO DIỆN GLASSMORPHISM)
Bộ công cụ để render giao diện đẹp như file App.js.
Thư viện Mục đích sử dụng Nguồn tham chiếu
nativewind (v4) Viết style bằng class TailwindCSS (Chuẩn mới).  8
tailwindcss Core engine của NativeWind.  9
react-native-reanimated Xử lý hiệu ứng mượt mà (60fps), bắt buộc cho NativeWind v4.  10
lucide-react-native Bộ icon hiện đại, nét mảnh (Khớp với thiết kế App.js).  11
react-native-svg Thư viện hỗ trợ để hiển thị Icon và đồ họa vector.  12
clsx, tailwind-merge Tiện ích gộp class style động (VD: đổi màu khi active).  13

2. NHÓM STATE & DATA MANAGEMENT (DỮ LIỆU)
Quản lý luồng dữ liệu theo kiến trúc Mock-First.
Thư viện Mục đích sử dụng Nguồn tham chiếu
axios Gọi API HTTP, xử lý Interceptor (Token).  14
@tanstack/react-query Quản lý Server State, Caching, Auto-refetch.  15
@tanstack/react-query-persist-client Hỗ trợ lưu Cache xuống máy để chạy Offline.  16
zustand Quản lý Global State (User Session, Theme) - Nhẹ hơn Redux.  17
date-fns Xử lý ngày tháng (Tính deadline, format giờ).  18
zod Validate dữ liệu JSON từ API (Phòng vệ Runtime).  19
3. NHÓM STORAGE & FORM (LƯU TRỮ & NHẬP LIỆU)
Đã điều chỉnh để tương thích Expo Go (Thay thế MMKV trong môi trường ảo).
Thư viện Mục đích sử dụng Nguồn tham chiếu
expo-secure-store Lưu Token đăng nhập an toàn (Thay thế MMKV cho Expo Go).  20
@react-native-async-storage/async-storage Lưu Config, Cache không nhạy cảm.  21
react-hook-form Quản lý Form nhập liệu hiệu năng cao.  22
react-native-keyboard-aware-scroll-view Chống bàn phím che mất ô nhập liệu trên Form dài.  23

4. NHÓM HARDWARE & NATIVE FEATURES (PHẦN CỨNG)
Các thư viện tương tác với thiết bị.
Thư viện Mục đích sử dụng Nguồn tham chiếu
expo-camera Sử dụng component <CameraView> để chấm công.  24
expo-location Lấy tọa độ GPS (Geofencing).  25
expo-local-authentication Đăng nhập bằng Vân tay/FaceID.  26
expo-image-manipulator Nén và crop ảnh trước khi upload.  27
expo-document-picker Chọn file đính kèm (PDF, Word) cho Task/Request.  28
expo-image-picker Chọn ảnh từ thư viện hoặc chụp ảnh hóa đơn.  29
expo-file-system Quản lý file tạm.  30
expo-device Phát hiện đang chạy trên Máy ảo hay Máy thật (để Mock phần cứng).  31
react-native-maps Hiển thị bản đồ (Có cơ chế fallback nếu thiếu Key).  32
react-native-image-viewing Xem trước (Preview) ảnh phóng to.  33
5. NHÓM PERFORMANCE & LIST (HIỆU NĂNG)
Xử lý danh sách lớn mượt mà.
Thư viện Mục đích sử dụng Nguồn tham chiếu
@shopify/flash-list Thay thế FlatList, render danh sách Task cực nhanh.  34
react-native-pager-view Xử lý Tab vuốt qua lại (Swipe) mượt mà.  35
6. NHÓM DEVOPS & NOTIFICATION (VẬN HÀNH)
Lưu ý: Nhóm này yêu cầu Development Build để chạy full tính năng.
Thư viện Mục đích sử dụng Nguồn tham chiếu
expo-notifications Nhận thông báo đẩy (Push Notification).  36
expo-updates Cập nhật app từ xa (OTA) không cần lên Store.  37

CHƯƠNG 7: PHÁT HÀNH & VẬN HÀNH (DEPLOYMENT STRATEGY)
GOOGLE PLAY
6.1. ĐIỀU KIỆN TIÊN QUYẾT (PREREQUISITES)
Các tài khoản và chứng chỉ bắt buộc phải có trước khi ra lệnh cho AI build.
Hạng mục Chi phí / Yêu cầu Ghi chú quan trọng (Fail Fast)
Tài khoản Google Play Console $25 (Trả 1 lần) Cần thẻ VISA/Mastercard. Google xét duyệt mất 1-3 ngày. 1
Tài khoản Expo Miễn phí Đăng ký tại expo.dev để quản lý bản build.
EAS CLI Miễn phí Công cụ dòng lệnh để đẩy code lên mây.
File Cấu hình Firebase google-services.json BẮT BUỘC: Phải có file này ở thư mục gốc thì mới build được (do dính module Push Notification). 2

6.2. CẤU HÌNH NHẬN DIỆN ỨNG DỤNG (APP IDENTITY)
Định danh App phải duy nhất toàn cầu. Nếu trùng, Google sẽ từ chối file build.
A. Cấu hình app.json (Android Config)
Yêu cầu AI kiểm tra file app.json và đảm bảo các trường sau được điền chính xác:

````
{
  "expo": {
    "name": "Quốc Việt Super App",
    "slug": "quocvietsuperapp",
    "version": "1.0.0",
    "android": {
      "package": "com.qvc.quocvietsuperapp",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "USE_BIOMETRIC",
        "USE_FINGERPRINT"
      ]
    }
  }
}
````

Lưu ý: package bắt buộc là com.qvc.quocvietsuperapp.
________________________________________
6.3. CHIẾN LƯỢC BUILD ĐÁM MÂY (EAS BUILD STRATEGY)
Thay vì build trên máy (Antigravity), ta gửi lệnh lên Server Expo.
A. Cấu hình eas.json (Build Profile)
AI cần tạo file eas.json với 2 profile rõ ràng:

1. Development Profile:
o Mục đích: Để Dev test trên máy thật (có tính năng "lắc để debug").
o Build Type: apk (Cài trực tiếp).
o Tham chiếu: Đã dùng trong tài liệu Push Notification.
2. Production Profile (Dùng cho Chương 6):
o Mục đích: Để upload lên Google Play.
o Build Type: aab (Android App Bundle). Lưu ý: Google Play năm 2026 bắt buộc dùng .aab, không nhận .apk.
o Credentials: Để EAS tự quản lý Keystore (Auto Managed).
AI cần tạo file eas.json với cấu trúc sau:

````
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "node": "18.18.0",
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "EXPO_PUBLIC_USE_MOCK": "false" 
      }
    }
  },
  "submit": {
    "production": {}
  }
}
````

• Production Profile: Build ra .aab (Android App Bundle) theo chuẩn Google Play 2026.
• Auto Increment: Tự động tăng versionCode (1 -> 2 -> 3) mỗi lần build.
B. Quản lý Khóa ký (Signing Keystore)
Đây là "chìa khóa" chứng minh bạn là chủ App. Nếu mất chìa này, bạn vĩnh viễn không thể update App.
• Chiến thuật: Chọn EAS Managed Credentials. Expo sẽ tự sinh khóa, lưu trữ an toàn trên Cloud. Bạn không cần lo mất file keystore.
• Khi chạy lệnh build lần đầu, chọn "Y" (Yes) để Expo tự sinh khóa và lưu trữ an toàn. Không tự tạo khóa tay để tránh mất mát.
________________________________________

6.4. QUY TRÌNH PHÁT HÀNH (DEPLOYMENT PIPELINE)
Các bước thực hiện tuần tự để đảm bảo thành công.
Bước 0: Đồng bộ Git (CRITICAL STEP)
• Môi trường Antigravity yêu cầu mọi thay đổi phải được commit.
• Chạy lệnh: git add . && git commit -m "Ready for deployment" trước khi chạy bất kỳ lệnh eas nào.
Bước 1: Login & Setup Secrets
• Chạy eas login để kết nối tài khoản.
• Chạy eas project:init để lấy Project ID.
• Bơm biến môi trường Production (API thật):
o Lệnh: eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "<https://api.quocviet.com/v1>" --type string
o Lý do: Để khi build trên mây, App biết đường gọi API thật thay vì localhost
Bước 2: Build Production
• Chạy lệnh: eas build --platform android --profile production
• Hệ thống sẽ:

1. Upload code lên Cloud.
2. Tải thư viện (npm install).
3. Inject biến EXPO_PUBLIC_API_URL từ Secret
4. Build Native Android (Gradle).
5. Ký ứng dụng bằng Keystore.
6. Trả về link tải file .aab.
Bước 3: Upload lên Store (Lần đầu thủ công)
Do lần đầu Google đòi hỏi khai báo An toàn dữ liệu, Chính sách quyền riêng tư, nên lần đầu không thể tự động hóa 100%.
a. Sau khi build xong, chạy lệnh: eas submit --platform android
b. Hệ thống sẽ tự động upload file .aab vào Google Play Console (cần file service-account-key.json của Google Play API - AI sẽ hướng dẫn tạo nếu chưa có)
c. Tải file .aab từ Expo về máy.
d. Truy cập Google Play Console -> Tạo Ứng dụng.
e. Vào mục Production -> Tạo bản phát hành mới -> Upload file .aab.
f. Điền thông tin Store (Ảnh chụp màn hình, Mô tả, Chính sách bảo mật).
g. Gửi xét duyệt (Review).

________________________________________
6.5. CHIẾN THUẬT CẬP NHẬT "SIÊU TỐC" (OTA UPDATES)
Giúp bạn sửa lỗi nóng (Hotfix) mà không cần chờ Google xét duyệt lại (tiết kiệm 2-3 ngày).
Cấu hình:

1. Cài thư viện expo-updates (Đã cài ở Chương 1).
2. Trong app.json, cấu hình updates.url trỏ về dự án Expo.

````
"updates": {
  "url": "https://u.expo.dev/your-project-id",
  "enabled": true,
  "checkAutomatically": "ON_LOAD",
  "fallbackToCacheTimeout": 0
}
````

Quy trình Fix lỗi:

1. Dev sửa code JS (Ví dụ: Sửa màu nút, sửa lỗi tính toán).
2. Chạy lệnh: eas update --branch production --message "Fix bug checkout".
3. Kết quả: User mở App lên sẽ tự động tải bản vá mới về.

________________________________________

6.6. CƠ CHẾ PHÒNG VỆ (DEFENSIVE RULES)
Package Name Consistency Guard:
o Rủi ro: File google-services.json (Firebase) có package name là com.keodika01... nhưng app.json là com.qvc....
o Hậu quả: Build thành công nhưng App crash ngay khi mở vì sai cấu hình Push Notification.
o Quy tắc: AI phải nhắc user mở file google-services.json kiểm tra dòng "package_name": "com.qvc.quocvietsuperapp" trước khi build.
o Git Ignore Guard: Kiểm tra file .gitignore. Đảm bảo dòng google-services.json KHÔNG TỒN TẠI (hoặc bị comment lại) để file này được đẩy lên Cloud Build.
Version Bump Guard:
o Google Play sẽ từ chối thẳng thừng nếu bạn upload file có versionCode trùng với bản cũ.
o Quy tắc: Trong eas.json, cấu hình "autoIncrement": true. Mỗi lần chạy lệnh build, Expo tự động tăng số này lên (1 -> 2 -> 3).
Asset Guard:
o Nếu thiếu Icon hoặc Splash Screen, App sẽ bị từ chối hoặc hiển thị xấu.
o Bắt buộc: AI phải chạy lệnh npx expo-image-assets (hoặc tương đương) để tạo đủ bộ icon cho các kích thước màn hình.
Environment Guard (Secret Check):
o Rủi ro: Quên set API URL thật, App Production vẫn gọi vào localhost.
o Khi build Production, biến EXPO_PUBLIC_API_URL phải trỏ về Server thật, không được trỏ về localhost hay Mock Data.
o Kiểm tra kỹ file .env trước khi build.
o Trong eas.json profile production, ép buộc EXPO_PUBLIC_USE_MOCK: "false".
________________________________________

6.7. HƯỚNG DẪN THỰC THI CHO AI (AI PROMPT)
Copy lệnh này cho AI để thực hiện quy trình Build:
"Dựa trên Hồ sơ thiết kế Chương 6 (Deployment), hãy thực hiện:

1. Kiểm tra điều kiện:
o Xác nhận file app.json có android.package là com.qvc.quocvietsuperapp.
o Yêu cầu User xác nhận file google-services.json đã được tải lại từ Firebase với package name mới này chưa.
o Xác nhận file google-services.json đang nằm ở thư mục gốc.
2. Cấu hình EAS:
o Cài đặt eas-cli toàn cục “npm install --save-dev eas-cli”. Sau đó dùng lệnh npx eas build ... để đảm bảo luôn chạy được.
o Tạo file eas.json. Định nghĩa profile production với buildType: "app-bundle", autoIncrement: true (để ra file .aab).
o Thêm biến môi trường EXPO_PUBLIC_USE_MOCK: "false" vào profile production trong eas.json.
o Cấu hình autoIncrement: true cho version code.
3. Lệnh Build:
o Thêm script vào package.json: "build:prod": "eas build --platform android --profile production".
o Viết script npm run build:prod chạy lệnh eas build --platform android --profile production.
4. Lệnh thực thi:
o Hướng dẫn tôi chạy lệnh tạo Secret cho API URL: eas secret:create ...
o Sau đó chạy npm run build:prod."
5. Lưu ý quan trọng: Không chạy lệnh build trên máy cục bộ (Antigravity). Hãy đẩy toàn bộ lên Cloud của Expo."

CHƯƠNG 8: PHÁT HÀNH LÊN APPLE APP STORE (IOS DEPLOYMENT)
7.1. ĐIỀU KIỆN TIÊN QUYẾT (PREREQUISITES)
Apple yêu cầu đầu tư chi phí và bảo mật cao hơn Google.
Hạng mục Chi phí / Yêu cầu Ghi chú quan trọng (Fail Fast)
Apple Developer Program $99 / năm Bắt buộc. Phải đăng ký dưới dạng cá nhân hoặc tổ chức (Cần số D-U-N-S nếu là cty).
Thiết bị Apple iPhone/iPad/Mac Cần để xác thực 2 lớp (2FA) khi đăng nhập tài khoản Developer.
EAS Build Miễn phí (Có hàng chờ) Bắt buộc dùng Cloud Build vì Antigravity (Linux) không thể build iOS.
App Store Connect Miễn phí Nơi quản lý thông tin App, giá bán, TestFlight.

7.2. CẤU HÌNH NHẬN DIỆN & QUYỀN RIÊNG TƯ (CRITICAL CONFIG)
Đây là phần quan trọng nhất. Thiếu 1 dòng mô tả quyền -> Apple từ chối Binary ngay lập tức.
A. Cấu hình app.json (iOS Config)
Yêu cầu AI bổ sung section ios vào app.json với độ chính xác tuyệt đối:

1. bundleIdentifier: com.qvc.quocvietsuperapp (Nên trùng với Android package để dễ quản lý).
2. buildNumber: 1 (Chuỗi ký tự, phải tăng lên mỗi lần upload).
3. supportsTablet: true hoặc false (Nên để true để mở rộng thị trường).
4. infoPlist (BẮT BUỘC): Phải giải trình lý do sử dụng phần cứng bằng tiếng Việt (hoặc Anh) rõ ràng.
Mẫu config chuẩn (Copy cho AI):

````
"ios": {
  "bundleIdentifier": "com.qvc.quocvietsuperapp",
  "buildNumber": "1",
  "supportsTablet": true,
  "infoPlist": {
    "NSCameraUsageDescription": "Ứng dụng cần truy cập Camera để nhân viên chụp ảnh Check-in chấm công và chụp hóa đơn thanh toán.",
    "NSFaceIDUsageDescription": "Ứng dụng cần FaceID để đăng nhập nhanh và bảo mật.",
    "NSLocationWhenInUseUsageDescription": "Ứng dụng cần vị trí của bạn để xác thực địa điểm chấm công hợp lệ.",
    "NSPhotoLibraryUsageDescription": "Ứng dụng cần truy cập thư viện ảnh để đính kèm tài liệu vào công việc.",
    "UIBackgroundModes": ["remote-notification"]
  }
}
````

7.3. CHIẾN LƯỢC BUILD ĐÁM MÂY (EAS BUILD STRATEGY)
Apple quản lý chứng chỉ (Certificate) và hồ sơ cấp phép (Provisioning Profile) rất phức tạp. Hãy để EAS làm tự động.
A. Cấu hình eas.json (iOS Profile)
Bổ sung cấu hình cho iOS vào file eas.json đã tạo ở Chương 6:

````
{
  "build": {
    "production": {
      "ios": {
        "buildType": "app-store" // Build để đẩy lên Store/TestFlight
      }
      // ... giữ nguyên config Android cũ
    },
    "preview": { // Build để cài thử trên máy sếp (Ad-hoc)
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "email@apple-developer.com", // Email tài khoản Apple
        "ascAppId": "1234567890", // App ID (EAS sẽ tự tìm nếu chưa điền)
        "appleTeamId": "TEAM_ID" // Team ID (EAS tự tìm)
      }
    }
  }
}
````

B. Quản lý Chứng chỉ (Auto Managed)
• Tuyệt đối không tạo Certificate thủ công trên trang Apple Developer nếu bạn không phải chuyên gia.
• Chiến thuật: Khi chạy lệnh build, chọn "EAS Managed". Expo sẽ tự đăng nhập vào Apple Account của bạn, tạo Certificate, tạo Provisioning Profile và ký App.
7.4. QUY TRÌNH PHÁT HÀNH (DEPLOYMENT PIPELINE)
Bước 1: Đăng ký App trên App Store Connect
• Trước khi build, bạn phải vào trang App Store Connect.
• Tạo App mới -> Nhập tên "Quốc Việt Super App" -> Chọn Bundle ID com.qvc.quocvietsuperapp (Nếu chưa có Bundle ID, EAS sẽ hỏi để tự tạo ở Bước 2).
Bước 2: Build Production
• Chạy lệnh: eas build --platform ios --profile production
• Lần đầu chạy: Hệ thống sẽ yêu cầu bạn đăng nhập Apple ID. Hãy nhập User/Pass và mã 2FA gửi về iPhone.
• Kết quả: Sau 15-40 phút (tùy hàng chờ), bạn sẽ nhận được file .ipa (nhưng không cần tải về).
Bước 3: Submit lên TestFlight (Tự động)
• Chạy lệnh: eas submit --platform ios
• Chọn file build vừa tạo ở Bước 2.
• EAS sẽ upload file .ipa lên TestFlight.
• TestFlight là gì? Là môi trường test chính chủ của Apple. Bạn mời Sếp hoặc Tester cài App "TestFlight" trên App Store, sau đó gửi mã mời cho họ để cài Super App. Đây là cách duy nhất để cài App test trên iOS mà không cần cắm cáp.
Bước 4: Release Official
• Sau khi test ok trên TestFlight -> Vào trang App Store Connect -> Chuyển bản build từ TestFlight sang tab "App Store" -> Gửi xét duyệt (Review).
________________________________________

7.5. CƠ CHẾ PHÒNG VỆ (DEFENSIVE RULES)

1. Privacy Description Guard:
o Rủi ro: Apple rất ghét App đòi quyền mà không giải thích. Nếu NSCameraUsageDescription ghi chung chung "Cần dùng camera", bạn sẽ bị Reject.
o Quy tắc: AI phải điền mô tả cụ thể: "Dùng để làm gì?". (Đã config ở mục 7.2).
2. Asset Transparency Guard:
o Rủi ro: Icon App trên iOS KHÔNG ĐƯỢC có nền trong suốt (Transparency). Nếu có, quá trình upload sẽ lỗi.
o Quy tắc: File assets/icon.png phải là ảnh đặc (JPG hoặc PNG không có alpha channel), kích thước 1024x1024.
o Giải pháp: Yêu cầu AI kiểm tra nếu icon.png có kênh Alpha, hãy dùng lệnh magick hoặc công cụ sửa ảnh để chèn nền trắng (#FFFFFF) vào, loại bỏ hoàn toàn độ trong suốt.
3. Simulator Guard:
o Nếu bạn muốn test trên máy ảo Mac (Simulator) thay vì máy thật, hãy chạy eas build --platform ios --profile development-simulator. File sinh ra sẽ là .tar.gz (App Bundle), kéo thả vào Simulator là chạy.

________________________________________
7.6. HƯỚNG DẪN THỰC THI CHO AI (AI PROMPT)
Copy lệnh này cho AI để thực hiện quy trình iOS Build:
"Dựa trên Hồ sơ thiết kế Chương 7 (iOS Deployment), hãy thực hiện các bước chuẩn bị Build iOS:

1. Cấu hình Info.plist:
o Mở app.json, tìm mục ios.
o Thêm đầy đủ các trường NS...Description bằng tiếng Việt giải thích lý do dùng Camera, Location, FaceID (như mẫu trong tài liệu).
o Đảm bảo bundleIdentifier là com.qvc.quocvietsuperapp.
2. Cấu hình EAS:
o Cập nhật file eas.json. Thêm block ios vào profile production với buildType: "app-store".
3. Script Build:
o Thêm script vào package.json: "build:ios": "eas build --platform ios --profile production" "submit:ios": "eas submit --platform ios"
4. Kiểm tra Asset:
o Nhắc tôi kiểm tra file assets/icon.png đảm bảo không có nền trong suốt (alpha channel).
5. Lệnh thực thi:
o Hướng dẫn tôi chạy npm run build:ios và chuẩn bị sẵn Apple ID để đăng nhập khi được hỏi."

CHƯƠNG 9: TRUNG TÂM GIÁM SÁT & LOG LỖI NỘI BỘ (IN-APP DEBUGGER)
8.1. KIẾN TRÚC HỆ THỐNG LOGGING (LOGGER ARCHITECTURE)
Thay vì dùng console.log (chỉ hiện trong Terminal), ta sẽ xây dựng cơ chế "Capture & Store" (Bắt và Lưu) để hiển thị lên UI.
Sơ đồ luồng dữ liệu:
6. Nguồn lỗi: API (Axios), UI (React Error Boundary), System (Modules).
7. Bộ thu thập (Log Collector): Các hàm Interceptor và Wrapper.
8. Kho lưu trữ (Log Store): Sử dụng Zustand (lưu trong RAM) để đảm bảo tốc độ cao, không làm chậm App.
9. Màn hình hiển thị (Debug View): UI chuyên biệt để xem logs.
Sử dụng các thư viện đã có trong dự án, không cài thêm thư viện lạ.
Thành phần Thư viện sử dụng Lý do & Vai trò
Log Store zustand Lưu trữ log trong RAM. Tốc độ cực nhanh, không ảnh hưởng FPS của App.
List View @shopify/flash-list Render danh sách hàng nghìn dòng log mượt mà (Tương tự Chương 4).
Icons lucide-react-native Sử dụng icon: Bug (Lỗi), Network (API), AlertTriangle (Warn).
Format date-fns Hiển thị thời gian log chính xác đến mili-giây.
Safety Custom Util Hàm safeStringify để tránh crash khi log object phức tạp.

8.2. CẤU TRÚC DỮ LIỆU LOG (DATA STRUCTURE)
Định nghĩa cấu trúc tin nhắn Log chuẩn để AI thực hiện.
File: src/core/logger/types.ts (mẫu)

````
export type LogType = 
  | 'API_REQ'   // Request gửi đi
  | 'API_RES'   // Response thành công
  | 'API_ERR'   // Lỗi mạng/Server (4xx, 5xx)
  | 'ZOD_ERR'   // Lỗi sai format dữ liệu (QUAN TRỌNG)
  | 'UI_CRASH'  // Lỗi màn hình trắng
  | 'SYSTEM'    // Lỗi thiếu thư viện, quyền
  | 'FORM_ERR'; // Lỗi validate form nhập liệu

export interface LogEntry {
  id: string;             // UUID
  timestamp: number;      // Date.now()
  type: LogType;
  title: string;          // VD: "POST /login" hoặc "Invalid Schema"
  details: Record<string, any> | string; // Dữ liệu chi tiết
  is_error: boolean;      // True = Màu đỏ
}
````

8.3. CÁC ĐIỂM THU THẬP LOG (INTEGRATION POINTS)
Chỉ đạo AI cắm "vòi hút" log vào các vị trí trọng yếu của hệ thống.
A. API Logger (Network Logs)

Cấu hình trong axios-client.ts:
• Request Interceptor: Ghi lại Method, URL, Params. Lưu ý: Nếu URL chứa /login hoặc password, thay thế Body bằng ***HIDDEN***.
• Response Interceptor: Ghi lại Status code, Data trả về, Duration (Thời gian phản hồi).
• Error Interceptor: Quan trọng nhất. Ghi lại lỗi Message, Server Response Body (400, 401, 500 kèm message từ Server).
B. Zod Schema Logger (Data Contract Guard)
Tích hợp vào lớp Service (VD: TaskService, AuthService):
• Khi gọi Schema.safeParse(data):
• Nếu success === false: Gọi Logger.addLog('ZOD_ERR', ...) kèm theo danh sách field bị sai (VD: "Missing 'status_color' in Task ID 501").
• Mục tiêu: Giúp Dev biết ngay Server trả thiếu trường nào.
C. UI Crash Logger (Global Error Boundary)
Tạo component src/core/logger/ErrorBoundary.tsx:
• Bọc toàn bộ App (_layout.tsx).
• Khi React render bị lỗi (màn hình trắng/đỏ), thay vì crash văng app, nó sẽ bắt lỗi, lưu vào Log Store và hiện màn hình "Đã xảy ra lỗi" thân thiện.
D. System Check (Dependency Guard)
Logic chạy 1 lần khi App khởi động:
• Kiểm tra expo-device.isDevice.
• Kiểm tra quyền expo-camera, expo-location.
• Nếu là máy ảo (Simulator/Antigravity) -> Ghi log SYSTEM: "Running in Simulator Mode - Hardware Mocked".
Kiểm tra thư viện thiếu/lỗi.
• Logic: Khi App khởi động, chạy một hàm checkDependencies().
• Thử require các module native (expo-camera, expo-location).
• Nếu module nào undefined hoặc gây lỗi -> Ghi log "CRITICAL: Thiếu thư viện X".
________________________________________
8.4. THIẾT KẾ GIAO DIỆN DEBUG (UI BLUEPRINT)
Giao diện ẩn, dành riêng cho Developer, chỉ mở bằng cách đặc biệt
Cách truy cập (Secret Trigger):
• Tại màn hình ProfileScreen, nhấn liên tục 5 lần vào Avatar hoặc dòng Version Text.
Bố cục màn hình (DebugLogScreen):

1. Header:
o Nút "Clear": Xóa sạch log.
o Nút "Export": Copy toàn bộ log vào Clipboard (để gửi Zalo/Slack báo lỗi).
2. Thanh Filter (Tabs):
o ALL | NETWORK (API) | ERRORS (Lỗi đỏ) | SYSTEM (Info).
3. Danh sách Log (FlashList):
o Mỗi dòng log hiển thị: [Giờ] [Loại] Tiêu đề.
 Dòng 1: [14:30:05.123] [ICON] POST /api/auth/login
 Dòng 2 (Nếu lỗi): Error: 401 Unauthorized (Màu đỏ).
o Màu sắc:
 API_ERR / UI_CRASH: Màu Đỏ nền hồng.
 API_RES: Màu Xanh lá.
 SYSTEM: Màu Xám.
4. Chi tiết Log (Modal):
o Khi bấm vào 1 dòng -> Mở Modal full màn hình.
o Hiển thị JSON thô (Pretty Print) của Request/Response để copy paste cho Backend fix lỗi.
5. Floating Action Button:
o Nút "Clear Logs" (Xóa sạch).
o Nút "Copy All" (Copy vào clipboard để gửi Zalo/Slack).
8.5. HƯỚNG DẪN THỰC THI CHO AI (AI PROMPT)
Copy lệnh này cho AI để xây dựng hệ thống Log:
"Triển khai Chương 8: Hệ thống In-App Debugger.
6. S Core Logger:
o Tạo useLogStore (Zustand) tại src/core/logger/store.ts.
o Giới hạn mảng logs tối đa 50 item (FIFO) để không tràn RAM Antigravity.
o Viết hàm safeStringify để xử lý object có circular reference trước khi lưu.
7. API Integration:
o Sửa axios-client.ts. Inject useLogStore.getState().addLog(...) vào các Interceptor Request/Response/Error(Thêm Interceptor ghi log vào store).
o Security: Mask (ẩn) các trường password, token trong body log.
8. Dependency Checker: Tạo hook useSystemCheck.
o Kiểm tra sự tồn tại của: expo-camera, expo-location, expo-secure-store.
o Nếu thiếu -> addLog loại SYSTEM với nội dung cảnh báo.
9. UI Screen: Tạo màn hình DebugLogScreen.tsx:
o Sử dụng @shopify/flash-list render danh sách log.
o Dùng màu sắc phân biệt lỗi.
o Click vào item hiện modal xem chi tiết JSON.stringify(details, null, 2).
o Tạo nút bấm tàng hình (Invisible Touchable) tại ProfileScreen để navigate sang Debug.
10. Error Boundary:
o Tạo GlobalErrorBoundary.tsx bọc lấy App.
o Nếu App crash, hiển thị màn hình 'Oops!' và hiển thị nút 'Xem Log' để biết tại sao crash.
11. Fail Fast: Trong src/config/env.ts, nếu parse env lỗi, ghi ngay 1 log SYSTEM trước khi throw error."
