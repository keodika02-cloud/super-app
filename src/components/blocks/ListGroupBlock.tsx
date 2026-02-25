import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { UIBlock } from '../../core/sdui/LayoutEngine';
import { ActionRegistry } from '../../utils/ActionRegistry';

export const ListGroupBlock: React.FC<{ data: any }> = ({ data = {} }) => {
    const { title, items, style_type } = data;

    const isCard = style_type === 'card';

    return (
        <View style={[styles.container, isCard && styles.cardContainer]}>
            {title && <Text style={styles.title}>{title}</Text>}

            <View style={styles.list}>
                {items?.map((item: any, idx: number) => (
                    <TouchableOpacity
                        key={idx}
                        style={[styles.item, isCard && styles.cardItem]}
                        onPress={() => {
                            if (item.action) ActionRegistry.execute(item.action.type, item.action.payload);
                        }}
                        disabled={!item.action}
                    >
                        <View style={styles.left}>
                            <Text style={styles.icon}>{item.icon || '📌'}</Text>
                            <View>
                                <Text style={styles.itemTitle}>{item.title}</Text>
                                {item.subtitle && <Text style={styles.itemSubtitle}>{item.subtitle}</Text>}
                            </View>
                        </View>

                        <View style={styles.right}>
                            {item.status && (
                                <View style={[styles.statusBadge, { backgroundColor: item.status_color || '#e2e8f0' }]}>
                                    <Text style={[styles.statusText, { color: item.status_text_color || '#475569' }]}>{item.status}</Text>
                                </View>
                            )}
                            {item.action && <Text style={styles.chevron}>›</Text>}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginVertical: 8, paddingHorizontal: 16 },
    cardContainer: { paddingHorizontal: 0, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, padding: 16 },
    title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
    list: { gap: 8 },
    item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    cardItem: { borderBottomWidth: 0, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 },
    left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    icon: { fontSize: 24, marginRight: 12 },
    itemTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
    itemSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
    right: { flexDirection: 'row', alignItems: 'center' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
    statusText: { fontSize: 11, fontWeight: '600' },
    chevron: { fontSize: 20, color: '#cbd5e1', marginBottom: 2 }
});
