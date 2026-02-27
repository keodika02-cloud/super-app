import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Building2, MoreHorizontal, Image as ImageIcon, MapPin, Smile } from 'lucide-react-native';
import { useAuthStore } from '../../stores/useAuthStore';
import { ActionRegistry } from '../../utils/ActionRegistry';

export const ProfileHeaderBlock = ({ data }: { data: any }) => {
    const user = useAuthStore(state => state.user);
    const displayName = user?.name || 'VIET QUOC';

    // Đảm bảo avatar là string
    const avatarUri = typeof user?.avatar === 'string' && user.avatar.length > 0 ? user.avatar : null;

    const initials = useMemo(() => {
        return displayName
            .split(' ')
            .filter(Boolean)
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }, [displayName]);

    return (
        <View style={styles.container}>
            {/* THÔNG TIN CÁ NHÂN */}
            <View style={styles.card}>
                <View style={styles.profileRow}>
                    <View style={styles.avatarBorder}>
                        <View style={styles.avatarInnerContainer}>
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.fullImage} />
                            ) : (
                                <Text style={styles.avatarInitial}>{initials || 'V'}</Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.profileInfo}>
                        <Text style={styles.greetingText} numberOfLines={1}>
                            Chào buổi sáng, {displayName} 👋
                        </Text>
                        <Text style={styles.roleText}>{user?.role || 'Thành viên QVC'}</Text>
                        <Text style={styles.deptText} numberOfLines={1}>{user?.dept_name || 'Phòng ban Quốc Việt Technology'}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <TouchableOpacity
                    style={styles.companyPill}
                    activeOpacity={0.7}
                    onPress={() => ActionRegistry.execute(data?.company_action || 'OPEN_COMPANY_INFO')}
                >
                    <Building2 size={16} color="#94a3b8" />
                    <Text style={styles.companyName} numberOfLines={1}>
                        {user?.department?.name || data?.company_name || 'CÔNG TY TNHH CÔNG NGHỆ QUỐC VIỆT'}
                    </Text>
                    <MoreHorizontal size={16} color="#cbd5e1" />
                </TouchableOpacity>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: 12 },
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
    p12: { padding: 12 },

    // Profile Section
    profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    avatarBorder: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#8B5CF6', padding: 2 },
    avatarInnerContainer: { width: '100%', height: '100%', borderRadius: 26, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', overflow: 'hidden' },
    avatarInitial: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
    fullImage: { width: '100%', height: '100%' },
    profileInfo: { flex: 1, gap: 1 },
    greetingText: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
    roleText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    deptText: { fontSize: 12, color: '#94a3b8' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 12 },
    companyPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', padding: 10, borderRadius: 14, borderWidth: 1, borderColor: '#f1f5f9' },
    companyName: { fontSize: 13, fontWeight: '700', color: '#334155', flex: 1 },

    // Quick Post Section
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    miniAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
    miniAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    textInputSim: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
    placeholderText: { color: '#64748b', fontSize: 13 },
    actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 10, justifyContent: 'space-between', paddingHorizontal: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionBtnLabel: { fontSize: 12, fontWeight: '600', color: '#64748b' },
});
