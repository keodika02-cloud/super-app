import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeScreen } from '../../src/components/layout/SafeScreen';
import { SCREEN_CONFIGS } from '../../src/config/ScreenConfigs';
import { SduiEngine } from '../../src/components/blocks/SduiEngine';

import { useRouter } from 'expo-router';

export default function HomeScreen() {
    const router = useRouter();

    const headerActions = (
        <>
            <TouchableOpacity style={styles.iconBtn}><Text style={styles.iconTxt}>✨</Text></TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(main)/notifications')}>
                <Text style={styles.iconTxt}>🔔</Text>
                <View style={styles.unreadBadge} />
            </TouchableOpacity>
        </>
    );

    return (
        <SafeScreen config={SCREEN_CONFIGS.HOME} headerRight={headerActions}>
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
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        elevation: 2,
    },
    iconTxt: { fontSize: 18 },
    unreadBadge: {
        position: 'absolute',
        top: 6, right: 8,
        width: 8, height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444'
    }
});

