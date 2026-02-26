# App Review Guidelines – Apple Developer

## Mục tiêu & Nguyên tắc

• Apple muốn App Store là nơi an toàn cho người dùng và công bằng cho nhà phát triển.
• Ứng dụng được kiểm duyệt bởi chuyên gia, quét phần mềm độc hại, và được chọn lọc để dễ khám phá.
• Ở EU và Nhật Bản có thêm lựa chọn phân phối qua notarization hoặc marketplace khác.

## Trước khi gửi ứng dụng

• Kiểm thử kỹ để tránh lỗi và crash.
• Cung cấp đầy đủ metadata, tài khoản demo, và quyền truy cập backend.
• Giải thích rõ các tính năng khó hiểu và giao dịch in-app.
• Thông tin ứng dụng phải chính xác, cập nhật thường xuyên.

## An toàn
• Không được chứa nội dung bạo lực, khiêu dâm, xúc phạm hoặc gây hiểu nhầm.
• Nội dung do người dùng tạo phải có bộ lọc, báo cáo, và chặn người lạm dụng.
• Ứng dụng dành cho trẻ em phải tránh quảng cáo, theo dõi, hoặc liên kết ngoài không có kiểm soát của phụ huynh.
• Không được gây nguy hiểm sức khỏe (ví dụ: ứng dụng y tế giả, khuyến khích dùng ma túy).
• Nhà phát triển phải cung cấp thông tin liên hệ hợp lệ và đảm bảo bảo mật dữ liệu.

## Hiệu năng

• Ứng dụng phải hoàn chỉnh, ổn định, chạy thử trên thiết bị thật.
• Metadata phải trung thực, không che giấu tính năng.
• Hình ảnh, video preview phải phản ánh đúng trải nghiệm thực tế.
• Tương thích với phần cứng, API của Apple, tiết kiệm tài nguyên và an toàn.
• Cấm khai thác tiền điện tử, phần mềm độc hại, hoặc tiến trình nền trái phép.

## Kinh doanh

• Mô hình kiếm tiền phải minh bạch và công bằng.
• In-app purchase bắt buộc cho việc mở khóa tính năng, đăng ký, hoặc hàng hóa kỹ thuật số.
• Đăng ký phải có giá trị liên tục, điều khoản rõ ràng, không lừa đảo.
• Một số ngoại lệ: ứng dụng đọc sách, dịch vụ doanh nghiệp, hàng hóa vật lý.
• Ví tiền điện tử và sàn giao dịch chỉ được phép nếu có giấy phép hợp pháp.
• Cấm định giá sai lệch, đánh giá giả, hoặc cho vay nặng lãi.

## Thiết kế

• Ứng dụng phải độc đáo, hữu ích, thiết kế tốt (không copy, không spam).
• Không chỉ là website đóng gói hoặc quảng cáo.
• Ứng dụng dựa trên template phải được tùy chỉnh sáng tạo.
• Ứng dụng remote desktop, extension, mini-app có quy định riêng.
• Không được lạm dụng dịch vụ của Apple (Game Center, Push, Apple Music…).

## Pháp lý

• Phải tuân thủ luật pháp, quy định về quyền riêng tư, và thỏa thuận với Apple.
• Nhà phát triển chịu trách nhiệm với SDK, mạng quảng cáo, và công cụ phân tích bên thứ ba.

Chi tiết tại trang: App Review Guidelines - Apple Developer

PHẦN 1: PHÂN TÍCH MÃ NGUỒN (CRITICAL ANALYSIS)

1. Giả định cốt lõi & Những điểm chết người
• Giả định sai lầm: "Backend chỉ cần một Controller (ActionController) để xử lý mọi hành động (Checkin, Report, Upload) thông qua tham số type, giúp giảm số lượng API endpoint."
• Điểm bị hiểu sai: Bạn đang nhầm lẫn giữa "Số lượng Endpoint ít" và "Kiến trúc sạch". Gộp chung endpoint tạo ra một "God Object".
• Hậu quả sụp đổ:
o S.O.L.I.D Violation: Vi phạm nguyên tắc Đơn nhiệm (SRP). Khi logic Upload ảnh báo cáo bị lỗi (do thư viện ảnh), nó có thể làm crash cả luồng Checkin (chấm công). Nhân viên không thể chấm công => Công ty loạn.
o Performance: Mỗi lần gọi /action, PHP phải load toàn bộ dependencies của cả báo cáo, chấm công, like, share... dù chỉ dùng 1 thứ. Lãng phí RAM và CPU.
o Security/Rate Limit: Hacker spam tính năng "Report" (nhẹ), nhưng hệ thống Rate Limit lại chặn luôn IP đó không cho "Checkin" (quan trọng).
2. Phân tích mã nguồn hiện tại (Lỗi cụ thể)
Trong các file bạn cung cấp (đặc biệt là hướng đi cũ của ActionController):
• Lỗi 1: Logic "Review Mode" ngây thơ (AppController)
o Hiện tại: Trả về { "review_mode": true }.
o Rủi ro: Apple Reviewer dùng Charles Proxy chặn gói tin, thấy ngay cờ này -> Reject vì gian lận (Guideline 2.3.1).
o Giải pháp: Server tự quyết định trả về cái gì. Nếu đang review, Server chỉ trả về menu rút gọn. Tuyệt đối không gửi flag review_mode xuống Client.
• Lỗi 2: Thiếu Idempotency (SyncController)
o Hiện tại: Client gửi 1 mảng action, Server insert vào DB.
o Rủi ro: Mạng lag, Client gửi lại lần 2 -> Database có 2 bản ghi chấm công cùng 1 giờ.
o Giải pháp: Bắt buộc Client gửi kèm uuid (Unique ID tạo từ app) cho mỗi action. Server check uuid tồn tại chưa trước khi insert.
PHẦN 2: BẢNG DANH SÁCH API QUY CHUẨN (FINAL ARTIFACT)
Đây là bảng thiết kế dành cho AI/Kỹ sư để "Code một phát ăn ngay". Mọi Response đều tuân thủ 1 cấu trúc JSON duy nhất:

```{
  "code": 200,
  "status": "success",
  "message": "...",
  "data": { ... },
  "trace_id": "ulid_..."
}
```

