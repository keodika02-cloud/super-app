<<<<<<< Updated upstream
import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
    ActivityIndicator, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { useUserStore, UserInfo } from '../../src/stores/useUserStore';
import { useChatStore } from '../../src/stores/useChatStore';
import { useAuthStore } from '../../src/stores/useAuthStore';

export default function CreateChatScreen() {
    const router = useRouter();
    const { user: currentUser } = useAuthStore();
    const { users, isLoadingUsers, fetchAllUsers } = useUserStore();
    const { createConversation } = useChatStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [groupName, setGroupName] = useState('');

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const filteredUsers = users.filter(u =>
        u.id !== currentUser?.id &&
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleUser = (userId: number) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleCreate = async () => {
        if (selectedUsers.length === 0) return;

        setIsCreating(true);
        try {
            const isGroup = selectedUsers.length > 1;
            const params = {
                name: isGroup ? (groupName.trim() || 'Nhóm mới') : undefined,
                type: isGroup ? 'group' : ('individual' as any),
                user_ids: selectedUsers
            };

            const newConvo = await createConversation(params);
            if (newConvo) {
                router.replace(`/chat/${newConvo.id}`);
            }
        } catch (error) {
            console.error('[CreateChat] Error:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const renderUser = ({ item }: { item: UserInfo }) => {
        const isSelected = selectedUsers.includes(item.id);
        return (
            <TouchableOpacity
                style={[styles.userItem, isSelected && styles.userItemSelected]}
                onPress={() => toggleUser(item.id)}
            >
                {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarTxt}>{item.name.charAt(0)}</Text>
                    </View>
                )}
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userRole}>{item.role}</Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper backgroundColor="#fff">
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backLabel}>Hủy</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Hội thoại mới</Text>
                    <TouchableOpacity
                        onPress={handleCreate}
                        disabled={selectedUsers.length === 0 || isCreating}
                        style={styles.createBtn}
                    >
                        {isCreating ? (
                            <ActivityIndicator size="small" color="#3b82f6" />
                        ) : (
                            <Text style={[styles.createLabel, selectedUsers.length === 0 && styles.disabledLabel]}>
                                Tạo
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {selectedUsers.length > 1 && (
                    <View style={styles.groupInputArea}>
                        <TextInput
                            style={styles.groupInput}
                            placeholder="Tên nhóm (tùy chọn)..."
                            value={groupName}
                            onChangeText={setGroupName}
                        />
                    </View>
                )}

                <View style={styles.searchArea}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm nhân viên..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {isLoadingUsers ? (
                    <View style={styles.centerLoad}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredUsers}
                        renderItem={renderUser}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    backBtn: { paddingVertical: 4 },
    backLabel: { color: '#64748b', fontSize: 16 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    createBtn: { paddingVertical: 4 },
    createLabel: { color: '#3b82f6', fontSize: 16, fontWeight: 'bold' },
    disabledLabel: { color: '#cbd5e1' },
    groupInputArea: { padding: 16, borderBottomWidth: 8, borderBottomColor: '#f8fafc' },
    groupInput: { fontSize: 16, color: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#3b82f6', paddingVertical: 8 },
    searchArea: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    searchInput: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
    centerLoad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingBottom: 20 },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc'
    },
    userItemSelected: { backgroundColor: '#eff6ff' },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
    avatarTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    userInfo: { flex: 1, marginLeft: 12 },
    userName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    userRole: { fontSize: 13, color: '#64748b', marginTop: 2 },
    checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
    checkboxSelected: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    checkIcon: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});
=======
import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
    ActivityIndicator, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { useUserStore, UserInfo } from '../../src/stores/useUserStore';
import { useChatStore } from '../../src/stores/useChatStore';
import { useAuthStore } from '../../src/stores/useAuthStore';

export default function CreateChatScreen() {
    const router = useRouter();
    const { user: currentUser } = useAuthStore();
    const { users, isLoadingUsers, fetchAllUsers } = useUserStore();
    const { createConversation } = useChatStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [groupName, setGroupName] = useState('');

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const filteredUsers = users.filter(u =>
        u.id !== currentUser?.id &&
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleUser = (userId: number) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleCreate = async () => {
        if (selectedUsers.length === 0) return;

        setIsCreating(true);
        try {
            const isGroup = selectedUsers.length > 1;
            const params = {
                name: isGroup ? (groupName.trim() || 'Nhóm mới') : undefined,
                type: isGroup ? 'group' : ('individual' as any),
                user_ids: selectedUsers
            };

            const newConvo = await createConversation(params);
            if (newConvo) {
                router.replace(`/chat/${newConvo.id}`);
            }
        } catch (error) {
            console.error('[CreateChat] Error:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const renderUser = ({ item }: { item: UserInfo }) => {
        const isSelected = selectedUsers.includes(item.id);
        return (
            <TouchableOpacity
                style={[styles.userItem, isSelected && styles.userItemSelected]}
                onPress={() => toggleUser(item.id)}
            >
                {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarTxt}>{item.name.charAt(0)}</Text>
                    </View>
                )}
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userRole}>{item.role}</Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper backgroundColor="#fff">
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backLabel}>Hủy</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Hội thoại mới</Text>
                    <TouchableOpacity
                        onPress={handleCreate}
                        disabled={selectedUsers.length === 0 || isCreating}
                        style={styles.createBtn}
                    >
                        {isCreating ? (
                            <ActivityIndicator size="small" color="#3b82f6" />
                        ) : (
                            <Text style={[styles.createLabel, selectedUsers.length === 0 && styles.disabledLabel]}>
                                Tạo
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {selectedUsers.length > 1 && (
                    <View style={styles.groupInputArea}>
                        <TextInput
                            style={styles.groupInput}
                            placeholder="Tên nhóm (tùy chọn)..."
                            value={groupName}
                            onChangeText={setGroupName}
                        />
                    </View>
                )}

                <View style={styles.searchArea}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm nhân viên..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {isLoadingUsers ? (
                    <View style={styles.centerLoad}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredUsers}
                        renderItem={renderUser}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    backBtn: { paddingVertical: 4 },
    backLabel: { color: '#64748b', fontSize: 16 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    createBtn: { paddingVertical: 4 },
    createLabel: { color: '#3b82f6', fontSize: 16, fontWeight: 'bold' },
    disabledLabel: { color: '#cbd5e1' },
    groupInputArea: { padding: 16, borderBottomWidth: 8, borderBottomColor: '#f8fafc' },
    groupInput: { fontSize: 16, color: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#3b82f6', paddingVertical: 8 },
    searchArea: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    searchInput: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
    centerLoad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingBottom: 20 },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc'
    },
    userItemSelected: { backgroundColor: '#eff6ff' },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
    avatarTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    userInfo: { flex: 1, marginLeft: 12 },
    userName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    userRole: { fontSize: 13, color: '#64748b', marginTop: 2 },
    checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
    checkboxSelected: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    checkIcon: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});
>>>>>>> Stashed changes
