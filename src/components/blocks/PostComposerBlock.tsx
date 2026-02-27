import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Image as ImageIcon, MapPin, Smile } from 'lucide-react-native';
import { useAuthStore } from '@stores/useAuthStore';
import { useRouter } from 'expo-router';
import { CreatePostModal } from '../modals/CreatePostModal';

export const PostComposerBlock = ({ data }: { data: any }) => {
    const { user } = useAuthStore();
    const router = useRouter();
    const [isModalVisible, setModalVisible] = React.useState(false);

    // Đảm bảo avatar là string hợp lệ
    const avatarUri = typeof user?.avatar === 'string' && user.avatar.length > 0 ? user.avatar : null;
    const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'V';

    return (
        <View style={styles.card}>
            <View style={styles.inputRow}>
                <View style={styles.miniAvatar}>
                    {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.fullImage} />
                    ) : (
                        <Text style={styles.miniAvatarText}>{initial}</Text>
                    )}
                </View>
                <TouchableOpacity style={styles.textInputSim} activeOpacity={0.8} onPress={() => setModalVisible(true)}>
                    <Text style={styles.placeholderText}>{String(data?.placeholder || 'Hôm nay công việc của bạn thế nào?')}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setModalVisible(true)}>
                    <ImageIcon size={20} color="#10b981" />
                    <Text style={styles.actionBtnLabel}>Hình ảnh</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(main)/checkin')}>
                    <MapPin size={20} color="#f43f5e" />
                    <Text style={styles.actionBtnLabel}>Check-in</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setModalVisible(true)}>
                    <Smile size={20} color="#f59e0b" />
                    <Text style={styles.actionBtnLabel}>Cảm xúc</Text>
                </TouchableOpacity>
            </View>

            <CreatePostModal visible={isModalVisible} onClose={() => setModalVisible(false)} />
        </View>
    );
};

const styles = StyleSheet.create({
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 12, shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    miniAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    miniAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    fullImage: { width: '100%', height: '100%' },
    textInputSim: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 },
    placeholderText: { color: '#64748b', fontSize: 14 },
    actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 12, justifyContent: 'space-around', paddingHorizontal: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionBtnLabel: { fontSize: 13, fontWeight: '600', color: '#64748b' },
});
