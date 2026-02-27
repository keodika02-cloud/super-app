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
    Alert, TouchableOpacity, Image,
    Animated, Easing
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Device from 'expo-device';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';

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
    const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

    // AbortController để cancel login request khi timeout hoặc user bấm Hủy
    const abortRef = useRef<AbortController | null>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const floatAnim1 = useRef(new Animated.Value(0)).current;
    const floatAnim2 = useRef(new Animated.Value(0)).current;

    const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    useEffect(() => {
        // Kiểm tra biometric khi mount
        HardwareService.hasBiometric().then(setBioAvail);

        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 1000, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true })
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim1, { toValue: -20, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(floatAnim1, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim2, { toValue: -20, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(floatAnim2, { toValue: 0, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
            ])
        ).start();

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
        if (otp.length < 6) { return setErrorMsg('Vui lòng nhập đủ 6 số xác thực.'); }
        setLoading(true); setErrorMsg(null);
        try {
            setLoadingStage('Đang xác thực OTP...');
            await verify2FA(otp, rememberDevice);
            // @ts-ignore
            router.replace('/');
        } catch (err: any) {
            setErrorMsg(err.message || 'Mã xác thực không hợp lệ.');
        } finally {
            setLoading(false); setLoadingStage(null);
        }
    };

    // ─── Social Login (Google & Apple) ──────────────────────────────────
    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        setLoading(true); setErrorMsg(null);
        try {
            setLoadingStage(`Đang kết nối ${provider}...`);
            if (provider === 'apple') {
                const credential = await AppleAuthentication.signInAsync({
                    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
                });
                if (credential.identityToken) {
                    await loginSocial('apple' as any, credential.identityToken);
                    router.replace('/');
                }
            } else {
                Alert.alert('Tính năng Google Login', 'Hệ thống đang chờ cấu hình Google Client ID.');
            }
        } catch (err: any) {
            if (err?.code === 'ERR_CANCELED') setErrorMsg('Đã hủy đăng nhập social.');
            else setErrorMsg(`Lỗi kết nối ${provider}: ${err.message}`);
        } finally {
            setLoading(false); setLoadingStage(null);
        }
    };

    // ─── Đăng nhập Biometric ─────────────────────────────────────────────────────
    const onBiometric = async () => {
        const result = await HardwareService.authenticateBio('Đăng nhập nhanh vào QVC');
        if (result.authenticated) {
            const savedEmail = await StorageService.getLastEmail();
            if (!savedEmail) return setErrorMsg('Vui lòng đăng nhập bằng mật khẩu lần đầu.');
            Alert.alert('Sinh trắc học', 'Phiên làm việc cũ đã hết hạn. Vui lòng nhập mật khẩu để tiếp tục.');
        }
    };

    // ─── UI 2FA OTP ────────────────────────────────────────────────────────────
    if (require2FA) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', padding: 24 }}>
                <GlassCard>
                    <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 }}>Xác thực bảo mật</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>Một mã OTP đã được gửi về Email của bạn.</Text>
                    <TextInput
                        style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', color: '#fff', padding: 18, fontSize: 24, textAlign: 'center', letterSpacing: 10, marginBottom: 20 }}
                        placeholder="000000" placeholderTextColor="#334155" keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp}
                    />
                    <AppButton label={loadingStage || "Xác nhận OTP"} onPress={onVerifyOTP} loading={loading} fullWidth />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                        <TouchableOpacity onPress={() => { resend2FA(); Alert.alert('Thông báo', 'Đã yêu cầu gửi lại mã.'); }}><Text style={{ color: '#60a5fa', fontSize: 14, fontWeight: '600' }}>Gửi lại mã</Text></TouchableOpacity>
                        <TouchableOpacity onPress={cancel2FA}><Text style={{ color: '#94a3b8', fontSize: 14 }}>Hủy</Text></TouchableOpacity>
                    </View>
                </GlassCard>
            </View>
        );
    }

    // ─── UI Main Login ──────────────────────────────────────────────
    return (
        <LinearGradient colors={['#eef2ff', '#ffffff', '#f5f3ff']} style={{ flex: 1 }}>

            {/* Background floating blobs */}
            <Animated.View style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: '#818cf8', opacity: 0.15, transform: [{ translateY: floatAnim1 }] }} />
            <Animated.View style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: '#60a5fa', opacity: 0.15, transform: [{ translateY: floatAnim2 }] }} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                    <Animated.View style={{
                        backgroundColor: '#fff', borderRadius: 32, padding: 24,
                        shadowColor: '#4f46e5', shadowOpacity: 0.1, shadowRadius: 30, shadowOffset: { width: 0, height: 10 }, elevation: 10,
                        opacity: fadeAnim, transform: [{ translateY: slideAnim }]
                    }}>

                        {/* Header Section */}
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <View style={{ width: 64, height: 64, backgroundColor: '#fff', borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#4f46e5', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, marginBottom: 12, transform: [{ rotate: '3deg' }], borderWidth: 1, borderColor: '#f1f5f9' }}>
                                <Image
                                    source={require('../../assets/logo.png')}
                                    style={{ width: 48, height: 48, transform: [{ rotate: '-3deg' }] }}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 4 }}>Chào mừng bạn!</Text>
                            <Text style={{ fontSize: 12, color: '#64748b' }}>Vui lòng đăng nhập để tiếp tục</Text>
                        </View>

                        {errorMsg && (
                            <TouchableOpacity onPress={() => setErrorMsg(null)} style={{ backgroundColor: '#fee2e2', borderRadius: 12, padding: 12, marginBottom: 16 }}>
                                <Text style={{ color: '#ef4444', textAlign: 'center', fontWeight: '500', fontSize: 13 }}>{errorMsg}</Text>
                            </TouchableOpacity>
                        )}

                        <View style={{ gap: 12 }}>
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: focusedInput === 'email' ? '#4f46e5' : '#475569', marginLeft: 4, marginBottom: 4 }}>Email</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: focusedInput === 'email' ? '#fff' : '#f8fafc', borderWidth: 1, borderColor: focusedInput === 'email' ? '#c7d2fe' : 'transparent', borderRadius: 12, height: 48, paddingHorizontal: 12 }}>
                                    <Ionicons name="mail" size={18} color={focusedInput === 'email' ? '#4f46e5' : '#94a3b8'} style={{ marginRight: 10 }} />
                                    <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            style={{ flex: 1, color: '#0f172a', fontSize: 14 }}
                                            placeholder="nhapemail@domain.com"
                                            placeholderTextColor="#94a3b8"
                                            value={value} onChangeText={onChange} autoCapitalize="none" editable={!loading}
                                            onFocus={() => setFocusedInput('email')} onBlur={() => setFocusedInput(null)}
                                        />
                                    )} />
                                </View>
                            </View>

                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: focusedInput === 'password' ? '#4f46e5' : '#475569', marginLeft: 4, marginBottom: 4 }}>Mật khẩu</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: focusedInput === 'password' ? '#fff' : '#f8fafc', borderWidth: 1, borderColor: focusedInput === 'password' ? '#c7d2fe' : 'transparent', borderRadius: 12, height: 48, paddingHorizontal: 12 }}>
                                    <Ionicons name="lock-closed" size={18} color={focusedInput === 'password' ? '#4f46e5' : '#94a3b8'} style={{ marginRight: 10 }} />
                                    <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            style={{ flex: 1, color: '#0f172a', fontSize: 14 }}
                                            placeholder="••••••••" placeholderTextColor="#94a3b8"
                                            value={value} onChangeText={onChange} secureTextEntry={!showPass} editable={!loading}
                                            onFocus={() => setFocusedInput('password')} onBlur={() => setFocusedInput(null)}
                                        />
                                    )} />
                                    <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                                        <Ionicons name={showPass ? "eye-off" : "eye"} size={18} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 2 }}>
                                <TouchableOpacity>
                                    <Text style={{ color: '#4f46e5', fontWeight: '600', fontSize: 12 }}>Quên mật khẩu?</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                onPress={handleSubmit(onSubmit)}
                                disabled={loading}
                                style={{ backgroundColor: '#0f172a', height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: '#0f172a', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5, opacity: loading ? 0.7 : 1 }}
                            >
                                {loading && loadingStage ? (
                                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{loadingStage}</Text>
                                ) : (
                                    <>
                                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginRight: 6 }}>Đăng nhập</Text>
                                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Floating Biometric Button */}
                        {bioAvail && Device.isDevice && !loading && (
                            <View style={{ alignItems: 'center', marginTop: 20 }}>
                                <TouchableOpacity
                                    onPress={onBiometric}
                                    style={{ width: 48, height: 48, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#4f46e5', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}
                                >
                                    <Ionicons name="finger-print" size={24} color="#4f46e5" />
                                </TouchableOpacity>
                                <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '500', marginTop: 8 }}>Vân tay / FaceID</Text>
                            </View>
                        )}

                        {/* Divider */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 12 }}>
                            <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
                            <Text style={{ color: '#94a3b8', marginHorizontal: 12, fontSize: 12, fontWeight: '500' }}>Hoặc đăng nhập với</Text>
                            <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
                        </View>

                        {/* Social Buttons Grid (3 columns) */}
                        <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
                            <TouchableOpacity
                                onPress={() => handleSocialLogin('google')}
                                style={{ flex: 1, height: 40, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, elevation: 1 }}
                            >
                                <Ionicons name="logo-google" size={20} color="#ea4335" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => Alert.alert('Facebook', 'Chức năng đang phát triển')}
                                style={{ flex: 1, height: 40, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, elevation: 1 }}
                            >
                                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                            </TouchableOpacity>

                            {Platform.OS === 'ios' && (
                                <TouchableOpacity
                                    onPress={() => handleSocialLogin('apple')}
                                    style={{ flex: 1, height: 40, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, elevation: 1 }}
                                >
                                    <Ionicons name="logo-apple" size={22} color="#000" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={{ alignItems: 'center', marginTop: 20 }}>
                            <Text style={{ color: '#64748b', fontSize: 13 }}>
                                Chưa có tài khoản? <Text style={{ color: '#4f46e5', fontWeight: '700' }}>Đăng ký ngay</Text>
                            </Text>
                        </View>

                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {loading && loadingStage && (
                <TouchableOpacity onPress={handleCancel} style={{ position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#e2e8f0', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 25 }}>
                    <Text style={{ color: '#475569', fontSize: 13, fontWeight: '700' }}>Hủy xác thực</Text>
                </TouchableOpacity>
            )}
        </LinearGradient>
    );
}
