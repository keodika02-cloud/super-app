import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { UIBlock } from '../../core/sdui/LayoutEngine';
import { ActionRegistry } from '../../utils/ActionRegistry';

export const DetailViewBlock: React.FC<{ data: any }> = ({ data = {} }) => {
    const {
        cover_image, title, subtitle, attributes, html_content, buttons
    } = data;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {cover_image && (
                <Image source={{ uri: cover_image }} style={styles.cover} />
            )}

            <View style={styles.body}>
                {title && <Text style={styles.title}>{title}</Text>}
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

                {attributes && attributes.length > 0 && (
                    <View style={styles.attrBox}>
                        {attributes.map((attr: any, idx: number) => (
                            <View key={idx} style={styles.attrRow}>
                                <Text style={styles.attrLabel}>{attr.label}</Text>
                                <Text style={styles.attrValue}>{attr.value}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {html_content && (
                    <View style={styles.contentBox}>
                        <Text style={styles.content}>{html_content}</Text>
                    </View>
                )}

                {buttons && buttons.length > 0 && (
                    <View style={styles.btnRow}>
                        {buttons.map((btn: any, idx: number) => (
                            <TouchableOpacity
                                key={idx}
                                style={[
                                    styles.button,
                                    btn.style === 'danger' ? styles.btnDanger : styles.btnPrimary,
                                    { flex: 1 }
                                ]}
                                onPress={() => btn.action && ActionRegistry.execute(btn.action.type, btn.action.payload)}
                            >
                                <Text style={styles.btnText}>{btn.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { backgroundColor: '#f8fafc', marginVertical: 8, borderRadius: 16, overflow: 'hidden', marginHorizontal: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    cover: { width: '100%', height: 160 },
    body: { padding: 16, backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#64748b', marginBottom: 16 },
    attrBox: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 12, marginBottom: 16 },
    attrRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    attrLabel: { color: '#64748b', fontSize: 13 },
    attrValue: { color: '#0f172a', fontSize: 14, fontWeight: '600' },
    contentBox: { marginTop: 8, marginBottom: 24 },
    content: { fontSize: 15, color: '#334155', lineHeight: 22 },
    btnRow: { flexDirection: 'row', gap: 12 },
    button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    btnPrimary: { backgroundColor: '#3b82f6' },
    btnDanger: { backgroundColor: '#ef4444' },
    btnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});
