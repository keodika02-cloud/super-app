// Metro configuration for React Native with NativeWind v4
// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable NativeWind v4 CSS transformation
module.exports = withNativeWind(config, {
    input: './global.css',
});
