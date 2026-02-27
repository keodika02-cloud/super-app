import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { SduiEngine } from '../../../src/components/blocks/SduiEngine';
import { API_ENDPOINTS } from '../../../src/config/api-endpoints';
import { ScreenConfig } from '../../../src/config/ScreenConfigs';

import { z } from 'zod';

export default function DynamicScreen() {
    const params = useLocalSearchParams<{ slug: string; title?: string }>();
    const title = params.title || 'Tính năng mới';

    // Slug có thể là tên biến ('goto_more') HOẶC một chuỗi mã hóa HEX ('hex_68747...') đại diện cho URL trực tiếp.
    let slug = params.slug ? decodeURIComponent(params.slug) : '';

    // [Bypass Expo Router Bug]: Giải mã chuỗi HEX lại thành URL đầy đủ
    if (slug.startsWith('hex_')) {
        const hexStr = slug.substring(4);
        let decodedStr = '';
        for (let i = 0; i < hexStr.length; i += 2) {
            decodedStr += String.fromCharCode(parseInt(hexStr.substr(i, 2), 16));
        }
        slug = decodedStr;
    }

    // [HARDENING]: Tạo Config động trên Runtime.
    // Việc này cho phép hiển thị BẤT KỲ màn hình nào từ Server mà App không cần update.
    const dynamicConfig = useMemo<ScreenConfig>(() => {
        const isUrl = slug.startsWith('http');

        return {
            id: `dynamic_${slug}`,
            title: title,
            // Nếu slug là Link, đâm thẳng vào link đó. Nửa còn lại thì đâm vào UI_LAYOUT mặc định.
            apiEndpoint: isUrl ? { path: slug, req: z.any() as any, res: z.any(), fallbackRes: [] } : API_ENDPOINTS.V3.APP.UI_LAYOUT,
            cacheKey: `sdui_dynamic_${slug}_v3`,
            queryParams: isUrl ? undefined : { screen_slug: slug || 'unknown' },
            fallbackLayout: [
                {
                    type: 'BannerBlock',
                    id: 'fb_dynamic',
                    data: {
                        title: 'Đang tải...',
                        subtitle: 'Đang lấy dữ liệu từ máy chủ...',
                        action: 'NONE'
                    }
                }
            ]
        };
    }, [slug, title]);

    return (
        <SafeScreen config={dynamicConfig}>
            {(blocks) => (
                <View style={styles.container}>
                    <SduiEngine blocks={blocks} />
                </View>
            )}
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingBottom: 40 },
});
