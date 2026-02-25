import { Redirect } from 'expo-router';

export default function Index() {
    // TODO: Check auth status và redirect
    // Tạm thời redirect về auth
    return <Redirect href="/(auth)/login" />;
}
