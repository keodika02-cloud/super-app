# TÀI LIỆU KỸ THUẬT: HỆ THỐNG THÔNG BÁO VÀ CHAT ZEROCRASH
> **Cập nhật:** Tháng 02/2026  
> **Mục tiêu:** Cung cấp tài liệu chi tiết nhất cho Frontend App Mobile và Web xây dựng tính năng Thông báo (Notification) & Chat nội bộ thời gian thực.  
> **Kiến trúc phân tán (Microservices):** Chức năng được chia làm 2 Server: **CRM Backend** (Quản lý nghiệp vụ) và **Chat Server** (Quản lý I/O nặng nhắn tin và Push Firebase).

---

## 1. QUẢN LÝ THIẾT BỊ VÀ FBT TOKEN (REGISTRATION)

Để một thiết bị (iOS/Android/Web) có thể nhận thông báo đẩy (Push Notification), nó phải gửi `FCM Token` về Server Chat để lưu trữ.

### 1.1 Cơ chế hoạt động
- **Model lưu trữ:** `DeviceToken` (nằm ở `www/chat`)
- **Trường dữ liệu lưu:** `user_id`, `token` (chuỗi dài của Firebase), `platform` (ios/android/web), `device_model`.
- Người dùng có thể có **Nhiều thiết bị** (đăng nhập iPad, iPhone cùng lúc đều nhận được Push).

### 1.2 API Đăng ký Thiết bị
- **Endpoint:** `POST https://chat.maytinhquocviet.com/api/v1/notifications/push-tokens`
- **Request Body:**
```json
{
  "token": "dck_As88s... (FCM Token)",
  "platform": "ios",
  "device_model": "iPhone 15 Pro Max"
}
```
- **Luồng xử lý (Controller:** `NotificationController@registerToken` tại Chat Server)
  1. Frontend gọi API kèm Bearer Token của User.
  2. Server dùng `updateOrCreate` để lưu FCM Token. Nếu token đã có thì cập nhật thông tin máy.

---

## 2. API CỦA HỆ THỐNG THÔNG BÁO IN-APP (BELL ICON)

Khi người dùng mở App và bấm vào icon Quả chuông, dữ liệu sẽ được kéo về. Do chia Microservices, ta có 2 ngõ lấy dữ liệu tùy theo nhu cầu.

### 2.1 API Lấy danh sách Thông báo (Từ CRM Backend)
Đây là API chính Frontend Mobile dùng cho màn hình **NotificationScreen** (Lấy thông báo chấm công, báo cáo, app update).

- **Endpoint:** `GET https://crm.maytinhquocviet.com/api/v3/app/notifications`
- **Controller:** `AppNotificationController@index` (`backend\app\Http\Controllers\Api\V3`)
- **Phản hồi chuẩn `AppV3Response`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1234",
      "title": "Nhắc nhở Chấm công",
      "body": "Đừng quên chấm công nhé!",
      "type": "warning",
      "is_read": false,
      "payload": {"route": "/(main)/checkin"},
      "created_at": "2026-02-26 09:00:00"
    }
  ],
  "message": "Fetched notifications successfully"
}
```
> **Đặc biệt (Anti-Crash):** Nếu người dùng không có dữ liệu, Server sẽ bắn mock data (ID 1001, 1002) giả lập để App luôn có giao diện hiển thị mà không bị trống.

### 2.2 API Đánh dấu Đã đọc (Mark Read)
- **Endpoint:** `POST https://crm.maytinhquocviet.com/api/v3/app/notifications/read`
- **Request Body:** `{ "id": "uuid-1234" }` (Truyền ID thì đọc 1 tin, không truyền thì đọcTẤT CẢ).
- Logic: Cập nhật cột `read_at = now()`.

---

## 3. CƠ CHẾ GỬI THÔNG BÁO PUSH (FIREBASE FCM V1)

Bắt đầu từ 2024, Google vô hiệu hóa FCM Legacy gốc, hệ thống QVC đang sử dụng luồng **FCM HTTP v1 API** bảo mật cao qua **Google_Client**.

### 3.1 Luồng thực thi qua `NotificationService.php` (ở Server Chat)
1. Xác thực bằng file JSON Service Account Google (`config('services.fcm.service_account')`).
2. Gen `access_token` tĩnh để gọi Google API.
3. Kéo toàn bộ Token của `user_id` trong nhóm `DeviceToken` để gửi vòng lặp.

### 3.2 API Gửi thông báo hàng loạt (Cho Admin)
- **Endpoint:** `POST https://chat.maytinhquocviet.com/api/v1/notifications/broadcast`
- **Payload:**
```json
{
   "title": "Họp toàn công ty",
   "body": "Phòng kinh doanh tập trung tầng 2",
   "target": "all_staff", // hoặc "specific_users" kèm mảng "user_ids": [1, 2, 3]
   "url": "/chat",
   "type": "info"
}
```
- **Xử lý:** Lưu vào Database Notification (để giữ lịch sử chuông) TRƯỚC -> Gọi NotificationService đẩy Push Firebase SAU.

