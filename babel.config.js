module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
            'nativewind/babel',
        ],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./src'],
                    alias: {
                        '@services': './src/services',
                        '@components': './src/components',
                        '@screens': './src/screens',
                        '@stores': './src/stores',
                        '@config': './src/config',
                        '@utils': './src/utils',
                        '@hooks': './src/hooks',
                        '@types': './src/types',
                    },
                },
            ],
            'react-native-reanimated/plugin', // PHẢI ĐỂ CUỐI CÙNG
        ],
    };
};
