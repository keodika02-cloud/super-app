import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ActionRegistry } from '../../utils/ActionRegistry';

export const BannerBlock = ({ data }: { data: any }) => (
    <TouchableOpacity
        style={styles.bannerCard}
        onPress={() => ActionRegistry.execute(data.action)}
    >
        <View style={styles.bannerContent}>
            <View style={styles.bannerAvatar} />
            <Text style={styles.bannerTitle}>{data.title}</Text>
            <Text style={styles.bannerSubtitle}>{data.subtitle}</Text>
            {data.action_label && <Text style={styles.bannerAction}>{data.action_label}</Text>}
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    bannerCard: {
        borderRadius: 20,
        backgroundColor: '#eff6ff',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        justifyContent: 'center',
        padding: 24,
    },
    bannerContent: { alignItems: 'center' },
    bannerAvatar: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: '#93c5fd', marginBottom: 12
    },
    bannerTitle: { fontSize: 18, fontWeight: '700', color: '#1e3a8a' },
    bannerSubtitle: { fontSize: 14, color: '#3b82f6', marginTop: 4 },
    bannerAction: { fontSize: 15, color: '#2563eb', fontWeight: '700', marginTop: 12 },
});
