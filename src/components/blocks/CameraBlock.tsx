import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface CameraBlockProps {
    data: {
        label: string;
        id_key?: string;
        required?: boolean;
        description?: string;
        context_type?: string;
        context_id?: string | number;
        allowsEditing?: boolean;
    };
    onChange?: (uri: string) => void;
}

export const CameraBlock: React.FC<CameraBlockProps> = ({ data, onChange }) => {
    const [image, setImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền camera để chụp ảnh.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: data.allowsEditing !== undefined ? data.allowsEditing : true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setImage(uri);

            if (onChange) {
                // Nếu Parent Component truyền onChange, giao quyền xử lý ảnh cho Parent
                onChange(uri);
            } else {
                // Logic cũ: tự auto-log nếu dùng SDUI độc lập
                console.log(`[CameraSync] New capture ready for ${data.context_type || 'POST'} #${data.context_id || '0'}`);
                setIsSubmitting(true);
                setTimeout(() => {
                    console.log(`[OnlineLog] Image [${uri.split('/').pop()}] successfully linked to ${data.context_type}:${data.context_id}`);
                    setIsSubmitting(false);
                }, 1000);
            }
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.label}>
                    {data.label} {data.required && <Text style={{ color: '#ef4444' }}>*</Text>}
                </Text>
                {data.context_id && <Text style={styles.contextBadge}>{data.context_type}: {data.context_id}</Text>}
            </View>

            {data.description && <Text style={styles.desc}>{data.description}</Text>}

            <TouchableOpacity style={styles.photoBox} onPress={takePhoto} disabled={isSubmitting}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.preview} />
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={styles.icon}>📸</Text>
                        <Text style={styles.placeholderTxt}>{isSubmitting ? 'Đang logs online...' : 'Nhấn để chụp ảnh'}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginVertical: 12, paddingHorizontal: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
    contextBadge: { fontSize: 10, color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: '700' },
    desc: { fontSize: 13, color: '#64748b', marginBottom: 10 },
    photoBox: {
        height: 200,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    preview: { width: '100%', height: '100%' },
    placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    icon: { fontSize: 32, marginBottom: 8 },
    placeholderTxt: { color: '#94a3b8', fontSize: 14 }
});