Group Method Endpoint Backend Function Description JSON Request (Client) JSON Response (Standardized)
System GET /api/app/bootstrap AppController@bootstrap Khởi động App. Lọc menu nhạy cảm server-side. (Không) { "code": 200, "data": { "menu": [...], "settings": {...} } }
UI GET /api/app/screens/{code} ScreenController@render SDUI Layout. Params: ?code=HOME { "code": 200, "data": { "blocks": [...] } }
Auth POST /api/auth/login AuthController@login Đăng nhập thường. { "email": "...", "password": "..." } { "code": 200, "data": { "access_token": "...", "user": {...} } }
Auth POST /api/auth/apple AuthController@loginApple Đăng nhập Apple. { "identity_token": "..." } { "code": 200, "data": { "token": "...", "user": {...} } }
Auth POST /api/auth/google AuthController@loginGoogle Đăng nhập Google. { "access_token": "..." } { "code": 200, "data": { "token": "...", "user": {...} } }
Auth GET /api/auth/me AuthController@me Lấy Info User. (Bearer Token) { "code": 200, "data": { "user": {...} } }
Auth PUT /api/user/profile UserController@update Cập nhật thông tin cá nhân (SĐT, Email). { "phone": "098...", "address": "..." } { "code": 200, "message": "Cập nhật thành công" }
Account DELETE /api/user/account UserController@destroy Xóa tài khoản (Apple Req). { "reason": "..." } { "code": 200, "message": "Đã lên lịch xóa." }
HRM POST /api/hrm/check-in HrmController@checkIn Chấm công GPS. { "lat": 10.x, "long": 106.x, "uuid": "..." } { "code": 200, "data": { "time": "08:00", "status": "ON_TIME" } }
HRM GET /api/hrm/status HrmController@status Trạng thái nút bấm Check-in. (Bearer Token) { "code": 200, "data": { "state": "IN", "ui": { "color": "RED" } } }
HRM GET /api/hrm/timesheet HrmController@timesheet Lấy lịch sử chấm công & Thống kê tháng (Cho Dashboard). Params: ?month=01-2026 { "code": 200, "data": { "summary": { "total_days": 18, "late": 1 }, "logs": [...] } }
Interact POST /api/user/report ReportController@store Báo cáo/Gửi đơn từ. { "type": "REPORT", "content": "..." } { "code": 200, "message": "Đã gửi." }
Media POST /api/media/upload MediaController@upload Upload file/avatar. FormData: file=@img.jpg { "code": 200, "data": { "url": "https://..." } }
Content GET /api/content/list ContentController@index Danh sách tin tức (Title, Thumbnail). Params: ?type=NEWS&page=1 { "code": 200, "data": { "items": [{ "title": "..." }], "meta": {...} } }
Content GET /api/content/{id} ContentController@show Chi tiết tin tức (HTML Body). (URL Param ID) { "code": 200, "data": { "id": 1, "html_body": "<div>Nội dung...</div>" } }
Notify GET /api/notification/list NotificationController@index Danh sách thông báo (Inbox). Params: ?page=1 { "code": 200, "data": { "items": [{ "title": "Ting ting", "is_read": false }] } }
Notify PUT /api/notification/read NotificationController@read Đánh dấu đã đọc thông báo (Xóa chấm đỏ). { "id": 123 } (hoặc "all") { "code": 200, "success": true }
Notify POST /api/device/register DeviceController@register Đăng ký FCM Token. { "fcm_token": "..." } { "code": 200, "success": true }
Sync POST /api/app/sync SyncController@push Đồng bộ Offline (Check UUID). { "actions": [...] } { "code": 200, "data": { "synced_ids": [...] } }
Config GET /api/app/config AppController@config Cấu hình động. (Không) { "code": 200, "data": { "hotline": "..." } }
Web GET /web/account/delete WebController@deleteView Trang Web xóa tài khoản. (Browser) <html>HTML Content</html>

PHẦN 3: CẤU TRÚC JSON RESPONSE CHI TIẾT
NHÓM 1: AUTHENTICATION (XÁC THỰC & PHÂN QUYỀN)
Quy tắc chung:
• Toàn bộ API thuộc nhóm Auth (Login, Login Apple, Login Google) đều phải trả về cùng một cấu trúc User Object để Frontend dễ dàng lưu vào Redux/Zustand Store.
• Trace ID: Bắt buộc có để truy vết lỗi đăng nhập (đặc biệt quan trọng với Apple/Google Login).
3.1. Đăng nhập thành công (Login Success)
Áp dụng cho các Endpoint:
• POST /api/auth/login (Tài khoản thường)
• POST /api/auth/apple (Apple ID)
• POST /api/auth/google (Gmail)
HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Đăng nhập thành công",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 31536000,
    "user": {
      "id": 101,
      "ulid": "01HR5XQ7PZ5K9...",
      "name": "Nguyen Van A",
      "email": "nhanvien@quocviet.com",
      "phone": "0987654321",
      "avatar": "https://cdn.quocviet.com/avatars/u101_small.jpg",
      "role": "STAFF",
      "status": "ACTIVE",
      "permissions": [
        "action.checkin",
        "action.report",
        "view.news",
        "view.timesheet",
        "social.comment"
      ],
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
  "trace_id": "ulid_auth_login_01HRA..."
}
```

Lưu ý cho Kỹ sư:
• Trường compliance.delete_scheduled_at: Nếu khác null (ví dụ "2026-02-20..."), App phải hiện cảnh báo "Tài khoản đang chờ xóa" cho User biết.
• Trường permissions: Frontend dùng mảng này để ẩn/hiện các nút bấm chức năng (Ví dụ: Không có action.report thì ẩn nút Báo cáo).
________________________________________
3.2. Lấy thông tin User hiện tại (Get Me)
Áp dụng cho Endpoint:
• GET /api/auth/me
Mục đích: Khi User mở lại App, gọi API này để check Token còn sống không và cập nhật lại Avatar/Quyền hạn mới nhất.
HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Lấy thông tin thành công",
  "data": {
    "user": {
      "id": 101,
      "ulid": "01HR5XQ7PZ5K9...",
      "name": "Nguyen Van A",
      "email": "nhanvien@quocviet.com",
      "phone": "0987654321",
      "avatar": "https://cdn.quocviet.com/avatars/u101_small.jpg",
      "role": "STAFF",
      "status": "ACTIVE",
      "permissions": [
        "action.checkin",
        "action.report",
        "view.news",
        "view.timesheet"
      ],
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
      }
    }
  },
  "trace_id": "ulid_auth_me_01HRB..."
}
```

3.3. Các trường hợp lỗi (Error Cases)
Backend phải trả về đúng mã lỗi để App xử lý UX (ví dụ: Token hết hạn thì tự Logout).
Trường hợp 1: Sai mật khẩu / Token không hợp lệ HTTP Status: 401 Unauthorized

```json
{
  "code": 401,
  "status": "error",
  "message": "Thông tin đăng nhập không chính xác hoặc phiên đã hết hạn.",
  "error_code": "AUTH_FAILED",
  "data": null,
  "errors": [],
  "trace_id": "ulid_err_401_..."
}
```

Hành động Frontend: Xóa Token lưu trong máy -> Chuyển về màn hình Login.
Trường hợp 2: Lỗi Validation (Thiếu field, sai định dạng) HTTP Status: 422 Unprocessable Entity

