/**
 * Định nghĩa tất cả các loại Block hỗ trợ
 */
export type BlockType =
    // Primitives (Cơ bản)
    | 'container' // View/Div
    | 'text'
    | 'image'
    | 'button'
    | 'input'
    | 'list'      // FlatList/FlashList
    | 'card'
    | 'spacer'
    // Business Widgets (Nghiệp vụ - Khớp Design Doc)
    | 'HEADER_BANNER'     // Banner chạy quảng cáo
    | 'GRID_MENU'         // Menu 4 ô chức năng
    | 'NEWS_LIST'         // List tin tức
    | 'STATS_WIDGET'     // Biểu đồ thống kê
    | 'HEADER'            // Header;

export interface Action {
    type: 'navigate' | 'api' | 'link' | 'refresh' | 'Maps_SCREEN' | 'OPEN_DEEP_LINK' | 'CALL_API' | 'SHOW_ALERT';
    path?: string;       // URL hoặc Route
    method?: 'GET' | 'POST'; // Cho API
    payload?: any;       // Data gửi đi (Dynamic payload)
    confirm_msg?: string; // "Bạn có chắc chắn muốn xóa?"
}

export interface SDUIBlock {
    id: string;
    type: BlockType;
    props?: Record<string, any>; // Style, text, src...
    action?: Action;             // Sự kiện onPress
    children?: SDUIBlock[];      // ✅ QUAN TRỌNG: Mảng con đệ quy
}

export interface ScreenResponse {
    screen_id: string;
    title: string;
    blocks: SDUIBlock[];
}

