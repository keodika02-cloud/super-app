import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Bell, Sparkles } from 'lucide-react-native';
import { SafeScreen } from '../../src/components/layout/SafeScreen';
import { SCREEN_CONFIGS } from '../../src/config/ScreenConfigs';
import { SduiEngine } from '../../src/components/blocks/SduiEngine';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
    const router = useRouter();

    const headerActions = (
        <View style={styles.headerRightContainer}>
            <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
                <Sparkles size={20} color="#f59e0b" />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.headerIconBtn}
                activeOpacity={0.7}
                onPress={() => router.push('/(main)/notifications')}
            >
                <Bell size={20} color="#f59e0b" />
                <View style={styles.unreadBadge} />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeScreen config={{ ...SCREEN_CONFIGS.HOME, title: 'Bảng tin' }} headerRight={headerActions}>
            {(blocks) => (
                <View style={styles.container}>
                    <SduiEngine blocks={blocks} />
                </View>
            )}
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5', // Layout FB color
        paddingBottom: 40,
    },
    headerRightContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 2 },
    unreadBadge: {
        position: 'absolute',
        top: 7, right: 9,
        width: 8, height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        borderWidth: 1.5,
        borderColor: '#fff'
    }
});
