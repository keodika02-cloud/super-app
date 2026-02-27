import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// ─── SDUI Types ───────────────────────────────────────────────────────────────

import { TaskBoardBlock } from '../../components/blocks/TaskBoardBlock';
import { ListGroupBlock } from '../../components/blocks/ListGroupBlock';
import { DetailViewBlock } from '../../components/blocks/DetailViewBlock';
import { FormInputBlock } from '../../components/blocks/FormInputBlock';

export type BlockType =
    | 'HEADER_BANNER'
    | 'GRID_MENU'
    | 'NEWS_LIST'
    | 'VERTICAL_LIST'
    | 'CHART_PIE'
    | 'TASK_BOARD'
    | 'LIST_GROUP'
    | 'DETAIL_VIEW'
    | 'FORM_INPUT';

export interface AppAction {
    type: 'NAVIGATE' | 'API_CALL' | 'OPEN_URL';
    target: string;
    payload?: Record<string, any>;
    requires_auth?: boolean;
}

export interface UIBlock {
    id: string | number;
    type: BlockType | string;
    properties: {
        title?: string;
        icon?: string;
        style?: string;
        data_endpoint?: string;
        [key: string]: any;
    };
    action?: AppAction;
    children?: UIBlock[];
}

// ─── Placeholder widgets (sẽ mở rộng sau) ────────────────────────────────────

const HeaderBannerWidget: React.FC<{ data: UIBlock }> = ({ data }) => (
    <View style={styles.bannerContainer}>
        <Text style={styles.bannerTitle}>{data.properties.title ?? 'QVC App'}</Text>
        <Text style={styles.bannerSub}>Chào buổi sáng! 👋</Text>
    </View>
);

const GridMenuWidget: React.FC<{ data: UIBlock }> = ({ data }) => (
    <View style={styles.gridContainer}>
        <Text style={styles.sectionTitle}>{data.properties.title ?? 'Menu'}</Text>
        <Text style={styles.placeholder}>[Grid Menu – đang phát triển]</Text>
    </View>
);

const NewsListWidget: React.FC<{ data: UIBlock }> = ({ data }) => (
    <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>{data.properties.title ?? 'Tin tức'}</Text>
        <Text style={styles.placeholder}>[Danh sách tin – đang phát triển]</Text>
    </View>
);

const VerticalListWidget: React.FC<{ data: UIBlock }> = ({ data }) => (
    <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>{data.properties.title ?? 'Danh sách'}</Text>
        <Text style={styles.placeholder}>[Vertical List – đang phát triển]</Text>
    </View>
);

const ErrorBoxWidget: React.FC<{ msg: string }> = ({ msg }) => (
    <View style={styles.errorBox}>
        <Text style={styles.errorBoxText}>{msg}</Text>
    </View>
);

// ─── Widget Registry ──────────────────────────────────────────────────────────
// Đây là danh sách Widget đã được đăng ký.
// Server trả về type lạ → DEV thấy ErrorBox, PROD render null (không crash).

const WIDGET_REGISTRY: Record<string, React.FC<{ data: UIBlock }>> = {
    HEADER_BANNER: HeaderBannerWidget,
    GRID_MENU: GridMenuWidget,
    NEWS_LIST: NewsListWidget,
    VERTICAL_LIST: VerticalListWidget,
    TASK_BOARD: TaskBoardBlock,
    LIST_GROUP: ListGroupBlock,
    DETAIL_VIEW: DetailViewBlock,
    FORM_INPUT: FormInputBlock,
};

// ─── Layout Engine ────────────────────────────────────────────────────────────

interface LayoutEngineProps {
    blocks: UIBlock[];
}

export const LayoutEngine: React.FC<LayoutEngineProps> = ({ blocks }) => {
    return (
        <>
            {blocks.map((block, index) => {
                const Widget = WIDGET_REGISTRY[block.type];

                if (!Widget) {
                    if (__DEV__) {
                        return (
                            <ErrorBoxWidget
                                key={block.id ?? index}
                                msg={`❌ Widget chưa được tạo: "${block.type}"`}
                            />
                        );
                    }
                    // PROD: ẩn đi âm thầm
                    return null;
                }

                try {
                    return <Widget key={block.id ?? index} data={block} />;
                } catch (err) {
                    console.error(`[SDUI] Widget "${block.type}" crashed:`, err);
                    if (__DEV__) return <ErrorBoxWidget key={block.id ?? index} msg={`💥 Widget crashed: ${block.type}`} />;
                    return null;
                }
            })}
        </>
    );
};

const styles = StyleSheet.create({
    bannerContainer: {
        backgroundColor: '#1E3A8A',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 16,
        marginVertical: 8,
    },
    bannerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    bannerSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    gridContainer: {
        paddingHorizontal: 16,
        marginVertical: 8,
    },
    listContainer: {
        paddingHorizontal: 16,
        marginVertical: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    placeholder: {
        fontSize: 13,
        color: '#9CA3AF',
        fontStyle: 'italic',
        padding: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    errorBox: {
        margin: 12,
        padding: 12,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorBoxText: {
        color: '#DC2626',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default LayoutEngine;
