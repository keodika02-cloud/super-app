# TÀI LIỆU KIẾN TRÚC & ĐỒNG BỘ HỆ THỐNG SDUI (MOBILE - WEB ADMIN - BACKEND)

Tài liệu này giải thích chi tiết gốc rễ kiến trúc hoạt động của hệ thống UI điều khiển từ Server (Server-Driven UI), mối quan hệ giữa các nền tảng và cách để giữ chúng luôn đồng bộ 100%, tránh tình trạng "lệch pha" (App có tab này nhưng Web Admin hiển thị tab khác).

---

## 1. BỨC TRANH TOÀN CẢNH (THE BIG PICTURE)

Hệ thống của chúng ta gồm 3 phần tương tác chặt chẽ với nhau:

1.  **Mobile App (Client - React Native/Expo):** "Búp bê vô tri". Không tự quyết định nội dung hiển thị ở giữa màn hình. Nó chỉ giữ cái "Khung" (Bottom Navigation Tabs, Top Header). Nội dung bên trong được lấy từ Backend.
2.  **Backend (Laravel - API V3):** "Bộ não". Lưu trữ toàn bộ dữ liệu cấu hình các khối (Blocks) UI cho từng Màn hình (Screen).
3.  **Frontend Admin (Web CMS - ReactJS):** "Bảng điều khiển". Giao diện để Quản trị viên xếp hình, kéo thả, tùy chỉnh các khối UI. Những thay đổi ở đây được bắn xuống Backend, và ngay lập tức Mobile App sẽ phản hồi.

---

## 2. ÁNH XẠ CHI TIẾT TỪNG FILE CODE (MAPPING)

Để hệ thống khớp nhau, 3 phần này phải có chung "ngôn ngữ", cụ thể là định danh các màn hình (`screen_slug`). Dưới đây là các file quy định "sự sống còn" của hệ thống này:

### A. Tầng Mobile App (`f:\project\appqvc2026`)
*   **File "Bộ khung xương":** `app/(main)/_layout.tsx`
    *   **Nhiệm vụ:** Định nghĩa cứng 5 Tabs (Bottom Navigation) của App. Ở đây chứa các Màn hình gốc.
    *   **Hiện tại có:** `Trang chủ` (index.tsx), `CRM` (crm.tsx), `Chấm công` (checkin.tsx), `Thông báo` (notifications.tsx), `Hồ sơ` (profile.tsx).
*   **File "Lắp ráp màn hình":** `app/(main)/index.tsx`, `app/(main)/checkin.tsx`, ...
    *   **Nhiệm vụ:** Trong mỗi trang này, sẽ gọi chung 1 cục logic: Lấy `screen_slug` (VD: Trang chủ -> `slug = goto_feed`) truyền lên API Backend sinh ra các giao diện.
*   **Trái tim SDUI:** `src/core/sdui/LayoutEngine.tsx` hoặc xử lý mảng layout trực tiếp trong file màn hình. Nhận JSON từ Backend và dùng lệnh `switch(block.type)` để vẽ `<BannerBlock>`, `<GridMenuBlock>`,...

### B. Tầng Backend API V3 (`f:\project\backend`)
*   **Danh bạ Màn hình (Models):** `app/Models/AppScreen.php`
    *   **Nhiệm vụ:** Lưu trong Database table `app_screens`. Nó khai báo cho hệ thống biết "App đang có tổng cộng bao nhiêu cái màn hình gốc".
    *   *LỖI TRƯỚC ĐÂY NẰM Ở ĐÂY:* DB này đang lưu dữ liệu cũ (VD: Màn hình Danh bạ, Báo cáo, Trợ lý AI), trong khi Mobile App lại code cứng 5 tab gốc là (Trang chủ, CRM, Chấm công, Thông báo, Hồ sơ).
*   **Linh kiện Màn hình (Models):** `app/Models/AppUI.php`
    *   **Nhiệm vụ:** Bảng `app_ui` lưu trữ các "Cục gạch" (Blocks) thuộc về cái Màn hình nào. Khóa ngoại liên kết qua `screen_slug`.
*   **API Xử lý:**
    *   `app/Http/Controllers/Api/V3/Admin/AppScreenController.php` (Frontend Admin gọi để vẽ Cột bên trái)
    *   `app/Http/Controllers/Api/V3/AppConfigController.php` (Mobile gọi để lấy cấu hình render App)

