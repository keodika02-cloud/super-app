import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ActionRegistry } from '../../utils/ActionRegistry';

export const FeedActionBlock = ({ data }: { data: any }) => (
    <View style={styles.feedActionSection}>
        <View style={styles.gridContainer}>
            {(data.items || []).map((item: any, idx: number) => (
                <TouchableOpacity
                    key={idx}
                    style={styles.gridItem}
                    onPress={() => ActionRegistry.execute(item.action || 'OPEN_FEED_ACTION')}
                >
                    <View style={styles.feedIconWrapper}>
                        <Text style={styles.feedIcon}>{item.icon || '📦'}</Text>
                    </View>
                    <Text style={styles.gridLabel}>{item.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

const styles = StyleSheet.create({
    feedActionSection: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 20,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
    gridItem: { width: '25%', alignItems: 'center' },
    feedIconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    feedIcon: { fontSize: 24 },
    gridLabel: { fontSize: 12, color: '#475569', textAlign: 'center', fontWeight: '500' },
});
