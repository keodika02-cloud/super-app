import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const UnknownBlock = ({ type, data }: { type: string, data?: any }) => {
    const isError = !!data?.error;
    return (
        <View style={[styles.unknownBlock, isError && styles.errorBlock]}>
            <Text style={[styles.unknownTitle, isError && styles.errorTitle]}>{isError ? data.error : 'Tính năng mới 🚀'}</Text>
            <Text style={[styles.unknownText, isError && styles.errorText]}>{isError ? data.details : `Khối "${type}" đang được cập nhật. Vui lòng kéo xuống để làm mới hoặc chờ bản nâng cấp App nhé!`}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    unknownBlock: {
        backgroundColor: '#f8fafc',
        padding: 24,
        borderRadius: 16,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#cbd5e1',
        alignItems: 'center',
    },
    unknownTitle: { fontSize: 16, fontWeight: '700', color: '#64748b' },
    unknownText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 8, lineHeight: 20 },
    errorBlock: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
    errorTitle: { color: '#ef4444', fontSize: 18, fontWeight: '800' },
    errorText: { color: '#b91c1c', fontWeight: '500' },
});
