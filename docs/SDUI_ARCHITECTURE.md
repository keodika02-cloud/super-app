# TÀI LIỆU BÀN GIAO: HỆ THỐNG SERVER-DRIVEN UI (SDUI) - REALITY ENGINE V4.0

*Tài liệu Đặc tả Kỹ thuật & Hướng dẫn Cấu hình Hệ thống AppQVC 2026 (Quản lý Kiến trúc Động - SDUI)*

---

## 1. Giới thiệu chung & Lý do phát triển (Rationale)
Hệ thống AppQVC 2026 được thiết kế theo kiến trúc **Server-Driven UI (SDUI)**, với tên gọi nội bộ là **Reality Engine V4.0**.
- **Mục tiêu cốt lõi:** Cho phép Backend Server làm chủ và tự do thay đổi bố cục (Layout), giao diện (UI Components), và Luồng hành động (Actions) của Mobile App mà **KHÔNG CẦN CHỜ DUYỆT (Review) CẬP NHẬT MỚI TỪ APPLE APP STORE HOẶC GOOGLE PLAY**.
- **Giải quyết bài toán:** Khi công ty Cập nhật/Thêm tính năng mới, Web Backend chỉ cần phân phối tệp mô tả bố cục (JSON layout array), App Mobile sẽ "đọc" chỉ thị này để sắp xếp và vẽ (render) lên giao diện người dùng. Tính năng Simulator cung cấp trải nghiệm WYSWYG ("What You See Is What You Get") 100% nhằm giúp nhà quản trị an tâm với mọi thay đổi trước khi đến với App thật.

## 2. Thông tin Dự án & Môi trường Triển khai
- **Tên miền API Backend chính:** `https://crm.maytinhquocviet.com/api/v3`
- **Frontend Admin Portal:** Web Builder (Control Center) quản lý bố cục.
- **Mobile App:** Phát triển trên nền React Native (Framework Expo Router) - Project `appqvc2026`.

---

## 3. Cấu trúc Hệ thống & Mã nguồn Liên quan (File Tree)

### 3.1. HỆ THỐNG BACKEND (Laravel API - `f:\project\backend`)
Backend là "bộ não" kiểm soát và phân phối layout cho App điện thoại và lưu lại cài đặt từ Quản trị viên (Web).

- **API Routes (`routes/api_v3.php`)**
  - Chức năng: Định nghĩa endpoint phân phối SDUI `/v3/app/ui-layout`, bootstrap, v.v.
- **Controller Mobile (`app/Http/Controllers/Api/V3/AppConfigController.php`)**
  - Chức năng: Là điểm App Mobile kết nối để xin Layout. Nó đọc danh sách Component từ Database hoặc đọc fallback `storage/app/sdui_factory_defaults.json` (Trường hợp Server reset / App mới tải).
- **Controller Admin (`app/Http/Controllers/Api/V3/Admin/AppMenuItemController.php`)**
  - Chức năng: Nhận yêu cầu Thêm/Sửa/Xóa cấu hình UI từ Web Builder. Thực thi CRUD và Ghi Log (Audit Trail) cho mọi thao tác của Admin.
- **Controller Feed (`app/Http/Controllers/Api/V3/AppNewsFeedController.php`)**
  - Chức năng: API nguồn dữ liệu thật của Mạng nội bộ, cấp nguồn bài viết cho Cả App và Trình Giả Lập trên Web (Để test Simulator có vẻ ngoài sống động thật 100%).
- **Models (`AppMenuItem.php`, `AppConfigSnapshot.php`, `AppUiLog.php`)**
  - Chức năng: Kho lưu trữ cấu hình App (Các khối giao diện, icon, màu, vị trí ưu tiên sắp xếp). Snapshot lưu lịch sử Rollback nếu Admin setting lỗi.

### 3.2. HỆ THỐNG FRONTEND (ReactJS Admin Web - `f:\project\frontend`)
Quản trị viên sử dụng Web này để thiết kế & gửi lệnh điều khiển.

