import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ActionRegistry } from '../../utils/ActionRegistry';

export const BannerBlock = ({ data }: { data: any }) => (
    <TouchableOpacity
        style={styles.birthdayBanner}
        activeOpacity={0.8}
        onPress={() => ActionRegistry.execute(data.action)}
    >
        <View style={styles.birthdayIcon} />
        <Text style={styles.birthdayTitle}>🎉 {data.title}</Text>
        <Text style={styles.birthdaySubtitle}>{data.subtitle}</Text>
        {data.action_label && <Text style={styles.bannerAction}>{data.action_label}</Text>}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    birthdayBanner: {
        backgroundColor: '#EBF5FF',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1E8FF'
    },
    birthdayIcon: { width: 64, height: 64, backgroundColor: '#93C5FD', borderRadius: 32, marginBottom: 12 },
    birthdayTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E3A8A', marginBottom: 4 },
    birthdaySubtitle: { fontSize: 13, color: '#2563EB', fontWeight: '500', textAlign: 'center' },
    bannerAction: { fontSize: 15, color: '#1e3a8a', fontWeight: 'bold', marginTop: 12 }
});
