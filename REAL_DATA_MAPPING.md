# ZERO MOCK CHECKLIST: Ánh xạ Dữ liệu Thực (appqvc2026)

Tài liệu này liệt kê toàn bộ 4 Tab chính và các màn hình con, xác định trạng thái dữ liệu hiện tại và lộ trình kết nối "Thật" 100%.

## 1. Tab Trang Chủ (Home - `index.tsx`)
Màn hình này sử dụng SDUI (Server-Driven UI).
- **Tình trạng Layout**: Đang kéo từ `/v3/app/ui-layout`. (Thật)
- **Tình trạng Dữ liệu các Block**:
    - **ProfileHeaderBlock**: (Thật) Lấy từ AuthState.
    - **StoryBlock**: (Giả lập) Mock data trong component. -> Cần API `GET /v3/app/stories`.
    - **PostComposerBlock**: (Thật) Đã kết nối `CreatePostModal` bắn tới `POST /v3/app/news-feed`.
    - **SocialFeedBlock**: (Thật) Lấy từ `GET /v3/app/news-feed`.
    - **BannerBlock/SummaryCardBlock**: (Giả lập) Chờ thiết kế API báo cáo KPI.

## 2. Tab Báo Cáo (Reports - `reports.tsx`)
- **Tình trạng**: 100% Giả lập (Mock).
- **Lộ trình**:
    - Backend CRM cần cung cấp `GET /v3/app/ui-layout?screen_slug=goto_reports`.
    - Các Block cần kết nối tới các module: `Purchase`, `Sale`, `Inventory` thực tế từ CRM.

## 3. Tab Chat (Hội thoại - `chat.tsx`)
- **Tình trạng**: 100% Giả lập (Fallback HTML Block).
- **Mục tiêu**: Kết nối tới `chat.maytinhquocviet.com` (`F:\project\www\chat`).
- **Kế hoạch Kết nối**:
    - **API Danh sách**: `GET {CHAT_URL}/api/v1/internal/conversations`.
    - **API Tin nhắn**: `GET {CHAT_URL}/api/v1/internal/messages?conversation_id=...`.
    - **WebSocket**: Sử dụng Laravel Reverb tích hợp sẵn trong code Chat để nhận tin nhắn Realtime.

## 4. Tab Thêm (More - `more.tsx`)
- **Tình trạng**: Layout kéo từ `/v3/app/ui-layout?screen_slug=goto_more`. (Thật)
- **Các Action Nút**:
    - **Chấm công**: Đã thiết kế màn hình `checkin.tsx`. (Cấu hình Backend đã sẵn sàng).
    - **Lương/Phúc lợi**: Đang Mock sang trang Thông báo. -> Cần API từ Module Nhân sự.
    - **Sơ đồ tổ chức/Danh bạ**: Cần kết nối API từ Chat System (vì chat có danh sách nhân viên đầy đủ nhất).

---

# Đề xuất Tái cấu trúc Hệ thống Kết nối (Bridge Architecture)

Để giải quyết vấn đề "rác" và "lung tung", chúng ta sẽ chuẩn hóa theo mô hình **Multi-Domain Registry**.

### Step 1: Chuẩn hóa `ApiClient` (Hỗ trợ 2 đầu Backend)
Cửa ngõ `ApiClient` sẽ nhận diện `Domain` (CRM hoặc CHAT) để tự điều hướng URL.

### Step 2: Cấu trúc SocketService (Laravel Reverb)
Tạo `src/services/SocketService.ts` quản lý Laravel Reverb.
- Quản lý Channels: `private-App.User.{id}`, `presence-Conversation.{id}`.
- Giao tiếp giữa Chat và CRM thông qua Mobile: Mobile nhận notify từ CRM -> Trigger refresh danh sách Chat nếu cần.

### Step 3: Thống nhất ActionRegistry
Mọi nút bấm trong App (từ bất kỳ Tab nào) đều phải đi qua `src/utils/ActionRegistry.ts`.
- Không gọi điều hướng lung tung trong Component. Nó là "Traffic Controller" của cả hệ thống.

---

## 🛠 DANH SÁCH VIỆC CẦN LÀM NGAY (PRIORITY)

1. [ ] **Update `.env`**: Thêm `EXPO_PUBLIC_CHAT_API_URL` và thông số Reverb.
2. [ ] **Refactor `ApiClient.ts`**: Thêm tham số `domain` vào `fetchSafe`.
3. [ ] **Implement `SocketService.ts`**: Cài đặt `pusher-js` và `laravel-echo`.
4. [ ] **Update `chat.tsx`**: Biến nó thành màn hình Chat thật (Danh sách hội thoại).
5. [ ] **Backend Sync**: Đảm bảo Token của Mobile App hợp lệ ở cả 2 Server.
