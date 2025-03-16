const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const customConfig = {
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'md', 'json', 'svg'],
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
  },
  transformer: {
    minifierPath: 'metro-minify-esbuild',
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
};

module.exports = mergeConfig(defaultConfig, customConfig);

