import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeScreen } from '../../src/components/layout/SafeScreen';
import { SCREEN_CONFIGS } from '../../src/config/ScreenConfigs';
import { SduiEngine } from '../../src/components/blocks/SduiEngine';

import { useRouter } from 'expo-router';

export default function HomeScreen() {
    const router = useRouter();

    return (
        <SafeScreen config={SCREEN_CONFIGS.HOME}>
            {(blocks) => (
                <View style={styles.container}>
                    <SduiEngine blocks={blocks} />

                    {/* Header Actions - Nút bấm phải nằm ở sau SduiEngine (phía dưới DOM) và zIndex cao để nổi lên trên */}
                    <View style={styles.absoluteActions}>
                        <TouchableOpacity style={styles.iconBtn}><Text style={styles.iconTxt}>✨</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(main)/notifications')}>
                            <Text style={styles.iconTxt}>🔔</Text>
                            <View style={styles.unreadBadge} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    absoluteActions: {
        flexDirection: 'row',
        position: 'absolute',
        top: -55, // Trùng khớp với SafeScreen header
        right: 16,
        gap: 12,
        zIndex: 9999,      // Luôn nằm ở trên top các block bên dưới
        elevation: 10,     // Nổi khối trên Android
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
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

