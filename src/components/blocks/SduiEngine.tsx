import React from 'react';
import { View, StyleSheet } from 'react-native';
import { type SduiBlock } from '../../../src/config/api-endpoints';
import { safeArray } from '../../../src/utils/safe';
import { BlockBoundary } from '../../../src/components/error/BlockBoundary';

// Import all modular blocks
import { ProfileHeaderBlock } from './ProfileHeaderBlock';
import { GridMenuBlock } from './GridMenuBlock';
import { StoryBlock } from './StoryBlock';
import { PostComposerBlock } from './PostComposerBlock';
import { SocialFeedBlock } from './SocialFeedBlock';
import { HtmlBlock } from './HtmlBlock';
import { UnknownBlock } from './UnknownBlock';
import { SummaryCardBlock } from './SummaryCardBlock';
import { FeedActionBlock } from './FeedActionBlock';
import { BannerBlock } from './BannerBlock';

export const SduiEngine = ({ blocks }: { blocks: SduiBlock[] }) => {
    return (
        <View style={styles.engineContainer}>
            {safeArray(blocks).map((block, index) => {
                const key = block.id || `block_${index}`;

                // Extract Component based on type
                let BlockComponent;
                switch (block.type) {
                    case 'ProfileHeaderBlock': BlockComponent = ProfileHeaderBlock; break;
                    case 'GridMenuBlock': BlockComponent = GridMenuBlock; break;
                    case 'BannerBlock': BlockComponent = BannerBlock; break;
                    case 'SummaryCardBlock': BlockComponent = SummaryCardBlock; break;
                    case 'FeedActionBlock': BlockComponent = FeedActionBlock; break;
                    case 'SocialFeedBlock': BlockComponent = SocialFeedBlock; break;
                    case 'HtmlBlock': BlockComponent = HtmlBlock; break;
                    case 'StoryBlock': BlockComponent = StoryBlock; break;
                    case 'PostComposerBlock': BlockComponent = PostComposerBlock; break;
                    default: BlockComponent = UnknownBlock; break;
                }

                // Wrap each block in ErrorBoundary to prevent cascading crashes
                return (
                    <BlockBoundary key={key} blockName={block.type}>
                        <BlockComponent type={(block as any).type} data={block.data} />
                    </BlockBoundary>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    engineContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 20,
    },
});
