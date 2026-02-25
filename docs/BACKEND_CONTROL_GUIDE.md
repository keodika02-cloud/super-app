# Hướng dẫn Điều khiển Ứng dụng QVC từ Backend (SDUI v3)

Tài liệu này hướng dẫn cách Backend có thể điều khiển hoàn toàn giao diện, tính năng và luồng dữ liệu của Mobile App thông qua cấu hình JSON (Server-Driven UI).

---

## 1. Kiến trúc Tổng quan
Ứng dụng được xây dựng theo triết lý **"Everything is a Block"**. Toàn bộ màn hình là một mảng các `Block` được đăng ký sẵn. Backend chỉ cần trả về danh sách các Block, App sẽ tự động render và xử lý logic tương ứng.

### Luồng dữ liệu:
1. App gọi API tới một `screen_slug` (Ví dụ: `home`, `task_detail`).
2. Backend trả về JSON chứa cấu trúc `layout`.
3. App sử dụng `SduiEngine` để ánh xạ JSON thành các React Components.

---

## 2. Danh mục các Modular Blocks (Registry)

### A. Nhóm Hiển thị & Nội dung
| Block Type | Mô tả | Dữ liệu chính (`data`) |
|:---|:---|:---|
| `ProfileHeaderBlock` | Lời chào & Thông tin Công ty | `greeting`, `company_name`, `company_action` |
| `BannerBlock` | Banner nổi bật/Thông báo | `title`, `subtitle`, `action`, `action_label` |
| `ImageBlock` | Ảnh đơn linh hoạt | `url`, `aspect_ratio`, `action` |
| `HtmlBlock` | Nhúng Web View tùy chỉnh | `html`, `css`, `js`, `height` |
| `SummaryCardBlock` | Bảng kê con số/Trạng thái | `title`, `stats` (mảng `label`, `value`) |
| `StoryBlock` | Danh sách tin nhanh (tròn) | `items` (mảng `label`, `avatar`, `is_seen`) |

### B. Nhóm Chức năng & Tương tác (Contextual Blocks)
Các block này hỗ trợ **Context ID** để tự động định danh đối tượng mà nó tác động.

| Block Type | Tính năng | Dữ liệu đặc thù |
|:---|:---|:---|
| `CameraBlock` | Chụp ảnh ghi bằng chứng | `context_type`, `context_id`, `required`, `id_key` |
| `UploadBlock` | Tải lên tài liệu/file | `context_type`, `context_id`, `max_size_mb` |
| `CommentBlock` | Thảo luận/Log online | `context_type`, `context_id`, `placeholder` |
| `GpsBlock` | Xác nhận vị trí GPS | `label`, `auto_refresh` |

---

## 3. Quản lý Điều hướng (Dynamic Tabs)
Backend có thể điều khiển thanh menu dưới cùng (Bottom Tabs) thông qua API Hệ thống.

**Endpoint mẫu:** `GET /api/v3/app/navigation`
**Cấu trúc JSON:**
```json
{
  "tabs": [
    { "name": "index", "label": "Bảng tin", "icon": "🏠", "screen_slug": "home" },
    { "name": "tasks", "label": "Việc cần làm", "icon": "📝", "screen_slug": "my_tasks" },
    { "name": "chat", "label": "Chat", "icon": "💬" },
    { "name": "more", "label": "Thêm", "icon": "⊞", "screen_slug": "explorer" }
  ]
}
```

---

## 4. Ví dụ Cụ thể: Điều khiển Màn hình "Chi tiết Công việc"

Giả sử Backend muốn sinh ra một màn hình để Nhân viên kỹ thuật đi sửa máy, JSON trả về sẽ như sau:

```json
{
  "screen_title": "Task #2026: Sửa máy in tầng 4",
  "layout": [
    {
      "type": "BannerBlock",
      "data": {
        "title": "ƯU TIÊN: KHẨN CẤP",
        "subtitle": "Khách hàng đang đợi, yêu cầu hoàn thành trước 10:00",
        "action_label": "Gọi khách hàng 📞",
        "action": "TEL:0987654321"
      }
    },
    {
      "type": "GpsBlock",
      "data": { "label": "Bấm để xác nhận đã đến hiện trường" }
    },
    {
      "type": "CameraBlock",
      "data": {
        "label": "Chụp ảnh lỗi thiết bị",
        "context_type": "TASK",
        "context_id": "2026",
        "required": true
      }
    },
    {
      "type": "CommentBlock",
      "data": {
        "context_type": "TASK",
        "context_id": "2026",
        "placeholder": "Nhập mô tả tình trạng hư hỏng..."
      }
    },
    {
      "type": "UploadBlock",
      "data": {
        "label": "Tải lên biên bản kỹ thuật",
        "context_type": "TASK",
        "context_id": "2026"
      }
    }
  ]
}
```

---

## 5. Cơ chế Log Online & Đồng bộ
Mọi hành động gửi trong nhóm **Chức năng** (Camera, Upload, Comment) sẽ tự động thực hiện:
1. **Request Header**: Đính kèm Token Auth của user.
2. **Payload**: Chứa `context_type` và `context_id`.
3. **Log Minh bạch**: App sẽ in ra console: `[OnlineSync] File [abc.jpg] linked to TASK:2026`.

### Backend cần xử lý:
Backend nên cung cấp một API tiếp nhận chung:
`POST /api/v3/app/functional-sync`
- Body: `{ context_type, context_id, data, file_data }`

---

## 6. Lưu ý Quan trọng
- **Tính dự phòng**: Nếu Backend gửi một `type` mà App chưa có, App sẽ hiển thị `UnknownBlock` với thông báo "Tính năng đang cập nhật". Điều này đảm bảo App không bao giờ bị Crash.
- **Cache**: Mỗi màn hình được phân biệt bởi `cacheKey`. Nếu nội dung thay đổi quan trọng, hãy bảo App làm mới thông qua Header `X-Refresh-Layout`.
