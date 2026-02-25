import { ScreenResponse } from './types';

export const MOCK_HOME_SDUI: ScreenResponse = {
    screen_id: "HOME",
    title: "Trang chủ",
    blocks: [
        // 1. HEADER
        {
            id: "header",
            type: "HEADER",
            props: {
                title: "Trang chủ",
                // Right action could be simulated by engine, but for now Header props are specific
            }
        },
        // 2. WELCOME TEXT (Container + Text)
        {
            id: "welcome-section",
            type: "container",
            props: { className: "px-4 mt-2 mb-6" },
            children: [
                {
                    id: "date",
                    type: "text",
                    props: { text: "Thứ Hai, 20/01/2026", className: "text-gray-500 text-sm" }
                },
                {
                    id: "greeting",
                    type: "text",
                    props: { text: "Xin chào, Nguyễn Văn A 👋", className: "text-2xl font-bold text-gray-800" }
                }
            ]
        },
        // 3. HEADER BANNER (Stats)
        {
            id: "stats-banner",
            type: "HEADER_BANNER",
            props: {
                title: "Hiệu suất tháng 1",
                highlight: "98%",
                stats: [
                    { value: "18", label: "Công chấm", color: "text-gray-800" },
                    { value: "1", label: "Đi muộn", color: "text-orange-500" },
                    { value: "5", label: "Hoàn thành", color: "text-green-600" }
                ],
                className: "px-4"
            }
        },
        // 4. GRID MENU SECTION TITLE
        {
            id: "menu-title",
            type: "text",
            props: { text: "Tiện ích nhanh", className: "font-semibold text-gray-700 mb-3 px-5 mt-6" }
        },
        // 5. GRID MENU
        {
            id: "grid-menu",
            type: "container",
            props: { className: "px-4" },
            children: [
                {
                    id: "grid-menu-widget",
                    type: "GRID_MENU",
                    props: {
                        items: [
                            {
                                label: "Đơn từ",
                                icon: "FileText",
                                color: "bg-orange-100",
                                iconColor: "#ea580c",
                                action: {
                                    type: "SHOW_ALERT",
                                    payload: { title: "Cảnh báo", message: "Tính năng này đang bảo trì" }
                                }
                            },
                            {
                                label: "Bảng lương",
                                icon: "Smartphone",
                                color: "bg-green-100",
                                iconColor: "#16a34a",
                                action: {
                                    type: "Maps_SCREEN",
                                    payload: "/(main)/profile"
                                }
                            },
                            {
                                label: "Quy định",
                                icon: "Shield",
                                color: "bg-purple-100",
                                iconColor: "#9333ea",
                                action: {
                                    type: "OPEN_DEEP_LINK",
                                    payload: "https://google.com"
                                }
                            },
                            {
                                label: "Cài đặt",
                                icon: "Settings",
                                color: "bg-gray-100",
                                iconColor: "#4b5563",
                                action: {
                                    type: "Maps_SCREEN",
                                    payload: "/(main)/profile"
                                }
                            },
                        ]
                    }
                }
            ]
        },
        // Spacer at bottom
        {
            id: "bottom-spacer",
            type: "spacer",
            props: { height: 100 }
        }
    ]
};
