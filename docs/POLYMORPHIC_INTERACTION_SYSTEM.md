# KẾ HOẠCH TRIỂN KHAI CHI TIẾT: HỆ THỐNG BÌNH LUẬN & THẢ TIM ĐA HÌNH (POLYMORPHIC)

**Mục tiêu tối thượng**: Đảm bảo hệ thống có thể **tái sử dụng 100% ở mọi nơi** (Bảng tin, Quản lý Công việc, Báo cáo, Xin nghỉ...) mà **KHÔNG BAO GIỜ CRASH APP**, thông qua thiết kế API chặt chẽ và Zod Schema bảo vệ 2 lớp.

## 1. Kiến trúc Database (Backend)

Vì yêu cầu gắn được ở bất kỳ module nào, ta sử dụng **Polymorphic Relations** của Eloquent.

#### Bảng `comments`
- `id` (bigint, PK)
- `user_id` (bigint, người bình luận)
- `commentable_type` (string) -> VD: `App\Models\NewsFeed` hoặc `App\Models\Task`
- `commentable_id` (bigint) -> VD: ID bài viết = 1
- `parent_id` (bigint, nullable) -> Trỏ tới comment gốc (Nested Reply: Mở ra thu gọn)
- `content` (text)
- `images` (json, lưu mảng URL ảnh, nullable)
- `created_at`, `updated_at`

#### Bảng `likes`
- `id` (bigint, PK)
- `user_id` (bigint)
- `likeable_type` (string)
- `likeable_id` (bigint)
- `type` (string) -> Enum: `like`, `love`, `haha`...
- Cặp Khóa `[user_id, likeable_type, likeable_id]` phải là **UNIQUE** để 1 người không like 2 lần 1 thứ.

## 2. Thiết kế API Giao Tiếp (Tái sử dụng Mọi Nơi)

Ta sẽ tạo 1 Controller lõi `AppInteractionController.php` để xử lý chung. Request đẩy lên chỉ cần khai báo `model_type` (VD: `news-feed`, `task`) và `model_id`.

#### A. Lấy danh sách Bình luận (Cây Lồng Nhau)
`GET /v3/app/interactions/{model_type}/{model_id}/comments`
- **Output (Theo chuẩn Envelope ApiResponse):**
```json
{
    "success": true,
    "message": "Success",
    "data": [
        {
            "id": 101,
            "user": { "id": 12, "name": "Nguyễn Văn A", "avatar": "url..." },
            "content": "Tuyệt vời sếp ơi!",
            "images": ["url_anh_1"],
            "created_at": "2026-02-25T10:00:00Z",
            "reply_count": 2, // Backend đếm sẵn để UI biết chặn Mở/Thu gọn
            "replies": [
                {
                    "id": 102,
                    "user": { "id": 15, "name": "Lê B", "avatar": null },
                    "content": "Quá xịn!",
                    "images": [],
                    "created_at": "2026-02-25T10:05:00Z"
                }
            ]
        }
    ]
}
```

#### B. Đăng Bình luận mới (Hỗ trợ Reply)
`POST /v3/app/interactions/{model_type}/{model_id}/comments`
- **Body Request:**
```json
{
    "content": "Tôi đồng ý với QA.",
    "parent_id": 101, // Tùy chọn, nếu truyền vào thì được hiểu là Reply của Cmt 101
    "images": [] // Array Base64 hoặc URL
}
```

#### C. Bật/Tắt Thả Tim (Toggle Like)
`POST /v3/app/interactions/{model_type}/{model_id}/like`
- **Body Request:**
```json
{
    "type": "like" // Hoặc "love", "haha"
}
```
- **Output:** Trả về Model hiện tại mang trạng thái mới.
```json
{
    "success": true,
    "data": { "is_liked_by_me": true, "total_likes": 45 }
}
```

## 3. Vỏ Bọc Kính Chống Đạn (Frontend Zod Schema)

Bảo vệ App tuyệt đối ở file `api-endpoints.ts` để Dữ liệu Backend rác không đánh sập App.

```typescript
const SharedUserSchema = z.object({
    id: z.number().catch(0),
    name: z.string().catch('User'),
    avatar: z.string().nullable().catch(null)
});

// Schema Đệ Quy (Recursive Schema) cho Nested Replies
const BaseCommentSchema = z.object({
    id: z.number().catch(0),
    user: SharedUserSchema.catch({ id: 0, name: 'Unknown', avatar: null }),
    content: z.string().catch(''),
    images: z.array(z.string()).catch([]),
    created_at: z.string().catch(new Date().toISOString()),
    reply_count: z.number().catch(0),
});

export type AppComment = z.infer<typeof BaseCommentSchema> & {
    replies?: AppComment[];
};

export const CommentNodeSchema: z.ZodType<AppComment> = BaseCommentSchema.extend({
    replies: z.lazy(() => CommentNodeSchema.array().optional().catch([]))
});

export const ToggleLikeResSchema = z.object({
    is_liked_by_me: z.boolean().catch(false),
    total_likes: z.number().catch(0)
});
```

## 4. Thành Phần UI Tái Sử Dụng Giao Diện

**a) `<LikeButton />`**
- Component độc lập truyền vào `model_type`, `model_id`, `initialStatus`.
- Bấm vào tự kích hoạt Mutation trỏ API, Tự đổi màu Xanh/Trắng, tự cộng/trừ Tim mà **Không block sợi mã chính**.
- Gắn được vào Bảng tin, trang Chi tiết Báo Cáo.

**b) `<CommentThreadBottomSheet />`**
- Cái rốn của vũ trụ tương tác. Cầm module này nhét vào 1 cái `ActionRegistry` (Mở khóa Modal Toàn Cục).
- Mọi nơi trong App (Từ SDUI Grid Blocks, đến thẻ Tin tức) chỉ cần gọi hàm:
  `interactionManager.openComments('news-feed', 42)`
- Tự động Trượt BottomSheet lên từ đáy màn hình, load bằng `<FlatList>` các `CommentNode`.
- Component `CommentNode` tự nhận diện `replies`. Nếu có -> Hiện nút "Hiển thị N phản hồi". Bấm mở ra -> Load List con.
- Vùng Header Modal: Đính kèm nút Máy Ảnh. Bấm mở thư viện, add file.

## Kế hoạch Viết Code Thực Tế
1. Viết Migration Database, đảm bảo chuẩn Đa Hình.
2. Code Controller Backend tạo các Endpoint lõi. Xử lý logic đếm Like, Trả Comments lồng nhau 2 Level tránh nặng API.
3. Code `<CommentThreadBottomSheet />` trên React Native, chạy thật mượt với bộ khung Zod bảo vệ 100%. Mất mạng -> Văng cờ lê đỏ nhưng không Crash app.
4. Tích hợp trực tiếp Mạng Xã Hội (`news-feed`), Chấm công (`checkin`), Task (`task`) để Test thả chim thả tim thật.
