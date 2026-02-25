import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { UIBlock } from '../../core/sdui/LayoutEngine';
import { ApiClient } from '../../services/ApiClient';
import { ActionRegistry } from '../../utils/ActionRegistry';

export const FormInputBlock: React.FC<{ data: UIBlock }> = ({ data }) => {
    const { title, fields, submit_url, submit_label, success_action } = data.properties;
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!submit_url) {
            Alert.alert('Lỗi', 'Không có điểm đến lưu Form');
            return;
        }

        setLoading(true);
        try {
            await ApiClient.post(submit_url, formData);
            Alert.alert('Thành công', 'Đã lưu dữ liệu hoàn tất! 🎉');
            if (success_action) {
                ActionRegistry.execute(success_action.type, success_action.payload);
            }
        } catch (e: any) {
            Alert.alert('Lỗi Lưu Form', e.message || 'Thử lại sau...');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title || '📝 Nhập thông tin'}</Text>

            {fields?.map((field: any, idx: number) => (
                <View key={idx} style={styles.fieldGroup}>
                    <Text style={styles.label}>{field.label} {field.required && <Text style={{ color: 'red' }}>*</Text>}</Text>

                    <TextInput
                        style={[styles.input, field.type === 'textarea' && { height: 100, textAlignVertical: 'top' }]}
                        placeholder={field.placeholder || 'Nhập...'}
                        placeholderTextColor="#94a3b8"
                        multiline={field.type === 'textarea'}
                        secureTextEntry={field.type === 'password'}
                        keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                        value={formData[field.name] || ''}
                        onChangeText={(val) => setFormData(prev => ({ ...prev, [field.name]: val }))}
                    />
                </View>
            ))}

            <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
            >
                <Text style={styles.submitText}>{loading ? 'Đang gửi...' : (submit_label || 'Gửi Đi')}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 12, padding: 16, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    title: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 20 },
    fieldGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#1e293b' },
    submitBtn: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
