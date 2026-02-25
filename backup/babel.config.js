module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
            'nativewind/babel',
        ],
        plugins: [
            // Reanimated plugin must be last!
            [
                'react-native-reanimated/plugin',
                {
                    // Disable strict mode to suppress warnings about shared values during render
                    relativeSourceLocation: true,
                },
            ],
        ],
    };
};
