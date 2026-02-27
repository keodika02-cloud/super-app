import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, FileEdit, Trophy, Coffee, Bell, Briefcase, Users, DollarSign } from 'lucide-react-native';
import { ActionRegistry } from '../../utils/ActionRegistry';

// Helper to map dynamic labels to Lucide Icons to preserve SDUI logic
const getIconForLabel = (label: string, fallbackEmoji: string) => {
    const l = label.toLowerCase();
    if (l.includes('chấm công')) return <Clock size={24} color="#f43f5e" />;
    if (l.includes('báo cáo')) return <FileEdit size={24} color="#f59e0b" />;
    if (l.includes('khen thưởng')) return <Trophy size={24} color="#eab308" />;
    if (l.includes('xin nghỉ')) return <Coffee size={24} color="#06b6d4" />;
    if (l.includes('thông báo')) return <Bell size={24} color="#8b5cf6" />;
    if (l.includes('công việc')) return <Briefcase size={24} color="#3b82f6" />;
    if (l.includes('khách hàng')) return <Users size={24} color="#10b981" />;
    if (l.includes('lương')) return <DollarSign size={24} color="#ea580c" />;

    // Fallback if no matching Lucide icon
    return <Text style={{ fontSize: 24 }}>{fallbackEmoji}</Text>;
};

// Map specific backgrounds to look exactly like the UI spec
const getBgColorForLabel = (label: string, fallbackBg: string) => {
    const l = label.toLowerCase();
    if (l.includes('chấm công')) return '#fff1f2'; // rose-50
    if (l.includes('báo cáo')) return '#fffbeb'; // amber-50
    if (l.includes('khen thưởng')) return '#fefce8'; // yellow-50
    if (l.includes('xin nghỉ')) return '#ecfeff'; // cyan-50
    return fallbackBg || '#f1f5f9';
};

export const GridMenuBlock = ({ data }: { data: any }) => (
    <View style={styles.gridSection}>
        {/* KHỐI 4: MENU CHỨC NĂNG */}
        {data.title && <Text style={styles.sectionTitle}>{data.title}</Text>}
        <View style={styles.gridContainer}>
            {(data.items || []).map((item: any, idx: number) => (
                <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    style={styles.gridItem}
                    onPress={() => ActionRegistry.execute(item.action)}
                >
                    <View style={[
                        styles.iconWrapper,
                        { backgroundColor: getBgColorForLabel(item.label, item.bg_color) }
                    ]}>
                        {getIconForLabel(item.label, item.icon)}
                    </View>
                    <Text style={styles.gridLabel} numberOfLines={1}>{item.label}</Text>
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 24, justifyContent: 'flex-start' },
    gridItem: { width: '25%', alignItems: 'center', gap: 6 },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f8fafc'
    },
    gridLabel: { fontSize: 11, fontWeight: '600', color: '#475569', textAlign: 'center' },
});
