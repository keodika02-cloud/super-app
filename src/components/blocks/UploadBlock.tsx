import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

interface UploadBlockProps {
    data: {
        label: string;
        max_size_mb: number;
        context_type?: string;
        context_id?: string | number;
    };
}

export const UploadBlock: React.FC<UploadBlockProps> = ({ data }) => {
    const [file, setFile] = useState<any>(null);
    const [uploading, setUploading] = useState(false);

    const pickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
        });

        if (!result.canceled) {
            const selectedFile = result.assets[0];
            setFile(selectedFile);

            // LOGGING ONLINE
            console.log(`[UploadLog] File selected: ${selectedFile.name} (${selectedFile.size} bytes)`);
            console.log(`[UploadLog] Target: ${data.context_type || 'GLOBAL'} ID: ${data.context_id || '0'}`);

            // Bắt đầu quá trình upload giả lập
            setUploading(true);
            setTimeout(() => {
                console.log(`[OnlineSync] File [${selectedFile.name}] successfully uploaded to cloud for ${data.context_type}:${data.context_id}`);
                setUploading(false);
            }, 1500);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>{data.label}</Text>
                {data.context_id && <Text style={styles.badge}>#{data.context_id}</Text>}
            </View>

            <TouchableOpacity
                style={[styles.dropzone, file && styles.dropzoneActive]}
                onPress={pickDocument}
                disabled={uploading}
            >
                {uploading ? (
                    <View style={styles.loadingArea}>
                        <ActivityIndicator color="#3b82f6" />
                        <Text style={styles.loadingTxt}>Đang logs online...</Text>
                    </View>
                ) : file ? (
                    <View style={styles.fileInfo}>
                        <Text style={styles.fileIcon}>📄</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                            <Text style={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
                        </View>
                        <TouchableOpacity onPress={() => setFile(null)}><Text style={styles.remove}>✕</Text></TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={styles.icon}>📁</Text>
                        <Text style={styles.text}>Chọn tệp đính kèm</Text>
                        <Text style={styles.limit}>Tối đa {data.max_size_mb} MB</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 16, marginVertical: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
    badge: { fontSize: 11, color: '#3b82f6', backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' },
    dropzone: {
        height: 100,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dropzoneActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff', borderStyle: 'solid' },
    placeholder: { alignItems: 'center' },
    loadingArea: { alignItems: 'center' },
    loadingTxt: { fontSize: 12, color: '#3b82f6', marginTop: 8, fontWeight: '600' },
    icon: { fontSize: 24, marginBottom: 4 },
    text: { fontSize: 13, color: '#64748b' },
    limit: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    fileInfo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, width: '100%' },
    fileIcon: { fontSize: 24, marginRight: 12 },
    fileName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    fileSize: { fontSize: 12, color: '#64748b' },
    remove: { fontSize: 18, color: '#94a3b8', padding: 4 }
});