- **Component Trung tâm (`src/pages/Admin/AppSDUIManager.jsx`)**
  - Chức năng: Là trang "Control Center" quản lý SDUI. Phía bên trái là Menu màn hình (Home, Report, Profile...). Cột giữa (Builder) cung cấp UI Thêm/Sâu chuỗi các block, đổi icon trực quan, đổi màu. Và đặc biệt là chế độ thay đổi trực tiếp qua JSON. Tab RAW_FULL cho phép can thiệp tinh gọn nhất.
- **Component Giả lập ("Máy ảo v4.0") (`src/components/SDUI/MobilePreviewFrame.jsx`)**
  - Chức năng: **Reality Engine Renderer**. Trình hiển thị mô phỏng 99% UI của App hiện tại.
    - Hỗ trợ Fake Data hoặc Live Data từ Feed (`AppNewsFeedController`).
    - Hỗ trợ đổi Thiết bị giả lập (iPhone Notch, S24 Ultra Punch Hole, Dynamic Island).
    - Hỗ trợ mô phỏng Landscape (Xoay ngang). Layout đổi trạng thái sang lưới để tiện View Layout App iPad.

### 3.3. HỆ THỐNG MOBILE APP (React Native / Expo - `f:\project\appqvc2026`)
Điện thoại nhận tín hiệu và phản ứng thay đổi vẽ UI.

- **Hook Gọi Dữ Liệu (`src/hooks/useScreenData.ts`)**
  - Chức năng: Tự động tải từ endpoint `/api/v3/app/ui-layout` qua QueryClient, lưu trữ Local (Offline-first approach), xử lý Loading State và Error State.
- **Màn hình Chính (`app/(main)/index.tsx`, `app/(main)/...`)**
  - Chức năng: Đọc mảng JSON đã fetching. Với mỗi item, nó check key `block_type` để gọi component cụ thể vẽ lên.
- **Thư mục Component SDUI (`src/components/blocks/...`)**
  - Gồm File: `GridMenuBlock`, `ProfileHeaderBlock`, `SocialFeedBlock`,... App phải dựng sẵn Component nhận `props`. Không có Component thì App sẽ bỏ qua "Block" đó để tránh Crash.

---

## 4. Kiến trúc Định dạng Khối (API JSON Payload)
Mỗi API nạp Layout trả về một Array chứa cấu trúc sau đây:

```json
[
  {
    "id": "item1-1234",               // Unique ID
    "type": "GridMenuBlock",          // (Backend có thể cấp block_type) => Liên kết logic với React Native Name
    "label": "Tên chức năng...",      // Tên hiển thị (Text prop)
    "icon": "ATTENDANCE",             // Text mapping với FontAwesome / Lucide Icon
    "action": "OPEN_APP_ATTENDANCE",  // Router Name để App gọi thư viện Navigation Navigate('...')
    "bg_color": "#3b82f6",            // Màu sắc khối nền Component
    "metadata": {},                   // JSON bổ trợ thêm (Vd: số thông báo chờ `badgeCount`, title phụ)
    "position": 1,                    // Vị trí (Order/Index list render)
    "is_active": true                 // Cờ để ẩn hiện ko cần xoá record db
  }
]
```

---

## 5. Hướng dẫn Cấu hình (Operating Manual)
Để tùy biến UI của Mobile App thông qua Control Center:

1. **Truy cập Giao diện Web-Admin (CRM Quốc Việt):** Dành cho tài khoản Developer / Giám đốc. Vào mục `SDUI CONTROL`.
2. **Chọn Màn hình mong muốn đổi thiết kế:** Ở Sidebar trái (Ví dụ: Menu `Bảng tin`, hoặc `Thêm`).
3. **Thêm hoặc Sửa Linh Kiện (Block):** 
   - Chọn loại block phù hợp: *Ví dụ: Grid Menu (Lưới nút), Thẻ Profile, Bảng Feed*.
   - Gán `Hành động (Action)` tương ứng. *Vd: Mở chấm công, mở Chat.* (Lưu ý: Action_Name phải khớp với tên Route được dev App đăng ký).
   - Chọn Màu và Icon. Bấm **Chốt Thiết Kế**.
