import React from 'react';
import { SafeScreen } from '../../src/components/layout/SafeScreen';
import { SCREEN_CONFIGS } from '../../src/config/ScreenConfigs';
import { SduiEngine } from '../../src/components/blocks/SduiEngine';

export default function ReportsScreen() {
    return (
        <SafeScreen config={SCREEN_CONFIGS.REPORTS}>
            {(blocks) => <SduiEngine blocks={blocks} />}
        </SafeScreen>
    );
}

