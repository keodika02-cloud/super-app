import React from 'react';
import { ScrollView } from 'react-native';
import { SafeScreen } from '../../src/components/layout/SafeScreen';
import { SduiEngine } from '../../src/components/blocks/SduiEngine';
import { SCREEN_CONFIGS } from '../../src/config/ScreenConfigs';

/**
 * TasksScreen - Mẫu màn hình báo cáo chi tiết
 * Sử dụng SafeScreen để tự động quản lý fetching và Error Boundary.
 */
export default function TasksScreen() {
    return (
        <SafeScreen config={SCREEN_CONFIGS.TASKS}>
            {(data) => (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    <SduiEngine blocks={data} />
                </ScrollView>
            )}
        </SafeScreen>
    );
}
