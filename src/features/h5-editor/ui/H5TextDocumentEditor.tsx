import React, {useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet} from 'react-native';
import {
  WebView,
  type WebViewMessageEvent,
} from 'react-native-webview';
import type {RichDocument} from '../../../entities/document/types';
import {extractWidgetBlocks} from '../../../entities/note/document';
import type {TextSegment} from '../../../entities/note/types';
import type {ThemeColors} from '../../../shared/theme/colors';
import {
  type H5TextEditorDeleteMediaPayload,
  createH5TextEditorFormatScript,
  createH5TextEditorHtml,
  createH5TextEditorSyncScript,
  type H5TextEditorMediaInsertRequestEvent,
  type H5WidgetBridgeEvent,
  parseH5TextEditorMessage,
  type H5TextEditorFormatCommand,
  type H5TextEditorSelectionPayload,
  type H5TextEditorState,
} from '../model/h5TextEditorBridge';
import {createH5TextEditorBodyHtml} from '../model/h5TextEditorMarkup';

type H5TextDocumentEditorProps = {
  content: string;
  document?: RichDocument;
  formatCommand?: H5TextEditorFormatCommand;
  fontSize: number;
  onDeleteMedia?: (media: H5TextEditorDeleteMediaPayload) => void;
  onMediaInsertRequest?: (event: H5TextEditorMediaInsertRequestEvent) => void;
  onSelectionChange?: (
    selection: Pick<H5TextEditorSelectionPayload, 'start' | 'end'>,
    cursorPosition: number,
  ) => void;
  onChangeState?: (state: H5TextEditorState) => void;
  onWidgetEvent?: (event: H5WidgetBridgeEvent) => void;
  textSegments?: TextSegment[];
  theme: ThemeColors;
};

export const H5TextDocumentEditor: React.FC<H5TextDocumentEditorProps> = ({
  content,
  document,
  formatCommand,
  fontSize,
  onDeleteMedia,
  onMediaInsertRequest,
  onSelectionChange,
  onChangeState,
  onWidgetEvent,
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
  const documentSignature = useMemo(() => {
    return JSON.stringify(extractWidgetBlocks(document));
  }, [document]);
  const lastSyncedSegmentsRef = useRef<string>(textSegmentsSignature);
  const lastSyncedDocumentRef = useRef<string>(documentSignature);
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
    const shouldSkipSync =
      hasInitializedRef.current &&
      content === lastSyncedContentRef.current &&
      textSegmentsSignature === lastSyncedSegmentsRef.current &&
      documentSignature === lastSyncedDocumentRef.current &&
      fontSize === lastAppliedFontSizeRef.current &&
      themeSignature === lastThemeSignatureRef.current;

    if (shouldSkipSync) {
      return;
    }

    const bodyHtml = createH5TextEditorBodyHtml({
      content,
      document,
      textSegments,
      fallbackFontSize: fontSize,
      defaultTextColor: theme.text,
    });

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
      setIsLoading(false);
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
    lastSyncedDocumentRef.current = documentSignature;
    lastAppliedFontSizeRef.current = fontSize;
    lastThemeSignatureRef.current = themeSignature;
  }, [
    content,
    document,
    documentSignature,
    fontSize,
    textSegments,
    textSegmentsSignature,
    theme,
    themeSignature,
  ]);

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

    if (message.type === 'selection-change') {
      onSelectionChange?.(
        {
          start: message.start,
          end: message.end,
        },
        message.cursorPosition,
      );
      return;
    }

    if (message.type === 'media-delete') {
      onDeleteMedia?.({
        kind: message.kind,
        index: message.index,
      });
      return;
    }

    if (message.type === 'media-insert-request') {
      onMediaInsertRequest?.(message);
      return;
    }

    if (
      message.type === 'widget-edit-request' ||
      message.type === 'widget-delete' ||
      message.type === 'widget-move' ||
      message.type === 'widget-reorder-request' ||
      message.type === 'widget-insert-request'
    ) {
      onWidgetEvent?.(message);
      return;
    }

    if (message.type !== 'content-change') {
      return;
    }

    lastSyncedContentRef.current = message.content;
    lastSyncedSegmentsRef.current = JSON.stringify(message.textSegments);
    onChangeState?.({
      content: message.content,
      textSegments: message.textSegments,
    });
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
