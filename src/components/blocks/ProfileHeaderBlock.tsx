import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { safeStr } from '../../../src/utils/safe';
import { ActionRegistry } from '../../../src/utils/ActionRegistry';

export const ProfileHeaderBlock = ({ data }: { data: any }) => {
    const user = useAuthStore(state => state.user);
    const displayName = user?.name || 'Người dùng QVC';

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
        <View style={styles.profileHeader}>
            <View style={styles.profileLeft}>
                <View style={[styles.avatar, { backgroundColor: '#3b82f6' }]}>
                    {user?.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
                    ) : (
                        <Text style={styles.avatarText}>{initials}</Text>
                    )}
                </View>
                <View>
                    <Text style={styles.profileName}>{safeStr(data.greeting || 'Xin chào')}, {safeStr(displayName)} 👋</Text>
                    <Text style={styles.profileRole}>{safeStr(user?.position || user?.hrm_info?.job_title || 'Thành viên QVC')}</Text>
                    <Text style={styles.profileDepartment}>{safeStr(user?.dept_name || 'Phòng ban Quốc Việt Technology')}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.companyCard} onPress={() => ActionRegistry.execute('OPEN_COMPANY_INFO')}>
                <Text style={styles.companyIcon}>🏢</Text>
                <Text style={styles.companyName}>CÔNG TY TNHH CÔNG NGHỆ QUỐC VIỆT</Text>
                <Text style={styles.arrowIcon}>›</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    profileHeader: { gap: 12 },
    profileLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginRight: 14, overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    profileName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    profileRole: { fontSize: 13, color: '#475569', marginTop: 2 },
    profileDepartment: { fontSize: 13, color: '#94a3b8' },
    companyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    companyIcon: { fontSize: 20, marginRight: 12 },
    companyName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1e293b' },
    arrowIcon: { fontSize: 24, color: '#cbd5e1' },
});