```json
{
  "code": 422,
  "status": "error",
  "message": "Dữ liệu không hợp lệ.",
  "error_code": "VALIDATION_ERROR",
  "data": null,
  "errors": {
    "email": [
      "Email không đúng định dạng."
    ],
    "password": [
      "Mật khẩu phải có ít nhất 6 ký tự."
    ]
  },
  "trace_id": "ulid_err_422_..."
}
```

Hành động Frontend: Hiển thị dòng text đỏ dưới ô input tương ứng.
Trường hợp 3: Tài khoản bị khóa (Blocked) HTTP Status: 403 Forbidden

```json
{
  "code": 403,
  "status": "error",
  "message": "Tài khoản của bạn đã bị vô hiệu hóa hoặc đã bị khóa khóa. Vui lòng liên hệ bộ phận IT hoặc bộ phận nhân sự để biết thêm chi tiết.",
  "error_code": "ACCOUNT_BLOCKED",
  "data": null,
  "trace_id": "ulid_err_403_..."
}
```

Hành động Frontend: Hiện Popup thông báo và chặn đăng nhập.

PHẦN 3 (TIẾP THEO): CẤU TRÚC JSON RESPONSE CHI TIẾT
NHÓM 2: SYSTEM (CẤU HÌNH & KHỞI ĐỘNG)
Mục tiêu:

1. Version Control: Bắt buộc người dùng cập nhật App nếu phiên bản quá cũ.
2. Apple Compliance: Ẩn menu nhạy cảm khi App đang được Review.
3. Dynamic Config: Thay đổi hotline, link chính sách mà không cần build lại App.
2.1. Khởi động App (Bootstrap)
• Endpoint: GET /api/app/bootstrap
• Headers:
o X-App-Version: 1.0.0 (Phiên bản App hiện tại)
o X-Platform: ios hoặc android
• Logic Backend:
o Kiểm tra X-App-Version. Nếu thấp hơn min_required_version -> Trả lỗi 426.
o Kiểm tra chế độ Review -> Lọc mảng menu.
A. TRƯỜNG HỢP THÀNH CÔNG (SUCCESS)
HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Ready",
  "data": {
    "version_info": {
      "current_latest": "1.0.5",
      "min_required": "1.0.0",
      "store_url": "https://apps.apple.com/vn/app/id123456789"
    },
    "settings": {
      "hotline": "1900 1234",
      "support_email": "hotro@quocviet.com",
      "privacy_policy_url": "https://quocviet.com/privacy",
      "terms_url": "https://quocviet.com/terms",
      "currency_unit": "VND",
      "date_format": "DD/MM/YYYY"
    },
    "menu": [
      {
        "id": "home",
        "label": "Trang chủ",
        "icon": "home",
        "action": "NAVIGATE_TAB",
        "target": "HOME",
        "badge_api": null
      },
      {
        "id": "hrm",
        "label": "Chấm công",
        "icon": "fingerprint",
        "action": "NAVIGATE_SCREEN",
        "target": "CHECKIN_SCREEN",
        "badge_api": "/api/hrm/status"
      },
      {
        "id": "news",
        "label": "Tin tức",
        "icon": "newspaper",
        "action": "NAVIGATE_TAB",
        "target": "NEWS",
        "badge_api": "/api/content/unread-count"
      }
      // Menu "Báo cáo" đã bị ẩn Server-side nếu đang Review
    ],
    "features": {
      "enable_social_login": true,
      "enable_ads": false,
      "enable_biometric": true
    }
  },
  "trace_id": "ulid_sys_boot_01HRA..."
}
```

B. CÁC TRƯỜNG HỢP LỖI (ERROR CASES)
Đây là phần quan trọng để Frontend xử lý các tình huống chặn App.
Trường hợp 1: Bắt buộc cập nhật (Force Update) Server phát hiện version client gửi lên (1.0.0) thấp hơn min_required (1.0.5). HTTP Status: 426 Upgrade Required

```json
{
  "code": 426,
  "status": "error",
  "message": "Đã có phiên bản mới. Vui lòng cập nhật để tiếp tục sử dụng.",
  "error_code": "SYS_FORCE_UPDATE",
  "data": {
    "update_url": "https://apps.apple.com/vn/app/id123456789",
    "release_notes": "- Sửa lỗi chấm công\n- Thêm tính năng báo cáo"
  },
  "trace_id": "ulid_err_426_..."
}
```

• Hành động Frontend: Hiện Popup không thể tắt. Chỉ có nút "Cập nhật ngay" dẫn ra Store.
Trường hợp 2: Bảo trì hệ thống (Maintenance Mode) Server đang bật cờ bảo trì toàn hệ thống. HTTP Status: 503 Service Unavailable

```json
{
  "code": 503,
  "status": "error",
  "message": "Hệ thống đang bảo trì nâng cấp.",
  "error_code": "SYS_MAINTENANCE",
  "data": {
    "expected_finish_time": "2026-01-26T12:00:00Z",
    "support_phone": "1900 1234"
  },
  "trace_id": "ulid_err_503_..."
}
```

• Hành động Frontend: Hiện màn hình chờ (Splash Screen đặc biệt) với thông báo bảo trì. Chặn mọi thao tác gọi API khác.
Trường hợp 3: Lỗi Server nội bộ (Internal Server Error) Code Backend bị crash hoặc DB lỗi kết nối. HTTP Status: 500 Internal Server Error

```json
{
  "code": 500,
  "status": "error",
  "message": "Lỗi hệ thống. Vui lòng thử lại sau.",
  "error_code": "SYS_INTERNAL_ERROR",
  "data": null, // Không trả stack trace ra ngoài production
  "trace_id": "ulid_err_500_..."
}
```

• Hành động Frontend: Hiện Toast/Alert: "Có lỗi xảy ra, vui lòng thử lại".
________________________________________
2.2. Ping / Health Check (Tùy chọn)
• Endpoint: GET /api/app/ping
• Mục đích: Để App kiểm tra kết nối mạng hoặc server còn sống hay không (Silent Check).
HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Pong",
  "data": {
    "server_time": "2026-01-26T10:00:00Z" // Dùng để đồng bộ giờ App nếu cần
  },
  "trace_id": "ulid_ping_..."
}
```

TÓM TẮT BẢNG MÃ LỖI NHÓM SYSTEM
HTTP Code Error Code (Frontend Check) Mô tả & Nguyên nhân Hành động UI (Frontend Action)
426 SYS_FORCE_UPDATE Version App quá cũ. Blocking Dialog: Nút "Update" dẫn ra Store. Không cho tắt.
503 SYS_MAINTENANCE Server đang bảo trì. Blocking Screen: Màn hình bảo trì + Thời gian dự kiến.
500 SYS_INTERNAL_ERROR Lỗi Code/DB Backend. Toast/Alert: Báo lỗi chung chung. Cho phép thử lại.
403 SYS_IP_BLOCKED IP người dùng bị chặn (DDoS). Blocking Screen: "Truy cập bị từ chối".

