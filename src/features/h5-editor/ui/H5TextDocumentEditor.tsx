import React, {useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet} from 'react-native';
import {
  WebView,
  type WebViewMessageEvent,
} from 'react-native-webview';
import type {TextSegment} from '../../../entities/note/types';
import {providerRegistry} from '../../../providers/providerRegistry';
import type {ThemeColors} from '../../../shared/theme/colors';
import {
  type H5TextEditorDeleteMediaPayload,
  createH5TextEditorFormatScript,
  createH5TextEditorHtml,
  createH5TextEditorSyncScript,
  parseH5TextEditorMessage,
  type H5TextEditorFormatCommand,
  type H5TextEditorSelectionPayload,
  type H5TextEditorState,
} from '../model/h5TextEditorBridge';
import {createH5TextEditorBodyHtml} from '../model/h5TextEditorMarkup';

type H5TextDocumentEditorProps = {
  content: string;
  formatCommand?: H5TextEditorFormatCommand;
  fontSize: number;
  onChangeContent?: (content: string) => void;
  onDeleteMedia?: (media: H5TextEditorDeleteMediaPayload) => void;
  onSelectionChange?: (
    selection: Pick<H5TextEditorSelectionPayload, 'start' | 'end'>,
    cursorPosition: number,
  ) => void;
  onChangeState?: (state: H5TextEditorState) => void;
  textSegments?: TextSegment[];
  theme: ThemeColors;
};

export const H5TextDocumentEditor: React.FC<H5TextDocumentEditorProps> = ({
  content,
  formatCommand,
  fontSize,
  onChangeContent,
  onDeleteMedia,
  onSelectionChange,
  onChangeState,
  textSegments,
  theme,
}) => {
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const webViewRef = useRef<WebView>(null);
  const hasInitializedRef = useRef<boolean>(false);
  const lastSyncedContentRef = useRef<string>(content);
  const textSegmentsSignature = useMemo(() => {
    return JSON.stringify(textSegments ?? null);
  }, [textSegments]);
  const lastSyncedSegmentsRef = useRef<string>(textSegmentsSignature);
  const lastAppliedFontSizeRef = useRef<number>(fontSize);
  const lastAppliedFormatCommandIdRef = useRef<number | null>(
    formatCommand?.id ?? null,
  );
  const themeSignature = useMemo(() => {
    return [
      theme.surface,
      theme.text,
      theme.textDark,
      theme.border,
      theme.primary,
    ].join('|');
  }, [theme]);
  const lastThemeSignatureRef = useRef<string>(themeSignature);

  useEffect(() => {
    let isActive = true;

    const syncEditor = async (): Promise<void> => {
      const shouldSkipSync =
        hasInitializedRef.current &&
        content === lastSyncedContentRef.current &&
        textSegmentsSignature === lastSyncedSegmentsRef.current &&
        fontSize === lastAppliedFontSizeRef.current &&
        themeSignature === lastThemeSignatureRef.current;

      if (shouldSkipSync) {
        return;
      }

      setIsLoading(true);

      const document = await providerRegistry.getEditorProvider().parse(content);
      await providerRegistry.getEditorProvider().renderHtml(document);
      const bodyHtml = createH5TextEditorBodyHtml({
        content,
        textSegments,
        fallbackFontSize: fontSize,
        defaultTextColor: theme.text,
      });

      if (!isActive) {
        return;
      }

      if (!hasInitializedRef.current) {
        setHtml(
          createH5TextEditorHtml({
            bodyHtml,
            defaultTextColor: theme.text,
            fontSize,
            theme,
          }),
        );
        hasInitializedRef.current = true;
      } else {
        webViewRef.current?.injectJavaScript(
          createH5TextEditorSyncScript({
            bodyHtml,
            defaultTextColor: theme.text,
            fontSize,
            theme,
          }),
        );
      }

      lastSyncedContentRef.current = content;
      lastSyncedSegmentsRef.current = textSegmentsSignature;
      lastAppliedFontSizeRef.current = fontSize;
      lastThemeSignatureRef.current = themeSignature;
      setIsLoading(false);
    };

    syncEditor().catch(error => {
      console.error('Failed to sync H5 text editor', error);

      if (!isActive) {
        return;
      }

      setIsLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [content, fontSize, textSegments, textSegmentsSignature, theme, themeSignature]);

  useEffect(() => {
    if (
      !formatCommand ||
      isLoading ||
      !hasInitializedRef.current ||
      formatCommand.id === lastAppliedFormatCommandIdRef.current
    ) {
      return;
    }

    webViewRef.current?.injectJavaScript(
      createH5TextEditorFormatScript(formatCommand),
    );
    lastAppliedFormatCommandIdRef.current = formatCommand.id;
  }, [formatCommand, isLoading]);

  const handleMessage = (event: WebViewMessageEvent): void => {
    const message = parseH5TextEditorMessage(event.nativeEvent.data);

    if (message.type !== 'content-change') {
      if (message.type === 'selection-change') {
        onSelectionChange?.(
          {
            start: message.start,
            end: message.end,
          },
          message.cursorPosition,
        );
      }

      if (message.type === 'media-delete') {
        onDeleteMedia?.({
          kind: message.kind,
          index: message.index,
        });
      }

      return;
    }

    lastSyncedContentRef.current = message.content;
    lastSyncedSegmentsRef.current = JSON.stringify(message.textSegments);
    onChangeState?.({
      content: message.content,
      textSegments: message.textSegments,
    });
    onChangeContent?.(message.content);
  };

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={['*']}
      onMessage={handleMessage}
      source={{html}}
      startInLoadingState={isLoading}
      style={styles.webView}
    />
  );
};

const styles = StyleSheet.create({
  webView: {
    flex: 1,
  },
});
