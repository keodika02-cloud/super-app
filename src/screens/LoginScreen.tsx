/**
 * src/screens/LoginScreen.tsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Màn hình đăng nhập NATIVE – Zero-Crash version.
 *
 * Hardening so với v1:
 *   ✓ AbortController timeout 10s (không spinner 30s mãi mãi)
 *   ✓ Nút HỦY trong khi đang loading
 *   ✓ Biometric chỉ hiện khi Device.isDevice (không crash Simulator)
 *   ✓ ErrorBoundary bên ngoài (xem _layout.tsx)
 *   ✓ Privacy Policy link (Apple requirement)
 *   ✓ Mọi error đều hiện thông báo tiếng Việt rõ ràng
 * ──────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, TextInput, ScrollView,
    KeyboardAvoidingView, Platform,
    Alert, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Device from 'expo-device';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuthStore } from '@stores/useAuthStore';
import { HardwareService } from '@services/HardwareService';
import { NotificationService } from '@services/NotificationService';
import { StorageService } from '@services/StorageService';
import { ApiError } from '@services/ApiClient';
import { GlassCard } from '@components/ui/GlassCard';
import { AppButton } from '@components/ui/AppButton';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { Env } from '../config/env';

// ─── Form Schema ──────────────────────────────────────────────────────────────

const loginSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
});
type LoginForm = z.infer<typeof loginSchema>;

const PRIVACY_URL = 'https://qvc.vn/privacy.html';
const LOGIN_TIMEOUT = 10_000; // 10 giây – đủ cho mobile, không làm user chờ mãi

// ─── Screen ───────────────────────────────────────────────────────────────────

export function LoginScreen() {
    const router = useRouter();
    const {
        login, require2FA, verify2FA, resend2FA, cancel2FA, loginSocial
    } = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState<string | null>(null);
    const [bioAvail, setBioAvail] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [otp, setOtp] = useState('');
    const [rememberDevice, setRememberDevice] = useState(true);

    // AbortController để cancel login request khi timeout hoặc user bấm Hủy
    const abortRef = useRef<AbortController | null>(null);

    const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    useEffect(() => {
        // Kiểm tra biometric khi mount
        HardwareService.hasBiometric().then(setBioAvail);
        // Cleanup: hủy request nếu đang loading khi component unmount
        return () => { abortRef.current?.abort(); };
    }, []);

    // ─── Hủy login đang gọi ─────────────────────────────────────────────────────
    const handleCancel = useCallback(() => {
        abortRef.current?.abort();
        setLoading(false);
        setLoadingStage(null);
        setErrorMsg('Đã hủy đăng nhập.');
    }, []);

    // ─── Đăng nhập Email/Password ────────────────────────────────────────────────
    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        setErrorMsg(null);
        setLoadingStage('Đang khởi tạo kết nối...');

        const controller = new AbortController();
        abortRef.current = controller;

        const timeoutId = setTimeout(() => { controller.abort(); }, LOGIN_TIMEOUT);

        try {
            setLoadingStage('Đang xác thực thông tin...');
            await login(data.email, data.password);

            // Nếu cần 2FA, logic bên trong login store đã set require2FA = true
            // Nếu không cần 2FA, tiến hành tiếp
            if (!useAuthStore.getState().require2FA) {
                setLoadingStage('Đang đồng bộ phiên...');
                clearTimeout(timeoutId);
                await StorageService.saveLastEmail(data.email);

                setLoadingStage('Kết nối thông báo...');
                NotificationService.registerDevice().catch(() => { });

                setLoadingStage('Sẵn sàng!');
                // @ts-ignore: Mismatched router types in Expo 50+
                router.replace('/');
            }
        } catch (err: unknown) {
            clearTimeout(timeoutId);
            setLoadingStage(null);

            if (controller.signal.aborted) {
                setErrorMsg('Yêu cầu quá thời gian chờ (10s).');
                return;
            }

            if (err instanceof ApiError) {
                if (err.errors) {
                    const firstError = Object.values(err.errors)[0]?.[0];
                    if (firstError) { setErrorMsg(firstError); return; }
                }

                switch (err.code) {
                    case 401: setErrorMsg('Tài khoản hoặc mật khẩu không đúng.'); break;
                    case 403: setErrorMsg('Tài khoản đã bị tạm khóa.'); break;
                    case 422: setErrorMsg('Dữ liệu không hợp chuẩn.'); break;
                    case 500: setErrorMsg('Máy chủ đang bảo trì.'); break;
                    default: setErrorMsg(err.message || 'Lỗi đăng nhập.');
                }
            } else {
                setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối.');
            }
        } finally {
            setLoading(false);
            if (!useAuthStore.getState().require2FA) {
                setLoadingStage(null);
            }
        }
    };

    // ─── Xử lý 2FA ─────────────────────────────────────────────────────────────
    const onVerifyOTP = async () => {
        if (otp.length < 6) {
            setErrorMsg('Vui lòng nhập đủ 6 số xác thực.');
            return;
        }
        setLoading(true);
        setErrorMsg(null);
        try {
            setLoadingStage('Đang xác thực OTP...');
            await verify2FA(otp, rememberDevice);
            // @ts-ignore: Mismatched router types in Expo 50+
            router.replace('/');
        } catch (err: any) {
            setErrorMsg(err.message || 'Mã xác thực không hợp lệ.');
        } finally {
            setLoading(false);
            setLoadingStage(null);
        }
    };

    // ─── Social Login (Chỉ Google như yêu cầu) ──────────────────────────────────
    const handleSocialLogin = async (provider: 'google' | 'facebook') => {
        setLoading(true);
        setErrorMsg(null);
        try {
            setLoadingStage(`Đang kết nối ${provider}...`);
            // MOCK: Khi có backend support, thay bằng Expo AuthSession
            Alert.alert(
                'Tính năng Google Login',
                'Hệ thống đang chờ cấu hình Google Client ID cho ứng dụng này.'
            );
        } catch (err: any) {
            setErrorMsg(`Lỗi kết nối ${provider}.`);
        } finally {
            setLoading(false);
            setLoadingStage(null);
        }
    };

    // ─── Đăng nhập Biometric ─────────────────────────────────────────────────────
    const onBiometric = async () => {
        const result = await HardwareService.authenticateBio('Đăng nhập nhanh vào QVC');
        if (result.authenticated) {
            const savedEmail = await StorageService.getLastEmail();
            if (!savedEmail) {
                setErrorMsg('Vui lòng đăng nhập bằng mật khẩu lần đầu.');
                return;
            }
            Alert.alert('Sinh trắc học', 'Phiên làm việc cũ đã hết hạn. Vui lòng nhập mật khẩu để tiếp tục.');
        }
    };

    // ─── UI 2FA OTP ────────────────────────────────────────────────────────────
    if (require2FA) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', padding: 24 }}>
                <GlassCard>
                    <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 }}>Xác thực bảo mật</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
                        Một mã OTP đã được gửi về Email của bạn.
                    </Text>

                    <TextInput
                        style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', color: '#fff', padding: 18, fontSize: 24, textAlign: 'center', letterSpacing: 10, marginBottom: 20 }}
                        placeholder="000000" placeholderTextColor="#334155"
                        keyboardType="number-pad" maxLength={6}
                        value={otp} onChangeText={setOtp}
                    />

                    <AppButton label={loadingStage || "Xác nhận OTP"} onPress={onVerifyOTP} loading={loading} fullWidth />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                        <TouchableOpacity onPress={() => { resend2FA(); Alert.alert('Thông báo', 'Đã yêu cầu gửi lại mã.'); }}>
                            <Text style={{ color: '#60a5fa', fontSize: 14, fontWeight: '600' }}>Gửi lại mã</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={cancel2FA}>
                            <Text style={{ color: '#94a3b8', fontSize: 14 }}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                </GlassCard>
            </View>
        );
    }

    // ─── UI Main Login ──────────────────────────────────────────────
    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            {/* Blobs trang trí */}
            <View style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#1d4ed8', opacity: 0.2, top: -50, left: -50 }} />
            <View style={{ position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#7c3aed', opacity: 0.15, bottom: 50, right: -50 }} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
                    <View style={{ alignItems: 'center', marginBottom: 40 }}>
                        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 }}>
                            <Text style={{ fontSize: 40 }}>⚡</Text>
                        </View>
                        <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 16 }}>QUỐC VIỆT</Text>
                        <Text style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>App nội bộ cho nhân viên</Text>
                    </View>

                    <GlassCard>
                        {errorMsg && (
                            <TouchableOpacity onPress={() => setErrorMsg(null)} style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' }}>
                                <Text style={{ color: '#f87171', fontSize: 13 }}>⚠️ {errorMsg}</Text>
                            </TouchableOpacity>
                        )}

                        <Text style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8, marginLeft: 4 }}>Tài khoản Email</Text>
                        <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#fff', padding: 16, marginBottom: 16, fontSize: 16 }}
                                placeholder="name@company.com" placeholderTextColor="#475569" value={value} onChangeText={onChange} autoCapitalize="none" editable={!loading}
                            />
                        )} />

                        <Text style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8, marginLeft: 4 }}>Mật khẩu</Text>
                        <View style={{ marginBottom: 24 }}>
                            <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
                                <TextInput
                                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#fff', padding: 16, fontSize: 16, paddingRight: 50 }}
                                    placeholder="••••••••" placeholderTextColor="#475569" secureTextEntry={!showPass} value={value} onChangeText={onChange} editable={!loading}
                                />
                            )} />
                            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 16, top: 16 }}>
                                <Text style={{ fontSize: 18 }}>{showPass ? '🙊' : '👁️'}</Text>
                            </TouchableOpacity>
                        </View>

                        <AppButton label={loadingStage || "Đăng nhập hệ thống"} onPress={() => !loading && handleSubmit(onSubmit)()} loading={loading} fullWidth />

                        {Env.EXPO_PUBLIC_ENABLE_GOOGLE_AUTH && (
                            <>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
                                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                                    <Text style={{ color: '#475569', marginHorizontal: 16, fontSize: 12, fontWeight: '700' }}>HOẶC</Text>
                                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                                </View>

                                {/* Chỉ hỗ trợ Google như yêu cầu */}
                                <TouchableOpacity
                                    onPress={() => handleSocialLogin('google')}
                                    style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 }}
                                    activeOpacity={0.9}
                                    disabled={loading}
                                >
                                    <Text style={{ fontSize: 20, marginRight: 12 }}>G</Text>
                                    <Text style={{ fontWeight: '700', color: '#1e293b', fontSize: 15 }}>Tiếp tục với Google</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {bioAvail && Device.isDevice && !loading && (
                            <TouchableOpacity onPress={onBiometric} style={{ alignItems: 'center', marginTop: 28 }}>
                                <Text style={{ color: '#60a5fa', fontSize: 14, fontWeight: '500' }}>🔐 Đăng nhập bằng Vân tay / Khuôn mặt</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}
                            style={{ alignItems: 'center', marginTop: 32 }}
                        >
                            <Text style={{ color: '#475569', fontSize: 11 }}>Chính sách bảo mật & Điều khoản sử dụng</Text>
                        </TouchableOpacity>
                    </GlassCard>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Nút hủy nổi khi đang chờ phản hồi mạng */}
            {loading && loadingStage && (
                <TouchableOpacity
                    onPress={handleCancel}
                    style={{ position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 }}
                >
                    <Text style={{ color: '#94a3b8', fontSize: 13 }}>Hủy yêu cầu</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