NHÓM 3: UI (SERVER-DRIVEN UI - SDUI)
Mục tiêu:

1. Dynamic Layout: Server quyết định hiển thị cái gì (Banner trước hay Menu trước).
2. Performance: Chỉ trả về cấu trúc (Structure), không trả về toàn bộ dữ liệu nặng (Data). Ví dụ: Block tin tức chỉ chứa cấu hình "hiển thị 5 tin", App sẽ tự gọi API Content để lấy nội dung.
3. Caching: Client bắt buộc Cache response này (TTL 5-10 phút) để App mở lên là thấy giao diện ngay.
3.1. Render Cấu trúc Màn hình (Render Screen)
• Endpoint: GET /api/app/screens/{code}
• Params: ?code=HOME (Hoặc DASHBOARD, PROFILE, SETTINGS)
• Backend Logic:
o Tìm cấu hình màn hình trong DB dựa vào code và user_role (Ví dụ: Sếp thấy biểu đồ doanh thu, Nhân viên thấy biểu đồ chấm công).
o Trả về danh sách các blocks theo thứ tự.
A. TRƯỜNG HỢP THÀNH CÔNG (SUCCESS)
HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Render thành công",
  "data": {
    "screen_code": "HOME",
    "version": "1.2.0", // Dùng để check xem có cần invalid cache không
    "config": {
      "title": "Trang chủ",
      "show_header": true,
      "bg_color": "#F9FAFB",
      "refresh_interval": 300 // Giây (Auto-refresh ngầm)
    },
    "blocks": [
      // BLOCK 1: Banner quảng cáo (Carousel)
      {
        "id": "blk_banner_tet",
        "type": "BANNER_CAROUSEL", // App map với Component <BannerCarousel />
        "order": 1,
        "style": {
          "height": 200,
          "padding_x": 16
        },
        "data": {
          "auto_play": true,
          "items": [
            {
              "image_url": "https://cdn.quocviet.com/banners/tet_2026.jpg",
              "action_type": "OPEN_WEBVIEW",
              "target": "https://quocviet.com/promotion/tet"
            },
            {
              "image_url": "https://cdn.quocviet.com/banners/notification.jpg",
              "action_type": "NAVIGATE_SCREEN",
              "target": "NOTIFICATION_SCREEN"
            }
          ]
        }
      },
      
      // BLOCK 2: Menu tiện ích nhanh (Grid 4 cột)
      {
        "id": "blk_quick_menu",
        "type": "QUICK_ACTION_GRID", // App map với Component <QuickActionGrid />
        "order": 2,
        "style": {
          "columns": 4,
          "bg_color": "#FFFFFF",
          "border_radius": 12
        },
        "data": {
          "items": [
            {
              "label": "Đơn từ",
              "icon_name": "file-text", // Tên icon Lucide
              "icon_color": "#F97316", // Orange
              "bg_color": "#FFF7ED",
              "action_type": "NAVIGATE_SCREEN",
              "target": "REQUEST_LIST"
            },
            {
              "label": "Bảng lương",
              "icon_name": "smartphone",
              "icon_color": "#16A34A", // Green
              "bg_color": "#F0FDF4",
              "action_type": "NAVIGATE_SCREEN",
              "target": "PAYROLL_SCREEN"
            },
             {
              "label": "Chấm công",
              "icon_name": "map-pin",
              "icon_color": "#2563EB", // Blue
              "bg_color": "#EFF6FF",
              "action_type": "NAVIGATE_TAB",
              "target": "CHECKIN_TAB"
            },
            {
              "label": "Cài đặt",
              "icon_name": "settings",
              "icon_color": "#4B5563", // Gray
              "bg_color": "#F3F4F6",
              "action_type": "NAVIGATE_SCREEN",
              "target": "SETTINGS_SCREEN"
            }
          ]
        }
      },

      // BLOCK 3: Widget Thống kê (Chấm công)
      {
        "id": "blk_stats_hrm",
        "type": "STATS_WIDGET", // App map với Component <StatsWidget />
        "order": 3,
        "data": {
          "title": "Hiệu suất tháng này",
          "api_source": "/api/hrm/timesheet?summary_only=true" // App gọi API này để điền số liệu
        }
      },

      // BLOCK 4: Danh sách tin tức (Lazy Load)
      {
        "id": "blk_news_list",
        "type": "VERTICAL_LIST", // App map với Component <VerticalList />
        "order": 4,
        "data": {
          "title": "Tin tức mới nhất",
          "view_more_label": "Xem tất cả",
          "view_more_target": "NEWS_TAB",
          "api_source": "/api/content/list?type=NEWS&limit=5" // App gọi API này để lấy list
        }
      }
    ]
  },
  "trace_id": "ulid_ui_home_01H..."
}
```

B. CÁC TRƯỜNG HỢP LỖI (ERROR CASES)
HTTP Error Code Mô tả (Nguyên nhân) Hành động của App (Frontend Action)
404 UI_SCREEN_NOT_FOUND Param ?code=XYZ không tồn tại trong DB. Hiển thị màn hình Empty State: "Chức năng đang phát triển".
400 UI_VERSION_MISMATCH Cấu hình UI yêu cầu phiên bản App mới hơn (VD: Block mới App chưa code). Bỏ qua các Block lạ, chỉ render các Block cũ (Graceful Degradation).
500 UI_RENDER_ERROR Lỗi logic Server khi build layout. Load layout mặc định từ file default.json trong source code App (Fallback Offline).

3.2. HƯỚNG DẪN KỸ THUẬT (CHO KỸ SƯ FRONTEND/AI)
Logic xử lý phía Mobile App (React Native):

1. Block Mapping (Quan trọng nhất): App cần một file BlockRegistry.tsx để map từ type trong JSON sang Component React:

```php
const BlockRegistry = {
  BANNER_CAROUSEL: BannerCarousel,
  QUICK_ACTION_GRID: QuickActionGrid,
  STATS_WIDGET: StatsWidget,
  VERTICAL_LIST: VerticalList,
  // Nếu Server trả về type lạ -> Render null (tránh crash)
};
```

1. Action Handler: Xử lý sự kiện click dựa trên action_type:
• Maps_SCREEN: Dùng router.push(target).
• Maps_TAB: Dùng router.replace(target).
• OPEN_WEBVIEW: Mở Modal WebView hoặc Linking.openURL.
• OPEN_DEEP_LINK: Mở app khác (Zalo, Maps).
2. Offline Fallback:
• Bước 1: Gọi API /screens/HOME.
• Bước 2: Nếu lỗi mạng -> Load Cache cũ.
• Bước 3: Nếu không có Cache -> Load file src/assets/defaults/home.json.
• Kết quả: App KHÔNG BAO GIỜ TRẮNG TRANG.

NHÓM 4: ACCOUNT (QUẢN LÝ TÀI KHOẢN)
Mục tiêu:

1. Compliance: Đáp ứng quyền "Được lãng quên" (Right to be forgotten) của GDPR và Apple.
2. Security: Đảm bảo khi User đổi mật khẩu hoặc xóa tài khoản, các phiên đăng nhập khác (trên thiết bị khác) phải bị vô hiệu hóa ngay lập tức.
3. Data Integrity: Chỉ cho phép cập nhật các thông tin cá nhân không ảnh hưởng đến nghiệp vụ (Avatar, SĐT cá nhân). Các thông tin như Chức vụ, Phòng ban phải do Admin CMS quản lý.
4.1. Yêu cầu Xóa tài khoản (Delete Account)
• Endpoint: DELETE /api/user/account
• Apple Requirement: Tính năng này phải dễ tìm thấy trong App. Không được bắt User gọi điện hay gửi email thủ công.
• Backend Logic:
4. Kích hoạt SoftDelete trên bản ghi User.
5. Thu hồi (Revoke) tất cả Access Token của User này (Logout khỏi mọi thiết bị).
6. Gửi email xác nhận (nếu có).
7. Cronjob sẽ xóa cứng (Hard Delete) sau 30 ngày.
HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Tài khoản đã được lên lịch xóa.",
  "data": {
    "is_deleted": true,
    "scheduled_permanent_delete_at": "2026-02-26T00:00:00Z", // 30 ngày sau
    "grace_period_days": 30,
    "support_contact": "hotro@quocviet.com",
    "instruction": "Tài khoản của bạn đã bị vô hiệu hóa ngay lập tức. Dữ liệu sẽ được xóa vĩnh viễn khỏi hệ thống sau 30 ngày. Nếu bạn đổi ý, vui lòng liên hệ Admin trước thời hạn này."
  },
  "trace_id": "ulid_acc_del_01HR..."
}
```

