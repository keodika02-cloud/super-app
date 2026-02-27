import React, { useState } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { ActionRegistry } from '../../utils/ActionRegistry';

interface ImageBlockProps {
    data: {
        url: string;
        aspect_ratio: number;
        resize_mode?: 'cover' | 'contain' | 'stretch';
        action?: string;
    };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ImageBlock: React.FC<ImageBlockProps> = ({ data }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handlePress = () => {
        if (data.action) {
            ActionRegistry.execute(data.action);
        }
    };

    const blockWidth = SCREEN_WIDTH - 32; // Khoảng cách lề chuẩn
    const blockHeight = blockWidth / (data.aspect_ratio || 1.7);

    // Placeholder khi ảnh đang tải hoặc lỗi/offline
    const renderPlaceholder = () => (
        <View style={[styles.placeholder, { height: blockHeight }]}>
            <View style={styles.placeholderIconContainer}>
                <Text style={styles.placeholderIcon}>🖼️</Text>
                <ActivityIndicator size="small" color="#94a3b8" style={{ marginTop: 8 }} />
            </View>
        </View>
    );

    const content = (
        <View style={{ height: blockHeight, width: '100%', overflow: 'hidden', borderRadius: 16 }}>
            {(!data.url || hasError) ? renderPlaceholder() : (
                <>
                    <Image
                        source={{ uri: data.url }}
                        style={[styles.image, { height: blockHeight }]}
                        resizeMode={data.resize_mode || 'cover'}
                        onLoadStart={() => setIsLoading(true)}
                        onLoadEnd={() => setIsLoading(false)}
                        onError={() => {
                            console.log('[ImageBlock] ❌ Failed to load image:', data.url);
                            setHasError(true);
                            setIsLoading(false);
                        }}
                    />
                    {isLoading && renderPlaceholder()}
                </>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {data.action ? (
                <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
                    {content}
                </TouchableOpacity>
            ) : (
                content
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginVertical: 12,
    },
    image: {
        width: '100%',
        backgroundColor: '#f1f5f9',
    },
    placeholder: {
        width: '100%',
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    placeholderIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderIcon: {
        fontSize: 32,
        opacity: 0.5,
    }
});
