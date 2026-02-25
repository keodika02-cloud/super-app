import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';

export default function CrmWebViewScreen() {
    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <Text style={styles.title}>CRM & Công cụ nội bộ</Text>
                <Text style={styles.subtitle}>Đang kết nối tới server crm.maytinhquocviet.com...</Text>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#64748b' }
});