### C. Tầng Frontend Admin Web (`f:\project\frontend`)
*   **Trình Mô phỏng App:** `src/components/SDUI/MobilePreviewFrame.jsx`
    *   **Nhiệm vụ:** Cố gắng vẽ lại y hệt 100% Mobile App trên Web. Component này mình đã sửa lại cứng 5 Tabs Bottom y đúc app Mobile (Trang chủ, CRM, Chấm công, Thông báo, Hồ sơ).
*   **Bảng Điều Khiển SDUI:** `src/pages/Admin/AppSDUIManager.jsx`
    *   **Nhiệm vụ:** Sinh gọi API GET `/api/v3/admin/app-screens` để lấy mảng màn hình tạo ra Cột Sidebar cấu hình bên Trái.

---

## 3. QUY TRÌNH CHUẨN ĐỂ KHÔNG BAO GIỜ BỊ LỆCH PHA

Mỗi khi Anh muốn đổi một Tab, thêm Tab, hoặc sửa tên Tab dưới cùng trên App Mobile (Bottom Nav), BỊ NGHIÊM CẤM làm riêng rẽ lẻ tẻ. Quy trình phải tuân thủ đúng 3 bước:

1.  **Sửa App:** Vào `appqvc2026/app/(main)/_layout.tsx` thêm/sửa thẻ `<Tabs.Screen>`. Định danh ra 1 `slug` (Ví dụ tab Kho Hàng -> `goto_warehouse`). Tạo thêm file `warehouse.tsx`.
2.  **Sửa Backend (Database):** Cập nhật dữ liệu vào bảng `app_screens`. (Sửa `name` và `slug`).
3.  **Sửa UI Giả lập Web:** Vào `MobilePreviewFrame.jsx`, kéo xuống chô Bottom Tabs tĩnh, thêm nút có `slug: 'goto_warehouse'`.

Làm đúng 3 bước, hệ thống sẽ ăn khớp với nhau từ trong ra ngoài.

---

## 4. LỆNH CẤP CỨU ĐỒNG BỘ HIỆN TẠI (CHẠY THỦ CÔNG)

Do cơ sở dữ liệu (Database) Backend của anh vẫn đang lưu cái Danh sách "AppScreen" cũ rích lúc trước, đâm ra cái Cột Sidebar bên trái của SDUI Control vẫn đang hiện "Màn hình Danh bạ, Màn hình App AI,...".

**Cách xử lý dứt điểm lệch cục này:** Anh mở Terminal, chui vào thư mục `f:\project\backend` và chạy trực tiếp lệnh PHP sau (Em đã viết lệnh ở dạng không làm anh phải tạo gõ SQL mệt):

**Dòng lệnh cần chạy (Copy & Paste vào Terminal Backend):**

```bash
cd f:\project\backend
php -r "require 'vendor/autoload.php'; \$app = require_once 'bootstrap/app.php'; \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); \App\Models\AppScreen::truncate(); \App\Models\AppScreen::insert([['name'=>'Trang chủ', 'slug'=>'goto_feed', 'icon'=>'🏠', 'layout_type'=>'feed', 'position'=>1], ['name'=>'CRM (Tương lai)', 'slug'=>'goto_crm', 'icon'=>'🌐', 'layout_type'=>'dashboard', 'position'=>2], ['name'=>'Chấm công', 'slug'=>'goto_attendance', 'icon'=>'📍', 'layout_type'=>'dashboard', 'position'=>3], ['name'=>'Thông báo', 'slug'=>'goto_notification', 'icon'=>'🔔', 'layout_type'=>'feed', 'position'=>4], ['name'=>'Hồ sơ', 'slug'=>'goto_profile', 'icon'=>'👤', 'layout_type'=>'dashboard', 'position'=>5]]); echo '✅ DA DONG BO XONG 5 SCREEN CHO ADMIN!';"

```

**Kết quả sau khi chạy:**
1. Database `app_screens` sẽ xóa sạch các màn cũ rác.
2. Insert đúng 5 màn hình mapping với Mobile (*Trang chủ, CRM, Chấm công, Thông báo, Hồ sơ*).
3. Anh F5 lại trang Web Admin chỗ Kiến tạo App SDUI, Cột bên trái sẽ lập tức gọn gàng, khớp màu 100% với màn hình Simulator bên phải lúc Click chuột. Không còn chuyện Simulator hiện 1 đằng mà Cột Sidebar hiện một nẻo nữa!
