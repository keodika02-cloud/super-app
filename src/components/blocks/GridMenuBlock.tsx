import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ActionRegistry } from '../../utils/ActionRegistry';

export const GridMenuBlock = ({ data }: { data: any }) => (
    <View style={styles.gridSection}>
        {data.title && <Text style={styles.sectionTitle}>{data.title}</Text>}
        <View style={styles.gridContainer}>
            {(data.items || []).map((item: any, idx: number) => (
                <TouchableOpacity
                    key={idx}
                    style={styles.gridItem}
                    onPress={() => ActionRegistry.execute(item.action)}
                >
                    <View style={[styles.iconWrapper, item.bg_color && { backgroundColor: item.bg_color }]}>
                        <Text style={styles.gridIcon}>{item.icon || '❓'}</Text>
                    </View>
                    <Text style={styles.gridLabel}>{item.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

const styles = StyleSheet.create({
    gridSection: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 24 },
    gridItem: { width: '25%', alignItems: 'center' },
    iconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    gridIcon: { fontSize: 24 },
    gridLabel: { fontSize: 12, color: '#475569', textAlign: 'center', fontWeight: '500' },
});