4.2. Cập nhật Hồ sơ Cá nhân (Update Profile)
• Endpoint: PUT /api/user/profile
• Mục đích: Cho phép nhân viên cập nhật thông tin liên lạc cá nhân.
• Lưu ý: Không cho phép cập nhật email (vì là định danh đăng nhập), role, department_id qua API này.
Request Body (Client gửi):

```json
{
  "full_name": "Nguyen Van A (Mới)", // Tùy chọn
  "phone_number": "0988888888",      // Tùy chọn
  "avatar_url": "https://cdn.quocviet.com/uploads/new_avatar.jpg", // Tùy chọn (URL từ API Media)
  "address": "Số 1, đường A, TP Vinh" // Tùy chọn
}
```

HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Cập nhật hồ sơ thành công.",
  "data": {
    "user": {
      "id": 101,
      "ulid": "01HR5XQ7PZ...",
      "name": "Nguyen Van A (Mới)",
      "phone": "0988888888",
      "email": "nhanvien@quocviet.com", // Email không đổi
      "avatar": "https://cdn.quocviet.com/uploads/new_avatar.jpg",
      "address": "Số 1, đường A, TP Vinh",
      "updated_at": "2026-01-26T10:30:00Z"
    }
  },
  "trace_id": "ulid_acc_upd_02KX..."
}
```

4.3. Đổi Mật khẩu (Change Password)
• Endpoint: PUT /api/user/change-password
• Backend Logic:

1. Kiểm tra current_password có khớp với DB không.
2. Kiểm tra new_password có đủ độ mạnh không.
3. Hash mật khẩu mới và lưu vào DB.
4. (Tùy chọn Security) Logout các thiết bị khác ngoại trừ thiết bị hiện tại.
Request Body (Client gửi):

```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456@",
  "new_password_confirmation": "NewPassword456@"
}
```

HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Đổi mật khẩu thành công. Vui lòng sử dụng mật khẩu mới cho lần đăng nhập sau.",
  "data": {
    "password_changed_at": "2026-01-26T10:35:00Z",
    "revoke_other_sessions": true // Báo cho App biết là các máy khác đã bị logout
  },
  "trace_id": "ulid_acc_pwd_03MZ..."
}
```

4.4. CÁC TRƯỜNG HỢP LỖI (ERROR CASES - NHÓM ACCOUNT)
HTTP Error Code Mô tả (Nguyên nhân) Hành động của App (Frontend Action)
422 ACC_CURRENT_PASSWORD_WRONG Mật khẩu cũ không chính xác. Hiển thị lỗi ngay dưới ô nhập "Mật khẩu cũ".
422 ACC_NEW_PASSWORD_SAME Mật khẩu mới trùng mật khẩu cũ. Báo lỗi: "Mật khẩu mới phải khác mật khẩu cũ".
422 ACC_WEAK_PASSWORD Mật khẩu không đủ mạnh (ngắn, thiếu số...). Hiển thị yêu cầu: "Tối thiểu 8 ký tự, gồm chữ hoa và số".
403 ACC_DELETE_RESTRICTED Admin hệ thống không thể tự xóa tài khoản mình. Báo lỗi: "Vui lòng liên hệ cấp trên để xóa tài khoản Admin".
403 ACC_PROFILE_LOCKED Hồ sơ đang bị khóa chỉnh sửa (do vi phạm). Báo lỗi: "Hồ sơ đang bị khóa. Liên hệ HR".
4.5. HƯỚNG DẪN KỸ THUẬT (CHO KỸ SƯ BACKEND)
Logic Xử lý Xóa Tài khoản (Clean Architecture):
Yêu cầu kỹ sư tạo một DeleteAccountAction riêng biệt để đảm bảo không dính líu đến logic khác.
Lưu ý quan trọng cho Frontend: Khi gọi API Xóa tài khoản thành công, App cần thực hiện chuỗi hành động:

1. Hiển thị thông báo thành công.
2. Chờ user bấm "OK".
3. Xóa Token lưu trong SecureStore.
4. Điều hướng về màn hình Login (router.replace('/login')).

NHÓM 5: HRM (QUẢN TRỊ NHÂN SỰ & CHẤM CÔNG)
Mục tiêu:

1. Chống gian lận: Xác thực vị trí (GPS) và mạng (Wifi BSSID) chặt chẽ server-side.
2. Real-time Feedback: Phản hồi ngay lập tức trạng thái (Đi muộn/Về sớm) để nhân viên biết.
3. Dashboard Data: Cung cấp số liệu tổng hợp để vẽ biểu đồ hiệu suất trên Mobile.
5.1. Chấm công (Check-In / Check-Out)
• Endpoint: POST /api/hrm/check-in
• Rate Limit: 1 request / 1 phút (Chống spam).
• Backend Logic:
4. Kiểm tra uuid (Idempotency) để tránh chấm công trùng.
5. Tính khoảng cách từ lat/long gửi lên so với office_location trong DB.
6. (Option) Kiểm tra bssid (Mac Address Wifi) có khớp danh sách Wifi công ty không.
7. Xác định đây là Check-in hay Check-out dựa trên lịch sử trong ngày.
Request Body (Client gửi):

