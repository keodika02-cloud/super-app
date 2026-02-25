import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';

export const StoryBlock = ({ data }: { data: any }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyContent}>
        {(data.items || []).map((item: any, idx: number) => (
            <TouchableOpacity key={idx} style={styles.storyItem}>
                <View style={[styles.storyAvatarWrap, !item.is_seen && styles.storyUnseen]}>
                    <View style={styles.storyAvatarInner}>
                        {item.avatar ? (
                            <Image source={{ uri: item.avatar }} style={styles.storyImg} />
                        ) : (
                            <Text style={styles.avatarPlaceholder}>👤</Text>
                        )}
                    </View>
                </View>
                <Text style={styles.storyLabel} numberOfLines={1}>{item.label}</Text>
            </TouchableOpacity>
        ))}
    </ScrollView>
);

const styles = StyleSheet.create({
    storyContent: { paddingVertical: 8, gap: 16 },
    storyItem: { width: 68, alignItems: 'center' },
    storyAvatarWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        padding: 3,
        backgroundColor: '#fff',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    storyUnseen: { backgroundColor: '#3b82f6', borderWidth: 0 },
    storyAvatarInner: {
        flex: 1,
        borderRadius: 30,
        backgroundColor: '#f1f5f9',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff'
    },
    storyImg: { width: '100%', height: '100%' },
    avatarPlaceholder: { fontSize: 24 },
    storyLabel: { fontSize: 12, color: '#334155', textAlign: 'center', fontWeight: '500' },
});
