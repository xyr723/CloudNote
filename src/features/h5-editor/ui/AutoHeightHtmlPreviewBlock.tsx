import React, {useEffect, useState} from 'react';
import {StyleSheet} from 'react-native';
import {WebView, type WebViewMessageEvent} from 'react-native-webview';
import type {RichDocument} from '../../../entities/document/types';
import {providerRegistry} from '../../../providers/providerRegistry';
import type {ThemeColors} from '../../../shared/theme/colors';
import type {PreviewHtmlBlock} from '../model/previewDocumentSegments';

type AutoHeightHtmlPreviewBlockProps = {
  blocks: PreviewHtmlBlock[];
  theme: ThemeColors;
};

const createPreviewHtml = (content: string, theme: ThemeColors): string => {
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        margin: 0;
        padding: 0;
        background: ${theme.background};
        color: ${theme.textDark};
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 16px;
        line-height: 1.7;
      }
    </style>
  </head>
  <body>
    <div id="preview-root">${content}</div>
    <script>
      (function () {
        var postHeight = function () {
          if (!window.ReactNativeWebView) {
            return;
          }

          var root = document.getElementById('preview-root');
          var height = root ? Math.ceil(root.scrollHeight) : 0;

          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'content-height',
              height: height,
            }),
          );
        };

        window.addEventListener('load', postHeight);
        setTimeout(postHeight, 0);
      })();
    </script>
  </body>
</html>`;
};

const isHeightMessage = (data: string): number | null => {
  try {
    const message = JSON.parse(data) as {
      height?: unknown;
      type?: unknown;
    };

    if (
      message.type === 'content-height' &&
      typeof message.height === 'number' &&
      Number.isFinite(message.height) &&
      message.height > 0
    ) {
      return message.height;
    }
  } catch (error) {
    console.error('Failed to parse preview height message', error);
  }

  return null;
};

export const AutoHeightHtmlPreviewBlock: React.FC<
  AutoHeightHtmlPreviewBlockProps
> = ({blocks, theme}) => {
  const [contentHeight, setContentHeight] = useState<number>(1);
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isActive = true;

    const renderSegment = async (): Promise<void> => {
      setIsLoading(true);

      const document: RichDocument = {
        version: '1.0',
        blocks,
      };
      const content = await providerRegistry.getEditorProvider().renderHtml(document);

      if (!isActive) {
        return;
      }

      setHtml(createPreviewHtml(content, theme));
      setIsLoading(false);
    };

    renderSegment().catch(error => {
      console.error('Failed to render preview segment html', error);

      if (!isActive) {
        return;
      }

      setHtml(createPreviewHtml('', theme));
      setIsLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [blocks, theme]);

  const handleMessage = (event: WebViewMessageEvent): void => {
    const nextHeight = isHeightMessage(event.nativeEvent.data);

    if (nextHeight === null) {
      return;
    }

    setContentHeight(nextHeight);
  };

  return (
    <WebView
      originWhitelist={['*']}
      onMessage={handleMessage}
      scrollEnabled={false}
      source={{html}}
      startInLoadingState={isLoading}
      style={[styles.webView, {height: contentHeight}]}
    />
  );
};

const styles = StyleSheet.create({
  webView: {
    backgroundColor: 'transparent',
    width: '100%',
  },
});
