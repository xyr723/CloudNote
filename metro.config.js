const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const customConfig = {
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'md', 'json', 'svg'],
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
  },
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
};

module.exports = mergeConfig(defaultConfig, customConfig);
