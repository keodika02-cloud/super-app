const axios = require('axios');

// 1. Dán Expo Push Token của anh vào đây (Lấy từ log console của App)
const EXPO_PUSH_TOKEN = 'YOUR_EXPO_PUSH_TOKEN_HERE';

async function sendTestNotification() {
    if (EXPO_PUSH_TOKEN === 'YOUR_EXPO_PUSH_TOKEN_HERE') {
        console.error('Lỗi: Anh chưa dán Token vào file test-push.js!');
        return;
    }

    console.log('--- Đang gửi thông báo test tới:', EXPO_PUSH_TOKEN);

    try {
        const response = await axios.post('https://exp.host/--/api/v2/push/send', {
            to: EXPO_PUSH_TOKEN,
            title: '🔔 Thông báo test từ Terminal',
            body: 'Nếu anh thấy dòng này nghĩa là Push Notification đã chạy ngon lành! 🚀',
            data: {
                type: 'ANNOUNCEMENT',
                params: { id: 123 }
            },
            sound: 'default',
            priority: 'high',
        });

        console.log('✅ Kết quả:', response.data);
    } catch (error) {
        console.error('❌ Lỗi gửi thông báo:', error.response ? error.response.data : error.message);
    }
}

sendTestNotification();