---

## 4. HỆ THỐNG CHAT & WEBSOCKET CORE (REVERB)

Giao tiếp Realtime được thiết kế để gánh tải siêu nhẹ thông qua Laravel Reverb.

### 4.1 Danh sách API REST HTTP (`InternalChatController.php`)
Đây là thao tác "Kéo" data lúc mới mở App (Sync).

| Tiêu đề | REST Endpoint (Domain: chat.) | Body / Params |
|---------|-------------------------|--------------|
| Lấy Danh sách Nhóm | `GET /api/v1/internal/conversations` | Lấy phòng có join |
| Lấy tin nhắn rễ | `GET /api/v1/internal/messages?conversation_id=X&limit=50` | Phân trang tin nhắn |
| Tạo phòng Nhóm | `POST /api/v1/internal/conversations` | `{"type":"group", "user_ids":[1,2]}` |
| Gửi tin Text/Ảnh | `POST /api/v1/internal/messages` | `{"content":"Alo", "receiver_id": 2}` hoặc up File (Multipart form) |

### 4.2 Giao thức WebSocket (Real-time Broadcast)
- App sử dụng thư viện `pusher-js` hoặc `laravel-echo` kết nối đến:
  - Host: `chat.maytinhquocviet.com`
  - Port: `443`
  - WSS Protocol, Reverb App Key: `v8b9ezbiusabn3kcqago`.
- **Event lắng nghe:** `App\Events\MessageSent`
- **Kiến trúc Zero-lag Optimistic UI:** Khi App Mobile gọi `POST /messages`, nó truyền thêm một mã `temp_id`. Ngay lúc bấm gửi, App đẩy tin nhắn tạm lên UI. Khi WebSocket dội ngược lại bản đồ có chứa `temp_id` trùng khớp, App sẽ thay thế trạng thái (Đang gửi -> Đã gửi) giúp User cảm giác mạng nhanh tuyệt đối.

---

## 5. BỘ LỌC ANTISPAM, PRESENCE CACHE VÀ PHÂN LUỒNG

Hệ thống sở hữu cơ chế tối ưu cực kì thông minh trong Chat để tránh "vỡ điện thoại" vì bão Push MSG.

### 5.1 Presence Cache (Tránh Push phiền phức lúc đang mở App)
- Khi User A chat cho User B. Thường thì hệ thống sẽ đẩy 1 Push FCM cho B.
- **Vấn đề:** Nếu B **đang mở** khung chat đó để nói chuyện với A, cái Push rớt xuống sẽ rất phiền và kêu tít tít nổ máy.
- **Giải pháp:** API Heartbeat (Presence).
  - Cứ mỗi phút, Mobile App của B đang mở khung kính sẽ bắn vô hình API: `POST /api/v1/internal/conversations/{id}/presence`.
  - Lúc B bắn, Controller set RAM Cache Redis: `Cache::put("presence:convo_ID:user_ID", true, 2 phút)`.
  - Lúc A nhắn tin: Server gọi hàm `notifyParticipants`. Nó check nếu `Cache::has(...)` trả về **True** -> Nó **Bỏ qua Push FCM** (B chỉ nhận qua Web Socket im lặng vô màn hình).
  
### 5.2 Quản lý File Rác Storage
- File ảnh chat được up vào ổ cứng Local qua route `POST messages` lưu ở `chat_files/`. Cần cơ chế dọn Cronjob định kỳ sau 30 ngày để tối ưu SSD của máy chủ Chat.

---

## 6. DANH BẠ FILE MÃ NGUỒN CỐT LÕI (CORE FILES)

Nếu sau này Team cần sửa logic, vui lòng tìm đến các địa chỉ sau:

### TẠI BACKEND CRM (`F:\project\backend`)
1. `app\Http\Controllers\Api\V3\AppNotificationController.php` — Trả JSON in-app thông báo.
2. `app\Models\AppNotification.php` — Data binding cho thông báo.

### TẠI CHAT SERVER (`F:\project\www\chat`)
1. `routes\api.php` — Bộ định tuyến toàn bộ `/v1/internal/` và `/v1/omnichannel/`.
2. `app\Http\Controllers\NotificationController.php` — Nhận lưu Token, Broadcast hệ thống.
3. `app\Http\Controllers\Api\Internal\InternalChatController.php` — Trái tim của Chat Node, xử lý nhắn tin, group, check presence cache.
4. `app\Services\NotificationService.php` — Viết Logic cắm Google Client gửi sang máy chủ Firebase gánh tải Push Notification.
5. `app\Models\Message.php`, `Conversation.php`, `ConversationParticipant.php` — Kiến trúc 3 bảng thần thánh phân quyền ai được thấy phòng chat nào.