```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000", // Unique ID từ App
  "latitude": 10.7769,
  "longitude": 106.7009,
  "accuracy": 15.5, // Độ chính xác GPS (mét)
  "device_id": "device_identifier_string",
  "bssid": "aa:bb:cc:dd:ee:ff", // Wifi Mac Address (nếu có)
  "network_type": "WIFI" // hoặc 4G
}
```

HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Chấm công thành công!",
  "data": {
    "log_id": 998877,
    "time": "08:15:22",
    "date": "2026-01-26",
    "type": "CHECK_IN", // CHECK_IN hoặc CHECK_OUT
    "status": "LATE",   // ON_TIME, LATE, EARLY
    "status_label": "Đi muộn 15 phút",
    "office_name": "Văn phòng Chính (HCM)",
    "current_streak": 5 // Chuỗi đi làm liên tục (Gamification)
  },
  "trace_id": "ulid_hrm_checkin_01..."
}
```

5.2. Lấy Trạng thái Chấm công (Get Status)
• Endpoint: GET /api/hrm/status
• Mục đích: Giúp App vẽ UI nút bấm chính xác (Màu Xanh hay Đỏ, Label là "Vào Ca" hay "Ra Về").
HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Lấy trạng thái thành công",
  "data": {
    "current_state": "CHECKED_IN", // NULL (Chưa chấm), CHECKED_IN, CHECKED_OUT
    "last_log": {
      "time": "08:15:00",
      "type": "CHECK_IN",
      "location": "Văn phòng Chính"
    },
    "today_summary": {
      "working_hours": 4.5, // Số giờ đã làm hôm nay
      "required_hours": 8.0
    },
    "ui": {
      "button_color": "#EF4444", // Red (cho nút Check Out)
      "button_label": "Check Out (Kết thúc ca)",
      "button_icon": "log-out",
      "is_disabled": false,
      "disabled_reason": null
    }
  },
  "trace_id": "ulid_hrm_status_02..."
}
```

5.3. Lịch sử & Bảng công (Timesheet & Dashboard)
• Endpoint: GET /api/hrm/timesheet
• Params: ?month=01-2026
• Logic: Trả về cả danh sách nhật ký (Logs) và số liệu tổng hợp (Summary) để App vẽ biểu đồ Dashboard (như trong file UX_UI.js).
HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Lấy dữ liệu bảng công thành công",
  "data": {
    "period": "01-2026",
    "summary": {
      "total_work_days": 22, // Tổng công chuẩn
      "actual_work_days": 18, // Công thực tế (Số hiển thị trên Dashboard)
      "late_days": 1,         // Số lần đi muộn
      "early_leave_days": 0,  // Số lần về sớm
      "paid_leave_days": 1,   // Số ngày nghỉ phép có lương
      "performance_score": 98 // Điểm hiệu suất (%)
    },
    "logs": [
      {
        "date": "2026-01-26",
        "day_of_week": "Thứ Hai",
        "check_in": "08:15:00",
        "check_out": null,
        "status": "LATE",
        "status_color": "text-orange-500", // Gợi ý màu cho App
        "work_hours": 0
      },
      {
        "date": "2026-01-25",
        "day_of_week": "Chủ Nhật",
        "check_in": null,
        "check_out": null,
        "status": "OFF",
        "status_color": "text-gray-400",
        "work_hours": 0
      },
      {
        "date": "2026-01-24",
        "day_of_week": "Thứ Bảy",
        "check_in": "08:00:00",
        "check_out": "12:00:00",
        "status": "ON_TIME",
        "status_color": "text-green-600",
        "work_hours": 4
      }
    ]
  },
  "trace_id": "ulid_hrm_timesheet_03..."
}
```

5.4. CÁC TRƯỜNG HỢP LỖI (ERROR CASES - NHÓM HRM)
HTTP Error Code Mô tả (Nguyên nhân) Hành động của App (Frontend Action)
400 HRM_OUT_OF_RANGE GPS nằm ngoài bán kính cho phép (VD: > 100m). Hiển thị Map mini + Vòng tròn bán kính. Báo: "Bạn đang ở quá xa văn phòng".
400 HRM_INVALID_WIFI Kết nối Wifi lạ (Không phải Wifi công ty). Báo lỗi: "Vui lòng kết nối vào Wifi công ty để chấm công".
400 HRM_FAKE_GPS Server phát hiện tọa độ giả mạo (Mock Location). Cảnh báo đỏ: "Phát hiện giả mạo vị trí. Hành vi này sẽ bị ghi lại."
400 HRM_DUPLICATE Gửi request check-in quá nhanh (Spam). Toast: "Bạn vừa chấm công rồi, vui lòng đợi thêm."
422 HRM_DEVICE_INVALID Thiết bị chưa được đăng ký (Device ID lạ). Chuyển hướng sang màn hình "Đăng ký thiết bị mới".
403 HRM_SHIFT_LOCKED Chưa đến giờ vào ca hoặc đã hết giờ cho phép. Báo lỗi: "Chưa đến khung giờ chấm công."

5.5. HƯỚNG DẪN KỸ THUẬT (CHO KỸ SƯ BACKEND)
Logic Chống Gian Lận (Anti-Cheat):

1. GPS Distance Calculation (Haversine Formula): Tính khoảng cách giữa (user_lat, user_long) và (office_lat, office_long). Nếu distance > radius_limit (VD: 100m) -> Reject ngay lập tức.
2. Wifi Validation: Nếu cấu hình công ty yêu cầu Wifi, so sánh bssid (Mac Address) gửi lên với danh sách trắng (Whitelist) trong DB. Không check SSID (tên Wifi) vì tên dễ bị giả.
3. Idempotency (Chống Double Check-in):

```php
// Pseudo-code Laravel
$lock = Cache::lock('checkin_user_' . $user->id, 60); // Lock 60 giây
if (!$lock->get()) {
    return $this->error('Thao tác quá nhanh', 'HRM_DUPLICATE');
}
// ... Xử lý checkin ...
```

NHÓM 6: INTERACT (TƯƠNG TÁC & GỬI ĐƠN TỪ)
Mục tiêu:

1. Centralized Submission: Xử lý mọi loại form (Báo cáo lỗi, Xin nghỉ phép, Đề xuất thanh toán) qua một cơ chế thống nhất.
2. S.O.L.I.D: Sử dụng Factory Pattern để xử lý từng loại đơn từ khác nhau mà không làm phình Controller.
3. Tracking: Mọi tương tác đều phải trả về ticket_id để User theo dõi tiến độ.
6.1. Gửi Yêu cầu / Báo cáo (Submit Interaction)
• Endpoint: POST /api/user/report (Hoặc /api/interact/submit tùy quy hoạch route)
• Backend Logic:
o Validate type (VD: REPORT_ERROR, LEAVE_REQUEST, PAYMENT_PROPOSAL).
o Validate payload dynamic theo từng type (Ví dụ: Nghỉ phép cần ngày bắt đầu/kết thúc; Báo lỗi cần ảnh chụp màn hình).
o Lưu vào DB và bắn thông báo cho người duyệt (Manager).
Request Body (Client gửi):

```json
{
  "type": "LEAVE_REQUEST", // Loại yêu cầu
  "content": "Xin nghỉ phép đi khám bệnh",
  "payload": { // Dữ liệu động tùy theo loại
    "start_date": "2026-01-28",
    "end_date": "2026-01-29",
    "reason_code": "SICK"
  },
  "attachments": [ // Mảng URL hoặc ID file đã upload từ API Media
    "https://cdn.quocviet.com/uploads/2026/01/giay_kham_benh.jpg"
  ]
}
```

HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Đơn xin nghỉ phép của bạn đã được gửi thành công.",
  "data": {
    "ticket_id": "REQ_20260126_001",
    "created_at": "2026-01-26T14:30:00Z",
    "status": "PENDING", // PENDING, APPROVED, REJECTED
    "reviewer": "Trưởng phòng Kỹ Thuật",
    "estimated_response_time": "24h"
  },
  "trace_id": "ulid_interact_sub_01..."
}
```

