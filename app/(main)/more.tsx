import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { SafeScreen } from '../../src/components/layout/SafeScreen';
import { SCREEN_CONFIGS } from '../../src/config/ScreenConfigs';
import { SduiEngine } from '../../src/components/blocks/SduiEngine';

export default function MoreScreen() {
    return (
        <SafeScreen config={SCREEN_CONFIGS.MORE}>
            {(blocks) => (
                <View style={styles.container}>
                    <SduiEngine blocks={blocks} />

                    {/* Floating Action for Quick Access */}
                    <TouchableOpacity style={styles.fab}>
                        <Text style={styles.fabIcon}>⚡</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        borderRadius: 23,
        backgroundColor: '#ea580c',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabIcon: { fontSize: 24, color: '#fff' },
});
