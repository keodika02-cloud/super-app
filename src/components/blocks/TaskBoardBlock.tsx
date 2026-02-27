import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { UIBlock } from '../../core/sdui/LayoutEngine';
import { ActionRegistry } from '../../utils/ActionRegistry';

export const TaskBoardBlock: React.FC<{ data: any }> = ({ data = {} }) => {
    const { title, columns } = data;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title || '📋 Bảng Công Việc'}</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Text style={styles.addButtonText}>+ Mới</Text>
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boardScroll}>
                {columns?.map((col: any, index: number) => (
                    <View key={index} style={styles.column}>
                        <View style={styles.colHeader}>
                            <Text style={styles.colTitle}>{col.title} <Text style={styles.badge}>{col.tasks?.length || 0}</Text></Text>
                        </View>

                        <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
                            {col.tasks?.map((task: any, tIdx: number) => (
                                <TouchableOpacity
                                    key={tIdx}
                                    style={styles.taskCard}
                                    onPress={() => {
                                        if (task.action) {
                                            ActionRegistry.execute(task.action.type, task.action.payload);
                                        }
                                    }}
                                >
                                    <View style={[styles.priorityTag, { backgroundColor: task.color || '#e2e8f0' }]} />
                                    <Text style={styles.taskTitle}>{task.title}</Text>
                                    <View style={styles.taskFooter}>
                                        <Text style={styles.taskDate}>⏳ {task.deadline}</Text>
                                        {task.assignee_avatar ? (
                                            <Image source={{ uri: task.assignee_avatar }} style={styles.avatar} />
                                        ) : (
                                            <View style={styles.avatarPlaceholder}>
                                                <Text style={styles.avatarText}>{task.assignee?.charAt(0) || '👤'}</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginVertical: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12, alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    addButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#3b82f6', borderRadius: 16 },
    addButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    boardScroll: { paddingHorizontal: 12, gap: 12 },
    column: { width: 280, backgroundColor: '#f1f5f9', borderRadius: 12, padding: 12, maxHeight: 400 },
    colHeader: { marginBottom: 12 },
    colTitle: { fontSize: 15, fontWeight: '700', color: '#334155' },
    badge: { color: '#64748b', fontWeight: 'normal' },
    colScroll: { flexGrow: 0 },
    taskCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1 },
    priorityTag: { width: 30, height: 4, borderRadius: 2, marginBottom: 8 },
    taskTitle: { fontSize: 14, color: '#0f172a', fontWeight: '500', marginBottom: 12 },
    taskFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    taskDate: { fontSize: 12, color: '#64748b' },
    avatar: { width: 24, height: 24, borderRadius: 12 },
    avatarPlaceholder: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 10, color: '#fff', fontWeight: 'bold' }
});
