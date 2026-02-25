import React, { useState } from 'react';
import { View, Text, Alert, Platform, Image } from 'react-native';
import { useAuth } from '@/core/auth/AuthProvider';
import { SocialLoginService } from '@/core/auth/social-login';
import { Input } from '@/presentation/components/ui/Input';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { ScreenWrapper } from '@/presentation/components/layout/ScreenWrapper';

export default function LoginScreen() {
    const { login, loginSocial, loginWithBiometric, isBiometricSupported } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        if (!email || !password) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ email và mật khẩu');
            return;
        }

        setLoading(true);

        try {
            await login({ email, password });
        } catch (error: any) {
            // Error handling improved in AuthProvider/API, but UI should also be robust
            // If zody validation fails, the error message from API layer should be helpful
            const serverMessage = error?.response?.data?.message;
            // Also check for validation errors from Laravel
            const displayMessage = serverMessage || error.message || 'Email hoặc mật khẩu không đúng';
            Alert.alert('Đăng nhập thất bại', displayMessage);
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleLogin() {
        if (Platform.OS === 'web') {
            // On web, we might mock it or show alert (AuthApi handles mock logic but SocialLoginService warns)
            // But here we call SocialLoginService directly first to get token.
            // SocialLoginService.signInWithGoogle returns mock token on web if not guarded well or throws.
            // Let's rely on SocialLoginService's behavior.
            try {
                const idToken = await SocialLoginService.signInWithGoogle();
                // If mock token returned (e.g. 'mock_google_id_token'), proceed to loginSocial
                if (idToken) {
                    await loginSocial({ provider: 'google', id_token: idToken });
                }
            } catch (error: any) {
                Alert.alert('Lỗi', error.message);
            }
            return;
        }

        setLoading(true);

        try {
            const idToken = await SocialLoginService.signInWithGoogle();
            await loginSocial({ provider: 'google', id_token: idToken });
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Đăng nhập Google thất bại');
        } finally {
            setLoading(false);
        }
    }

    async function handleAppleLogin() {
        if (Platform.OS === 'web') {
            try {
                const idToken = await SocialLoginService.signInWithApple();
                if (idToken) {
                    await loginSocial({ provider: 'apple', id_token: idToken });
                }
            } catch (error: any) {
                Alert.alert('Lỗi', error.message);
            }
            return;
        }

        if (Platform.OS !== 'ios') {
            Alert.alert('Không khả dụng', 'Apple Sign-In chỉ khả dụng trên iOS');
            return;
        }

        setLoading(true);

        try {
            const idToken = await SocialLoginService.signInWithApple();
            await loginSocial({ provider: 'apple', id_token: idToken });
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Đăng nhập Apple thất bại');
        } finally {
            setLoading(false);
        }
    }

    async function handleBiometricLogin() {
        setLoading(true);

        try {
            await loginWithBiometric();
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Xác thực sinh trắc học thất bại');
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScreenWrapper scrollable centered bgColor="bg-blue-50">
            <Card className="w-full max-w-sm">
                <View className="items-center mb-8">
                    {/* Placeholder Logo */}
                    <View className="w-20 h-20 bg-blue-600 rounded-2xl items-center justify-center mb-4">
                        <Text className="text-white text-3xl font-bold">QV</Text>
                    </View>
                    <Text className="text-2xl font-bold text-gray-900">
                        Qvc App
                    </Text>
                    <Text className="text-gray-500 mt-1">
                        Enterprise Workspace
                    </Text>
                </View>

                <Input
                    label="Email"
                    placeholder="example@qvc.vn"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    blurOnSubmit={false}
                />

                <Input
                    label="Mật khẩu"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    onSubmitEditing={handleLogin}
                />

                <Button
                    title={loading ? 'Đang xác thực...' : 'Đăng nhập'}
                    onPress={handleLogin}
                    loading={loading}
                    disabled={loading}
                    fullWidth
                    size="lg"
                    className="mt-2"
                />

                <View className="flex-row items-center my-6">
                    <View className="flex-1 h-px bg-gray-200" />
                    <Text className="mx-4 text-gray-400 text-sm">Hoặc đăng nhập với</Text>
                    <View className="flex-1 h-px bg-gray-200" />
                </View>

                <View className="flex-row space-x-3 justify-center mb-4">
                    <Button
                        title="Google"
                        onPress={handleGoogleLogin}
                        variant="secondary"
                        containerClassName="flex-1"
                    />
                    {Platform.OS === 'ios' || Platform.OS === 'web' ? (
                        <Button
                            title="Apple"
                            onPress={handleAppleLogin}
                            variant="secondary"
                            containerClassName="flex-1"
                        />
                    ) : null}
                </View>

                {isBiometricSupported && (
                    <Button
                        title="Sử dụng FaceID / Vân tay"
                        onPress={handleBiometricLogin}
                        variant="ghost"
                        fullWidth
                        className="mt-2"
                    />
                )}
            </Card>

            <Text className="text-gray-400 text-xs text-center mt-6">
                Phiên bản 2.0.0 (Enterprise)
            </Text>
        </ScreenWrapper>
    );
}
