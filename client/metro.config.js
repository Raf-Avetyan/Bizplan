const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");

const path = require('path');
const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer");

config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts.push("svg");
config.resolver.alias = {
  '@': path.resolve(__dirname, './'),
  '@assets': path.resolve(__dirname, './assets'),
  '@components': path.resolve(__dirname, './components'),
};

module.exports = wrapWithReanimatedMetroConfig(
  withNativeWind(config, { input: "./global.css" })
);