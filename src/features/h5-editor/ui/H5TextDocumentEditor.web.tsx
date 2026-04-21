import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {RichDocument} from '../../../entities/document/types';
import type {TextSegment} from '../../../entities/note/types';
import type {ThemeColors} from '../../../shared/theme/colors';
import {WidgetRenderer} from '../../widget-renderer/ui/WidgetRenderer';
import {
  replaceRichTextSegmentsState,
  toggleBoldForSelection,
  toggleItalicForSelection,
} from '../../note-editor/model/noteEditorFormattingUtils';
import type {
  H5TextEditorDeleteMediaPayload,
  H5TextEditorFormatCommand,
  H5TextEditorMediaInsertRequestEvent,
  H5TextEditorSelectionPayload,
  H5TextEditorState,
  H5WidgetBridgeEvent,
} from '../model/h5TextEditorBridge';

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

type MarkerItem = {
  index: number;
  kind: 'image' | 'audio';
};

const extractMarkers = (content: string): MarkerItem[] => {
  const markers: MarkerItem[] = [];
  const matcher = /\[(图片|音频)(\d+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(content)) !== null) {
    markers.push({
      index: parseInt(match[2] ?? '0', 10),
      kind: match[1] === '图片' ? 'image' : 'audio',
    });
  }

  return markers;
};

