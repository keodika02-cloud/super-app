/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,jsx,ts,tsx}',
        './src/**/*.{js,jsx,ts,tsx}',
    ],
    presets: [require('nativewind/preset')],
    theme: {
        extend: {
            colors: {
                // Matching backend admin color scheme
                primary: {
                    DEFAULT: '#2563EB', // blue-600
                    dark: '#1E40AF',    // blue-700
                    light: '#3B82F6',   // blue-500
                },
                success: '#10B981',   // green-500
                warning: '#F59E0B',   // amber-500
                error: '#EF4444',     // red-500
                danger: '#DC2626',    // red-600
                slate: {
                    50: '#F8FAFC',
                    100: '#F1F5F9',
                    200: '#E2E8F0',
                    300: '#CBD5E1',
                    400: '#94A3B8',
                    500: '#64748B',
                    600: '#475569',
                    700: '#334155',
                    800: '#1E293B',
                    900: '#0F172A',
                },
            },
            borderRadius: {
                'xl': '0.75rem',   // Backend uses rounded-xl frequently
                '2xl': '1rem',     // Backend uses rounded-2xl for cards
            },
            fontFamily: {
                // Match backend sans-serif clean look
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['Consolas', 'monospace'],
            },
            boxShadow: {
                'button': '0 10px 25px -5px rgba(59, 130, 246, 0.2)', // blue shadow for buttons
            },
        },
    },
    plugins: [],
};
