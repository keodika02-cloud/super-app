import React from 'react';
import { View, StyleSheet } from 'react-native';
import { type SduiBlock } from '../../config/api-endpoints';
import { safeArray } from '../../utils/safe';
import { BlockBoundary } from '../error/BlockBoundary';

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
import { CameraBlock } from './CameraBlock';
import { GpsBlock } from './GpsBlock';
import { ImageBlock } from './ImageBlock';
import { CommentBlock } from './CommentBlock';
import { UploadBlock } from './UploadBlock';
import { TaskBoardBlock } from './TaskBoardBlock';
import { ListGroupBlock } from './ListGroupBlock';
import { DetailViewBlock } from './DetailViewBlock';
import { FormInputBlock } from './FormInputBlock';

/**
 * COMPONENT REGISTRY
 * Mọi block mới phải được đăng ký ở đây để SduiEngine có thể nhận diện.
 */
const COMPONENT_REGISTRY: Record<string, React.FC<any>> = {
    ProfileHeaderBlock,
    GridMenuBlock,
    BannerBlock,
    SummaryCardBlock,
    FeedActionBlock,
    SocialFeedBlock,
    HtmlBlock,
    StoryBlock,
    PostComposerBlock,
    CameraBlock,
    GpsBlock,
    ImageBlock,
    CommentBlock,
    UploadBlock,
    // Alias cho các Mock Data vạn năng
    HEADER_BANNER: BannerBlock,
    TASK_BOARD: TaskBoardBlock,
    LIST_GROUP: ListGroupBlock,
    DETAIL_VIEW: DetailViewBlock,
    FORM_INPUT: FormInputBlock,
};

export const SduiEngine = ({ blocks }: { blocks: SduiBlock[] }) => {
    return (
        <View style={styles.engineContainer}>
            {safeArray(blocks).map((block, index) => {
                if (!block || typeof block !== 'object') return null;
                const key = block.id || `block_${index}`;

                try {
                    const BlockComponent = COMPONENT_REGISTRY[block.type] || UnknownBlock;
                    return (
                        <BlockBoundary key={key} blockName={block.type}>
                            <BlockComponent type={block.type} data={block.data || {}} />
                        </BlockBoundary>
                    );
                } catch (e) {
                    // Cực kỳ an toàn: Dù Registry lỗi hay Block truyền sai tham số nặng nề
                    return (
                        <UnknownBlock
                            key={key}
                            type={block?.type || 'Lỗi Nghiêm Trọng'}
                            data={{ error: 'Lỗi Render Block', details: 'Block này đã gây lỗi hệ thống UI (JS Crash). Đã bị cô lập.' }}
                        />
                    );
                }
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