6.2. CÁC TRƯỜNG HỢP LỖI (ERROR CASES - NHÓM INTERACT)
HTTP Error Code Mô tả (Nguyên nhân) Hành động của App (Frontend Action)
422 INT_TYPE_INVALID Gửi loại đơn từ không tồn tại. Báo lỗi: "Loại yêu cầu không hợp lệ".
422 INT_MISSING_FIELDS Thiếu dữ liệu bắt buộc (VD: Nghỉ phép thiếu ngày). Hiển thị lỗi đỏ tại các trường còn thiếu.
422 INT_DATE_INVALID Ngày kết thúc nhỏ hơn ngày bắt đầu. Báo lỗi: "Thời gian nghỉ không hợp lệ".
403 INT_QUOTA_EXCEEDED Hết phép năm (với đơn nghỉ phép). Báo lỗi: "Bạn đã dùng hết số ngày nghỉ phép".
429 INT_SPAM_DETECTED Gửi liên tục 5 yêu cầu trong 1 phút. Toast: "Vui lòng đợi giây lát trước khi gửi tiếp".

NHÓM 7: MEDIA (MEDIA SERVICE - UPLOAD)
Mục tiêu:

1. Decoupling: Tách biệt việc upload file ra khỏi logic nghiệp vụ. Upload xong chỉ trả về URL/ID.
2. Performance: Xử lý resize ảnh, nén ảnh (Server-side) để tối ưu băng thông App.
3. Security: Chặn upload file độc hại (.exe, .php, .sh).
7.1. Upload File (Universal Upload)
• Endpoint: POST /api/media/upload
• Headers: Content-Type: multipart/form-data
• Params (Form Data):
o file: (Binary) File ảnh hoặc tài liệu.
o folder: (String) avatars, reports, checkins (Để backend sắp xếp thư mục lưu trữ).
Request (Multipart Form):
• file: @image.jpg
• folder: reports
HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Upload thành công",
  "data": {
    "file_id": 9876,
    "original_name": "screenshot_error.jpg",
    "mime_type": "image/jpeg",
    "size_kb": 150,
    "url": "https://cdn.quocviet.com/uploads/reports/2026/01/screenshot_error_optimized.jpg",
    "thumbnail_url": "https://cdn.quocviet.com/uploads/reports/2026/01/thumb_screenshot_error.jpg",
    "expires_at": null // Nếu là file tạm thì có thời hạn
  },
  "trace_id": "ulid_media_up_02..."
}
```

7.2. CÁC TRƯỜNG HỢP LỖI (ERROR CASES - NHÓM MEDIA)
HTTP Error Code Mô tả (Nguyên nhân) Hành động của App (Frontend Action)
413 MED_FILE_TOO_LARGE File lớn hơn giới hạn (VD: > 5MB). Alert: "Dung lượng file quá lớn (Max 5MB)".
415 MED_INVALID_FORMAT Định dạng không hỗ trợ. Alert: "Chỉ chấp nhận ảnh (JPG, PNG) hoặc PDF".
500 MED_STORAGE_ERROR Lỗi kết nối S3/Disk Full. Toast: "Lỗi lưu trữ, vui lòng thử lại sau".
7.3. HƯỚNG DẪN KỸ THUẬT (CHO KỸ SƯ BACKEND)

1. Chiến lược Upload (Clean Architecture): Upload không nên xử lý trong Controller. Hãy dùng MediaService.
2. Chiến lược Xử lý Interact (Factory Pattern - S.O.L.I.D): Tương tự như HRM, Interact cần Factory để mở rộng dễ dàng.
Lợi ích: Khi sếp yêu cầu thêm tính năng "Đề xuất mua văn phòng phẩm", bạn chỉ cần tạo thêm class StationeryRequestAction mà không cần sửa code cũ.

NHÓM 8: CONTENT (NỘI DUNG & TIN TỨC)
Mục tiêu:
3. Lazy Loading: Tách biệt danh sách (nhẹ) và chi tiết (nặng) để App lướt mượt mà.
4. Rich Content: Hỗ trợ trả về HTML Body để hiển thị văn bản định dạng phức tạp (Bảng biểu, hình ảnh).
8.1. Danh sách Tin tức (News List)
• Endpoint: GET /api/content/list
• Params: ?type=NEWS (hoặc ANNOUNCEMENT, POLICY), ?page=1, ?limit=10
• Backend Logic: Chỉ trả về summary (tóm tắt) và thumbnail, không trả về nội dung HTML để tiết kiệm băng thông.
HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Lấy danh sách thành công",
  "data": {
    "items": [
      {
        "id": 101,
        "title": "Thông báo lịch nghỉ Tết Nguyên Đán 2026",
        "slug": "thong-bao-nghi-tet-2026",
        "summary": "Công ty xin thông báo lịch nghỉ tết chính thức từ ngày 14/02 đến hết ngày 20/02...",
        "thumbnail_url": "https://cdn.quocviet.com/news/tet2026_thumb.jpg",
        "published_at": "2026-01-15T08:00:00Z",
        "is_featured": true, // Tin nổi bật (Ghim lên đầu)
        "category": {
          "id": 1,
          "name": "Thông báo Hành chính",
          "color": "#EF4444"
        }
      },
      {
        "id": 102,
        "title": "Hướng dẫn quy trình thanh toán mới",
        "slug": "quy-trinh-thanh-toan-moi",
        "summary": "Áp dụng từ ngày 01/02/2026, quy trình thanh toán sẽ thay đổi như sau...",
        "thumbnail_url": "https://cdn.quocviet.com/news/payment_thumb.jpg",
        "published_at": "2026-01-14T10:00:00Z",
        "is_featured": false,
        "category": {
          "id": 2,
          "name": "Quy trình nội bộ",
          "color": "#3B82F6"
        }
      }
    ],
    "meta": {
      "current_page": 1,
      "last_page": 5,
      "per_page": 10,
      "total": 42
    }
  },
  "trace_id": "ulid_content_list_01..."
}
```

