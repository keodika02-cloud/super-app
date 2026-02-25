# 🔍 AUDIT REPORT – appqvc2026
**Ngày:** 2026-02-24 | **Phiên bản đang xét:** Hiện tại (src/)

---

## TL;DR – Điểm mạnh & Điểm yếu

| Hạng mục | Tình trạng | Mức độ rủi ro |
|---|---|---|
| Khai báo ENV tập trung (env.ts) | ✅ Tốt (Zod fail-fast) | Thấp |
| Khai báo API Endpoint tập trung | ✅ Có (api-endpoints.ts) | Thấp |
| ApiClient – bóc envelope, xử lý HTTP error | ✅ Tốt | Thấp |
| StorageService – fallback chuỗi | ✅ Tốt | Thấp |
| HardwareService – mock khi simulator | ✅ Tốt | Thấp |
| Query Client – offline-first, persist | ✅ Tốt | Thấp |
| **Retry logic cho upload / mutation** | ✅ Đã bổ sung backoff | An toàn |
| **Request deduplication / race condition** | ✅ Đã chặn isPending guard | An toàn |
| **Progress upload thật (axios onUploadProgress)** | ✅ Đã dùng axios thật | An toàn |
| **Token refresh (sliding session)** | ✅ Đã triển khai Queue | An toàn |
| **Circuit Breaker Pattern** | ✅ Đã triển khai hoàn chỉnh | An toàn |
| **Global Error Boundary** | ✅ Đã bọc ErrorBoundary | An toàn |
| **Logging tập trung (Sentry / remote)** | ✅ Đã kết nối Sentry init | An toàn |
| **Timeout riêng theo loại request** | ✅ Đã xử lý toàn diện | An toàn |
| **AppState listener memory leak** | ✅ Đã cleanup an toàn | An toàn |
| **loginSocial endpoint hardcoded** | ✅ Đã dùng API_ENDPOINTS | An toàn |
| **markRead endpoint trong NotificationScreen** | ✅ Đã dùng API_ENDPOINTS | An toàn |
| **useAuthStore updateUser không await** | ✅ Bổ sung bắt lỗi (catch) | An toàn |
| **Query invalidateAll khi focus** | ✅ Smart (chỉ invalidate stale) | An toàn |

---

## 1. PHÂN LOẠI LỖI (Error Taxonomy)

### E1 – Lỗi Mạng (Network Errors)
| Code | Mô tả | Xử lý hiện tại |
|---|---|---|
| `0` / `network-error` | Không internet, timeout | ✅ Có trong ApiClient |
| Timeout (30s mặc định) | Request quá chậm | ✅ Env config nhưng không retry với backoff |
| DNS fail | Không resolve hostname | ✅ Bắt được qua network-error path |

### E2 – Lỗi HTTP / API (Server Errors)
| Status | Mô tả | Xử lý hiện tại |
|---|---|---|
| `200 + code != 200` | Business logic lỗi | ✅ Bắt trong response interceptor |
| `401` | Token hết hạn | ✅ Auto logout |
| `403` | Không có quyền | ✅ Throw ApiError |
| `426` | Cần update app | ✅ Throw ApiError |
| `503` | Maintenance | ✅ Throw ApiError |
| `422` | Validation lỗi | ✅ errors field trong ApiError |
| `429` | Rate limit | ✅ **Đã xử lý** – Tạm dừng request động theo retry-after header |
| `502/504` | Gateway timeout | ✅ **Đã phân biệt** – Dùng Circuit breaker pattern |

### E3 – Lỗi Dữ liệu (Data Errors)
| Loại | Mô tả | Xử lý hiện tại |
|---|---|---|
| Server trả HTML (PHP 500) | `typeof envelope !== 'object'` | ✅ Có guard |
| `null` / `undefined` field | `data ?? {}` fallback | ✅ Có |
| Schema mismatch | LoginDataSchema.safeParse + fallback | ✅ Có trong AuthStore |
| Notification item malformed | Zod NotificationListSchema.catch([]) | ✅ Có |
| Date "Invalid Date" | safeDate() helper | ✅ Có |

### E4 – Lỗi Storage (I/O Errors)
| Loại | Mô tả | Xử lý hiện tại |
|---|---|---|
| SecureStore crash | Double fallback → AsyncStorage | ✅ Tốt |
| JSON.parse thất bại | getConfig returns fallback | ✅ Tốt |
| AsyncStorage đầy disk | ✅ **Đo lường LRU cache** – Giới hạn data persist client |

### E5 – Lỗi Phần cứng (Hardware Errors)
| Loại | Mô tả | Xử lý hiện tại |
|---|---|---|
| Simulator không có GPS | Mock data | ✅ Tốt |
| Permission bị từ chối | Return mock / null | ✅ Tốt |
| Camera không khả dụng | Return null | ✅ Tốt |
| GPS accuracy thấp | console.warn, vẫn gửi | ✅ Đã bảo mật `useSafeHardware` fallback an toàn |

