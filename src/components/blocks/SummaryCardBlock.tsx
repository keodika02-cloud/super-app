import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export const SummaryCardBlock = ({ data }: { data: any }) => (
    <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
            <View>
                <Text style={styles.summaryTitle}>{data.title}</Text>
                <Text style={styles.summarySubtitle}>{data.subtitle}</Text>
            </View>
            {data.show_refresh && <TouchableOpacity><Text style={styles.refreshIcon}>🔄</Text></TouchableOpacity>}
        </View>
        <View style={styles.summaryBody}>
            {(data.stats || []).map((stat: any, idx: number) => (
                <View key={idx} style={styles.statRow}>
                    <Text style={styles.statLabel}>{stat.label}:</Text>
                    <Text style={styles.statValue}>{stat.value}</Text>
                </View>
            ))}
        </View>
    </View>
);

const styles = StyleSheet.create({
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    summaryTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    summarySubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
    refreshIcon: { fontSize: 20 },
    summaryBody: { gap: 12 },
    statRow: {
        flexDirection: 'row',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    statLabel: { fontSize: 14, fontWeight: '600', color: '#475569', width: 90 },
    statValue: { flex: 1, fontSize: 14, color: '#1e293b', marginLeft: 8, fontWeight: '500' },
});