8.2. Chi tiết Tin tức (News Detail)
• Endpoint: GET /api/content/{id}
• Mục đích: Trả về nội dung chi tiết để hiển thị.
HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Lấy chi tiết thành công",
  "data": {
    "id": 101,
    "title": "Thông báo lịch nghỉ Tết Nguyên Đán 2026",
    "author": "Phòng Hành Chính",
    "published_at": "2026-01-15T08:00:00Z",
    "html_content": "<!DOCTYPE html><html><head><style>body{font-family:sans-serif;padding:16px;line-height:1.6}img{max-width:100%;height:auto;border-radius:8px}</style></head><body><h1>Thông báo nghỉ Tết</h1><p>Kính gửi toàn thể nhân viên...</p><img src='https://cdn.quocviet.com/news/tet2026_full.jpg' /><p>Chúc mừng năm mới!</p></body></html>",
    "attachments": [
      {
        "name": "Quyet_dinh_nghi_tet.pdf",
        "url": "https://cdn.quocviet.com/files/qd_tet.pdf",
        "size_kb": 2048,
        "type": "application/pdf"
      }
    ],
    "related_news": [
      { "id": 99, "title": "Lịch trực tết bảo vệ", "thumbnail_url": "..." }
    ]
  },
  "trace_id": "ulid_content_detail_02..."
}
```

NHÓM 9: NOTIFY (THÔNG BÁO)
Mục tiêu:

1. Deep Linking: Bấm vào thông báo phải mở đúng màn hình (Ví dụ: Bấm thông báo Lương -> Mở màn hình Lương, bắt nhập lại Pass).
2. Read State: Đồng bộ trạng thái Đã đọc/Chưa đọc giữa các thiết bị.
9.1. Đăng ký Thiết bị (Register Device)
• Endpoint: POST /api/device/register
• Mục đích: Gửi FCM Token lên Server để nhận Push Notification.
Request Body:

```json
{
  "fcm_token": "dKPj7...",
  "device_id": "unique_device_id_generated_by_app",
  "device_name": "iPhone 15 Pro",
  "os": "ios",
  "os_version": "17.2"
}
```

HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Đăng ký thiết bị thành công",
  "data": {
    "device_id": "unique_device_id_generated_by_app",
    "registered_at": "2026-01-26T15:00:00Z"
  },
  "trace_id": "ulid_dev_reg_03..."
}
```

9.2. Danh sách Thông báo (Notification Inbox)
• Endpoint: GET /api/notification/list
• Params: ?page=1
HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Lấy thông báo thành công",
  "data": {
    "unread_count": 2, // Số hiển thị trên badge icon quả chuông
    "items": [
      {
        "id": 555,
        "title": "Phiếu lương tháng 12/2025",
        "body": "Bảng lương của bạn đã được cập nhật. Vui lòng kiểm tra.",
        "type": "SALARY",
        "icon_url": "https://cdn.quocviet.com/icons/salary.png",
        "is_read": false,
        "created_at": "2026-01-10T09:00:00Z",
        "action_target": "PAYROLL_SCREEN",
        "action_params": { "month": "12-2025" }
      },
      {
        "id": 554,
        "title": "Cảnh báo: Đi muộn",
        "body": "Hôm nay bạn đi muộn 15 phút. Vui lòng gửi giải trình.",
        "type": "WARNING",
        "icon_url": "https://cdn.quocviet.com/icons/warning.png",
        "is_read": true,
        "created_at": "2026-01-09T08:00:00Z",
        "action_target": "REPORT_SCREEN",
        "action_params": { "report_type": "LATE_EXPLANATION" }
      }
    ],
    "meta": {
      "current_page": 1,
      "last_page": 10,
      "total": 98
    }
  },
  "trace_id": "ulid_notify_list_04..."
}
```

9.3. Đánh dấu Đã đọc (Mark as Read)
• Endpoint: PUT /api/notification/read
• Request Body: { "id": 555 } (Hoặc { "id": "all" } để đọc tất cả).
HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Đã cập nhật trạng thái",
  "data": {
    "unread_count": 1 // Số mới sau khi đọc
  },
  "trace_id": "ulid_notify_read_05..."
}
```

NHÓM 10: SYNC (ĐỒNG BỘ OFFLINE)
Mục tiêu:

1. Reliability: Đảm bảo dữ liệu tạo ra khi mất mạng (Check-in, Gửi báo cáo) được đẩy lên Server ngay khi có mạng.
2. Data Integrity: Sử dụng UUID để chống trùng lặp (Idempotency).
10.1. Đẩy dữ liệu Offline (Push Sync)
• Endpoint: POST /api/app/sync
• Logic: App gom các action lưu trong Local DB thành mảng và gửi lên 1 lần (Batch Processing).
Request Body (Client gửi):

```json
{
  "actions": [
    {
      "uuid": "uuid-action-001", // ID duy nhất tạo từ App
      "type": "CHECK_IN",
      "timestamp": 1706227200, // Unix Timestamp lúc bấm nút
      "payload": {
        "lat": 10.7,
        "long": 106.6
      }
    },
    {
      "uuid": "uuid-action-002",
      "type": "REPORT_ERROR",
      "timestamp": 1706230800,
      "payload": {
        "content": "Wifi tầng 3 bị hỏng"
      }
    }
  ]
}

```

HTTP Status: 200 OK

```json
{
  "code": 200,
  "status": "success",
  "message": "Đồng bộ dữ liệu hoàn tất",
  "data": {
    "processed_count": 2,
    "synced_ids": [
      "uuid-action-001", // App dựa vào list này để xóa khỏi Local DB
      "uuid-action-002"
    ],
    "failed_ids": [
      // Nếu có lỗi, trả về ID và lý do để App xử lý (VD: Thử lại sau)
      // { "uuid": "uuid-action-003", "error": "VALIDATION_FAILED" }
    ]
  },
  "trace_id": "ulid_sync_push_06..."
}
```