4. **Kiểm tra và Xem trước bằng Simulator ("Điện thoại thu nhỏ"):** 
   - Simulator bên phải sẽ reload giao diện. Hãy đảm bảo "nút vừa tạo" hiển thị không lệch màu chữ, không đè lấn nút khác.
   - Thử chức năng Xoay điện thoại `[📲]` để xem nó có tràn viền hay Responsive đạt trên máy tính bảng không. 
   - Thử bật `iPhone 15 Pro` và đổi sang `S24 Ultra` để quan sát vị trí đục lỗ Camera.
5. **Ghi Đè & Xuất JSON (Deploy):**
   - Click nút **XUẤT CONFIG (.json)** tải về cấu hình sạch để gửi cho Dev nạp vào App. Giai đoạn offline cho phép App load siêu nhanh do đã được `PreCache` (nạp Factory Code JSON vào Build).

---

## 6. Nhận Xét, Lời Khuyên & Tối ưu Giai đoạn tới (Recommendations)

### Ưu điểm (Pros):
- **Continuous Deployment cho Mobile:** Team Admin không cần làm phiền Dev. Giờ có thể tự tắt 1 nút, tự bật 1 Form, Đổi tên nhãn. Web update xong App có mặt sau 1 giây (nhờ Refresh/Live sync).
- **A/B Testing dễ dàng:** Thay màu, thay icon check tỷ lệ Click.
- **Giao diện Quản trị "Simulator" Đỉnh Cao:** Render chính dữ liệu bài viết thật để Designer nhìn bố cục "Sống", tránh việc test = ảnh Demo đến khi Live thì lại vỡ font do data thật chữ dài.

### Hạn chế & Lưu ý Kỹ thuật (Cons & Gotchas):
- **Cẩn trọng Action Mismatches:** Frontend Mobile App phải *luôn có mã Cứng* map với "Action Name". Nếu phía Web Admin tạo một nút tên là "Mở chức năng Giấu Tên" nhưng gán Action là `OPEN_NEW_APP_3000`, mà phía Code React Native chưa định nghĩa Case `OPEN_NEW_APP_3000` => App sẽ không click được (Action vô tri). Hoặc rủi ro dẫn tới lỗi `Route is unrecognized`. => Phải tài liệu hóa các biến Action.
- **Giới hạn Block Types:** Tương tự, nếu anh gán "Khối Đếm Ngược", nhưng App (Client) chưa có file `CountdownBlock.tsx` => App sẽ không chịu Render Khối này. Chế độ SDUI là "Server truyền dữ liệu & Component Type" nhưng "Client" vẫn là người mang cọ vẽ (Render Code của Mobile Device).

### Chiến lược Triển khai tương lai:
1. NÊN: Yêu cầu Dev App viết màn chờ Lỗi (Fallback Error Block). Nếu Server truyền xuống type lạ, App sẽ Render 1 khối "Cần nâng cấp App" thay vì Crash màn hình.
2. XUẤT RA APP: 1 tính năng tốt trên Web là **Xuất JSON Ra**. Để App khởi động không phải chờ Call API `/ui-layout` trắng xoá mất 1s đầu. Code App hãy Require File Json tải về này, truyền thẳng vào InitialState. App sẽ Instant-Load (Load Tức Thì), rồi gọi API Request chạy ngầm `sync`. Nếu UI trên DB thay đổi, UI trên App mới refetch lại => 0% Loading Time cho 99% thời lượng chạy App.

**The Reality Engine is now fully operational and documented.**