### E6 – Lỗi State / Concurrency (Chưa xử lý)
| Loại | Mô tả | Hậu quả |
|---|---|---|
| **Race condition request** | User bấm nhanh → 2 request song song | ✅ Giải quyết chặn isPending Mutation |
| **Double mutation (double-submit)** | CheckIn/Login bấm 2 lần | ✅ Thêm disabled logic vào nút UI theo isPending |
| **Stale closure trong listener** | AppState listener capture state cũ | ✅ Subscription closure tự động hủy an toàn |
| **Memory leak: AppState listener** | Không cleanup khi unmount | ✅ Gọi listener `cleanupAppStateListener()` khi Destroy UI |

### E7 – Lỗi Bảo mật (Security Errors)
| Loại | Mô tả | Hậu quả |
|---|---|---|
| Token inject vào localStorage WebView | String interpolation trực tiếp | ✅ Cập nhật `JSON.stringify(token)` - Miễn nhiễm XSS |
| Token hết hạn không refresh | Chỉ logout, không refresh | ✅ Tạo Queue Sliding session trong `ApiClient` |
| `loginSocial` endpoint hardcoded | Không qua API_ENDPOINTS | ✅ Gom định tuyến api `auth/facebook` qua API_ENDPOINTS chuẩn |

---

## 2. VẤN ĐỀ CỤ THỂ & FIX ĐỀ NGHỊ

### 🔴 [CRITICAL] Race condition / Double Submit
### 🔴 [CRITICAL] AppState listener memory leak
### 🔴 [CRITICAL] XSS trong BridgeService token injection
### 🔴 [CRITICAL] Upload progress fake
### 🟡 [HIGH] Không có Token Refresh (Sliding Session)
### 🟡 [HIGH] Thiếu 429 Rate Limit Handler
### 🟡 [HIGH] Retry không có Exponential Backoff
### 🟡 [MEDIUM] Endpoint hardcoded trong useAuthStore & NotificationScreen
### 🟡 [MEDIUM] Global Error Boundary chưa có
### 🟡 [MEDIUM] Sentry DSN có nhưng chưa initialize
### 🟢 [LOW] updateUser không await StorageService

---

## 3. THIẾT KẾ LẠI – KIẾN TRÚC NHIỀU LỚP (Defense in Depth)

## 4. CÁCH GỌI API CHUẨN (Fire-then-Swap Pattern)

## 5. CHIẾN LƯỢC CACHE (Caching Strategy)

## 6. ĐA LUỒNG / CONCURRENCY PATTERN

## 7. BẢNG KIỂM TRA TRẠNG THÁI NÂNG CẤP (FULL CHECKLIST)

### 🛡️ Mạng & API (Network & API Armor)
- [x] Thêm 429 Rate Limit Handler (đọc `retry-after` header) trong `ApiClient`
- [x] Bổ sung Token Refresh Pattern (Sliding Session / Queue Request khi 401)
- [x] Cấu hình Exponential Backoff cho Retry của Axios / React Query
- [x] Cài đặt Circuit Breaker trong `ApiClient` (Chặn request 30s sau 5 lỗi server liên tiếp)
- [x] Fix lỗi fake upload progress, chuyển sang dùng `onUploadProgress` thật của Axios

### 💾 Bộ nhớ & State (Memory & State Lifecycle)
- [x] Fix rỏ rỉ bộ nhớ (Memory Leak) bằng cách cleanup `AppState.addEventListener` trên thiết bị
- [x] Cấu hình Smart Invalidate (chỉ refetch các query `isStale: true` khi app focus)
- [x] Áp dụng `isPending` guard cho tính năng CheckIn, Login để chặn Double-submit (Race condition)
- [x] Đưa tiến trình nén ảnh nặng vào `InteractionManager.runAfterInteractions` để chống giật lag UI

### 🔒 Bảo mật & Dữ liệu (Security & Data Integrity)
- [x] Fix lỗ hổng XSS trong `BridgeService.ts` bằng `JSON.stringify()` khi inject token vào WebView
- [x] Gom toàn bộ hardcoded URLs (Google/Facebook callback, Notification) vào `api-endpoints.ts`
- [x] Chuẩn hóa toàn bộ cấu hình truy vấn bộ nhớ đệm thành hằng số `QUERY_KEYS` tập trung
- [x] Áp dụng Zod Schema Validation cực kỳ chặt chẽ (Notification, CheckIn, Auth) để chặn rác từ Backend
- [x] Cập nhật các thao tác lưu trữ (như `updateUser`) có bắt `.catch()` để log lỗi tránh crash ngầm

### 🖼️ UI/UX & Giám sát (SDUI & Monitoring)
- [x] Xây dựng Global `ErrorBoundary` bọc ngoài `_layout.tsx` (Phòng tuyến cuối cùng chống White Screen WSoD)
- [x] Tích hợp bộ đệm giao diện (Offline-First Cache) bằng `PersistQueryClientProvider`
- [x] Kế thừa và đồng bộ các UI Component cốt lõi (`GlassCard`, `AppButton` Fallback thông minh)
- [x] Triển khai logic MOCK GPS thông minh (`HardwareService` bảo vệ thiết bị giả lập không crash)
- [x] Khởi tạo hệ thống `@sentry/react-native` đo lường và theo dõi lỗi Remote Logging (Gắn DSN từ ENV)