const createNextTextSegments = ({
  content,
  fallbackFontSize,
  textSegments,
}: {
  content: string;
  fallbackFontSize: number;
  textSegments?: TextSegment[];
}): TextSegment[] => {
  return replaceRichTextSegmentsState({
    content,
    fallbackFontSize,
    textSegments,
  });
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
  const [selection, setSelection] = useState({start: 0, end: 0});
  const lastAppliedFormatCommandIdRef = useRef<number | null>(
    formatCommand?.id ?? null,
  );
  const markers = useMemo(() => extractMarkers(content), [content]);

  useEffect(() => {
    if (
      !formatCommand ||
      formatCommand.id === lastAppliedFormatCommandIdRef.current
    ) {
      return;
    }

    lastAppliedFormatCommandIdRef.current = formatCommand.id;

    const nextTextSegments = createNextTextSegments({
      content,
      fallbackFontSize: fontSize,
      textSegments,
    });
    const nextState =
      formatCommand.type === 'bold'
        ? toggleBoldForSelection(nextTextSegments, selection)
        : toggleItalicForSelection(nextTextSegments, selection);

    if (!nextState) {
      return;
    }

    onChangeState?.(nextState);
  }, [content, fontSize, formatCommand, onChangeState, selection, textSegments]);

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      style={styles.container}>
      <View style={styles.toolbarRow}>
        <TouchableOpacity
          testID="web-h5-media-pick-image"
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          onPress={() =>
            onMediaInsertRequest?.({
              type: 'media-insert-request',
              action: 'pick-image',
            })
          }>
          <Text style={[styles.actionButtonText, {color: theme.text}]}>
            插入图片
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          onPress={() =>
            onMediaInsertRequest?.({
              type: 'media-insert-request',
              action: 'capture-image',
            })
          }>
          <Text style={[styles.actionButtonText, {color: theme.text}]}>
            拍照
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          onPress={() =>
            onMediaInsertRequest?.({
              type: 'media-insert-request',
              action: 'record-audio',
            })
          }>
          <Text style={[styles.actionButtonText, {color: theme.text}]}>
            录音
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        multiline
        testID="web-h5-editor-input"
        style={[
          styles.contentInput,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.text,
            fontSize,
          },
        ]}
        placeholder="请输入正文"
        placeholderTextColor={theme.textLight}
        value={content}
        onChangeText={nextContent => {
          onChangeState?.({
            content: nextContent,
            textSegments: createNextTextSegments({
              content: nextContent,
              fallbackFontSize: fontSize,
              textSegments,
            }),
          });
        }}
        onSelectionChange={event => {
          const nextSelection = event.nativeEvent.selection;

          setSelection(nextSelection);
          onSelectionChange?.(nextSelection, nextSelection.start);
        }}
      />

      {markers.length > 0 ? (
        <View style={styles.markerList}>
          {markers.map(marker => (
            <TouchableOpacity
              key={`${marker.kind}-${marker.index}`}
              testID={`web-h5-delete-${marker.kind}-${marker.index}`}
              style={[
                styles.markerButton,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.borderLight,
                },
              ]}
              onPress={() =>
                onDeleteMedia?.({
                  kind: marker.kind,
                  index: marker.index,
                })
              }>
              <Text style={[styles.markerButtonText, {color: theme.textDark}]}>
                {marker.kind === 'image'
                  ? `删除图片占位 ${marker.index + 1}`
                  : `删除音频占位 ${marker.index + 1}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <TouchableOpacity
        testID="web-h5-widget-insert-root"
        style={[
          styles.insertButton,
          {
            backgroundColor: theme.background,
            borderColor: theme.border,
          },
        ]}
        onPress={() =>
          onWidgetEvent?.({
            type: 'widget-insert-request',
            afterBlockId: null,
          })
        }>
        <Text style={[styles.insertButtonText, {color: theme.text}]}>
          在开头插入组件
        </Text>
      </TouchableOpacity>

      {(document?.blocks ?? []).map(block => {
        if (block.type === 'widget') {
          return (
            <View
              key={block.id}
              style={[
                styles.blockCard,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}>
              <WidgetRenderer theme={theme} widget={block.widget} />
              <View style={styles.widgetActionRow}>
                <TouchableOpacity
                  testID={`web-h5-widget-edit-${block.id}`}
                  style={[
                    styles.inlineActionButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.borderLight,
                    },
                  ]}
                  onPress={() =>
                    onWidgetEvent?.({
                      type: 'widget-edit-request',
                      blockId: block.id,
                      widgetId: block.widget.id,
                      widgetType: block.widget.type,
                    })
                  }>
                  <Text
                    style={[styles.inlineActionButtonText, {color: theme.text}]}>
                    编辑组件
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.inlineActionButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.borderLight,
                    },
                  ]}
                  onPress={() =>
                    onWidgetEvent?.({
                      type: 'widget-delete',
                      blockId: block.id,
                      widgetId: block.widget.id,
                      widgetType: block.widget.type,
                    })
                  }>
                  <Text
                    style={[styles.inlineActionButtonText, {color: theme.text}]}>
                    删除组件
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.inlineActionButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.borderLight,
                    },
                  ]}
                  onPress={() =>
                    onWidgetEvent?.({
                      type: 'widget-move',
                      blockId: block.id,
                      widgetId: block.widget.id,
                      widgetType: block.widget.type,
                      direction: 'up',
                    })
                  }>
                  <Text
                    style={[styles.inlineActionButtonText, {color: theme.text}]}>
                    上移
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.inlineActionButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.borderLight,
                    },
                  ]}
                  onPress={() =>
                    onWidgetEvent?.({
                      type: 'widget-move',
                      blockId: block.id,
                      widgetId: block.widget.id,
                      widgetType: block.widget.type,
                      direction: 'down',
                    })
                  }>
                  <Text
                    style={[styles.inlineActionButtonText, {color: theme.text}]}>
                    下移
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                testID={`web-h5-widget-insert-after-${block.id}`}
                style={[
                  styles.insertButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.borderLight,
                  },
                ]}
                onPress={() =>
                  onWidgetEvent?.({
                    type: 'widget-insert-request',
                    afterBlockId: block.id,
                  })
                }>
                <Text
                  style={[styles.insertButtonText, {color: theme.textLight}]}>
                  在此后插入组件
                </Text>
              </TouchableOpacity>
            </View>
          );
        }

        return (
          <View
            key={block.id}
            style={[
              styles.blockCard,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}>
            {block.type === 'list' ? (
              <View style={styles.listBlock}>
                {block.items.map((item, itemIndex) => (
                  <Text
                    key={`${block.id}-${itemIndex}`}
                    style={[styles.blockText, {color: theme.textDark}]}>
                    {block.ordered ? `${itemIndex + 1}. ${item}` : `• ${item}`}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={[styles.blockText, {color: theme.textDark}]}>
                {block.text}
              </Text>
            )}
            <TouchableOpacity
              testID={`web-h5-widget-insert-after-${block.id}`}
              style={[
                styles.insertButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.borderLight,
                },
              ]}
              onPress={() =>
                onWidgetEvent?.({
                  type: 'widget-insert-request',
                  afterBlockId: block.id,
                })
              }>
              <Text style={[styles.insertButtonText, {color: theme.textLight}]}>
                在此后插入组件
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  blockCard: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  blockText: {
    fontSize: 15,
    lineHeight: 22,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    gap: 12,
    padding: 12,
  },
  contentInput: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 220,
    padding: 16,
    textAlignVertical: 'top',
  },
  inlineActionButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inlineActionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listBlock: {
    gap: 6,
  },
  insertButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  insertButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  markerButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  markerButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  markerList: {
    gap: 8,
  },
  toolbarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  widgetActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
