import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAuthStore } from '../../stores/useAuthStore';
import { CreatePostModal } from '../modals/CreatePostModal';
import { useRouter } from 'expo-router';

export const PostComposerBlock = ({ data }: { data: any }) => {
    const { user } = useAuthStore();
    const [isModalVisible, setModalVisible] = React.useState(false);
    const router = useRouter();

    return (
        <View style={styles.composerContainer}>
            <View style={styles.composerHeader}>
                <View style={styles.composerAvatar}>
                    {user?.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
                    ) : (
                        <View style={styles.avatarPlaceholder}><Text style={{ fontSize: 20 }}>👤</Text></View>
                    )}
                </View>
                <TouchableOpacity style={styles.composerInput} onPress={() => setModalVisible(true)}>
                    <Text style={styles.composerPlaceholder}>{String(data?.placeholder || 'Bạn đang nghĩ gì thế?')}</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.composerActions}>
                <TouchableOpacity style={styles.composerActionBtn} onPress={() => setModalVisible(true)}>
                    <Text style={styles.actionTxt}>🖼️ Hình ảnh</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.composerActionBtn} onPress={() => router.push('/(main)/checkin')}>
                    <Text style={styles.actionTxt}>📍 Check-in</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.composerActionBtn} onPress={() => setModalVisible(true)}>
                    <Text style={styles.actionTxt}>😊 Cảm xúc</Text>
                </TouchableOpacity>
            </View>

            <CreatePostModal visible={isModalVisible} onClose={() => setModalVisible(false)} />
        </View>
    );
};

const styles = StyleSheet.create({
    composerContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    composerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
    composerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    avatarImg: { width: '100%', height: '100%' },
    composerInput: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0' },
    composerPlaceholder: { color: '#64748b', fontSize: 15 },
    composerActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, justifyContent: 'space-between' },
    composerActionBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
    actionTxt: { fontSize: 14, color: '#475569', fontWeight: '600' }
});
