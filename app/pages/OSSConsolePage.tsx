import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { generateThemeColors } from '../theme/colors';

interface OSSConsolePageProps {
  theme: ReturnType<typeof generateThemeColors>;
}

const OSSConsolePage: React.FC<OSSConsolePageProps> = ({ theme }) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <WebView
        source={{ uri: 'https://oss.console.aliyun.com/bucket/oss-cn-beijing/native-123/object?path=note-audios%2F' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default OSSConsolePage; 