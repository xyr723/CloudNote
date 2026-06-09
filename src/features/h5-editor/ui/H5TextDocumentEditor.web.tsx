import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import type {RichDocument} from '../../../entities/document/types';
import {
  applyTextBlockSnapshotsToDocument,
  createLiveNoteDocument,
} from '../../../entities/note/document';
import type {TextSegment} from '../../../entities/note/types';
import type {ThemeColors} from '../../../shared/theme/colors';
import {
  createH5TextEditorFormatScript,
  createH5TextEditorHtml,
  H5_TEXT_EDITOR_BRIDGE_MESSAGE_SOURCE,
  H5_TEXT_EDITOR_HOST_MESSAGE_SOURCE,
  parseH5TextEditorMessage,
  createH5TextEditorSyncScript,
  type H5TextEditorDeleteMediaPayload,
  type H5TextEditorFormatCommand,
  type H5TextEditorMediaInsertRequestEvent,
  type H5TextEditorSelectionPayload,
  type H5TextEditorState,
  type H5WidgetBridgeEvent,
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

type IframeWindow = {
  postMessage: (message: unknown, targetOrigin: string) => void;
};

type IframeHandle = {
  contentWindow?: IframeWindow | null;
} | null;

const createEditorHtml = ({
  content,
  document,
  fontSize,
  textSegments,
  theme,
}: {
  content: string;
  document?: RichDocument;
  fontSize: number;
  textSegments?: TextSegment[];
  theme: ThemeColors;
}) => {
  const bodyHtml = createH5TextEditorBodyHtml({
    content,
    document,
    textSegments,
    fallbackFontSize: fontSize,
    defaultTextColor: theme.text,
  });

  return {
    bodyHtml,
    html: createH5TextEditorHtml({
      bodyHtml,
      defaultTextColor: theme.text,
      fontSize,
      theme,
    }),
  };
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
  const initialHtml = useMemo(() => {
    return createEditorHtml({
      content,
      document,
      fontSize,
      textSegments,
      theme,
    }).html;
  }, []);
  const [html, setHtml] = useState<string>(initialHtml);
  const [isFrameReady, setIsFrameReady] = useState(false);
  const iframeRef = useRef<IframeHandle>(null);
  const textSegmentsSignature = useMemo(() => {
    return JSON.stringify(textSegments ?? null);
  }, [textSegments]);
  const documentSignature = useMemo(() => {
    return JSON.stringify(document ?? null);
  }, [document]);
  const themeSignature = useMemo(() => {
    return [
      theme.surface,
      theme.text,
      theme.textDark,
      theme.border,
      theme.primary,
    ].join('|');
  }, [theme]);
  const lastSyncedContentRef = useRef(content);
  const lastSyncedSegmentsRef = useRef(textSegmentsSignature);
  const lastSyncedDocumentRef = useRef(documentSignature);
  const lastAppliedFontSizeRef = useRef(fontSize);
  const lastThemeSignatureRef = useRef(themeSignature);
  const lastAppliedFormatCommandIdRef = useRef<number | null>(null);

  const postHostCommand = useCallback((script: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        source: H5_TEXT_EDITOR_HOST_MESSAGE_SOURCE,
        script,
      },
      '*',
    );
  }, []);

  useEffect(() => {
    const shouldSkipSync =
      isFrameReady &&
      content === lastSyncedContentRef.current &&
      textSegmentsSignature === lastSyncedSegmentsRef.current &&
      documentSignature === lastSyncedDocumentRef.current &&
      fontSize === lastAppliedFontSizeRef.current &&
      themeSignature === lastThemeSignatureRef.current;

    if (shouldSkipSync) {
      return;
    }

    const {bodyHtml, html: nextHtml} = createEditorHtml({
      content,
      document,
      fontSize,
      textSegments,
      theme,
    });

    if (!isFrameReady) {
      setHtml(nextHtml);
    } else {
      postHostCommand(
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
    isFrameReady,
    postHostCommand,
    textSegments,
    textSegmentsSignature,
    theme,
    themeSignature,
  ]);

  useEffect(() => {
    if (
      !formatCommand ||
      !isFrameReady ||
      formatCommand.id === lastAppliedFormatCommandIdRef.current
    ) {
      return;
    }

    postHostCommand(createH5TextEditorFormatScript(formatCommand));
    lastAppliedFormatCommandIdRef.current = formatCommand.id;
  }, [formatCommand, isFrameReady, postHostCommand]);

  const handleWindowMessage = useCallback(
    (event: {data?: unknown; source?: unknown}) => {
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      const bridgeData = event.data as {
        payload?: unknown;
        source?: unknown;
      };

      if (
        bridgeData.source !== H5_TEXT_EDITOR_BRIDGE_MESSAGE_SOURCE ||
        typeof bridgeData.payload !== 'string'
      ) {
        return;
      }

      const message = parseH5TextEditorMessage(bridgeData.payload);

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

      const nextDocument =
        applyTextBlockSnapshotsToDocument(document, message.textBlocks ?? []) ??
        createLiveNoteDocument({
          content: message.content,
          document,
        });

      lastSyncedContentRef.current = message.content;
      lastSyncedSegmentsRef.current = JSON.stringify(message.textSegments);
      lastSyncedDocumentRef.current = JSON.stringify(nextDocument);
      onChangeState?.({
        content: message.content,
        document: nextDocument,
        textSegments: message.textSegments,
      });
    },
    [
      document,
      onChangeState,
      onDeleteMedia,
      onMediaInsertRequest,
      onSelectionChange,
      onWidgetEvent,
    ],
  );

  useEffect(() => {
    const hostWindow = (
      globalThis as typeof globalThis & {
        window?: {
          addEventListener?: (
            type: string,
            listener: (event: {data?: unknown; source?: unknown}) => void,
          ) => void;
          removeEventListener?: (
            type: string,
            listener: (event: {data?: unknown; source?: unknown}) => void,
          ) => void;
        };
      }
    ).window;

    if (!hostWindow || typeof hostWindow.addEventListener !== 'function') {
      return;
    }

    hostWindow.addEventListener('message', handleWindowMessage);

    return () => {
      hostWindow.removeEventListener?.('message', handleWindowMessage);
    };
  }, [handleWindowMessage]);

  return (
    <View style={styles.container}>
      <iframe
        onLoad={() => {
          setIsFrameReady(true);
        }}
        ref={node => {
          iframeRef.current = node as IframeHandle;
        }}
        sandbox="allow-forms allow-same-origin allow-scripts"
        srcDoc={html}
        style={{
          backgroundColor: theme.surface,
          border: '0',
          flex: 1,
          height: '100%',
          width: '100%',
        }}
        data-testid="web-h5-editor-frame"
        title="CloudNote H5 Editor"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
