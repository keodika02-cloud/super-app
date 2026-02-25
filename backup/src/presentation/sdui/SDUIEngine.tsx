import React from 'react';
import { View, Text } from 'react-native';
import { SDUIBlock } from './types';
import { getComponent } from '@/presentation/sdui/registry';

interface Props {
    blocks: SDUIBlock[];
    depth?: number; // ✅ Guard: Chống Stack Overflow
}

const MAX_DEPTH = 10; // Giới hạn lồng nhau 10 cấp

export const SDUIEngine: React.FC<Props> = ({ blocks, depth = 0 }) => {
    // 1. Guard: Empty Check
    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return null;

    // 2. Guard: Max Depth
    if (depth > MAX_DEPTH) {
        console.warn('⚠️ SDUI Max Depth Exceeded. Stopping recursion.');
        return null;
    }

    return (
        <>
            {blocks.map((block) => {
                const Component = getComponent(block.type);

                // 3. Guard: Unknown Component
                if (!Component) {
                    if (__DEV__) {
                        return (
                            <View
                                key={block.id}
                                className="bg-red-100 p-2 m-1 border border-red-300"
                            >
                                <Text className="text-red-600 text-xs">
                                    Unknown Block: {block.type}
                                </Text>
                            </View>
                        );
                    }
                    return null; // Production: Ẩn đi
                }

                return (
                    <Component
                        key={block.id}
                        {...block.props}
                        action={block.action}
                    >
                        {/* ✅ RECURSION MAGIC: Render con của block này */}
                        {block.children && (
                            <SDUIEngine
                                blocks={block.children}
                                depth={depth + 1}
                            />
                        )}
                    </Component>
                );
            })}
        </>
    );
};
