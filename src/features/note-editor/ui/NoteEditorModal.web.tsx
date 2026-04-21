import React, {useEffect, useState} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {RichDocument} from '../../../entities/document/types';
import {generateThemeColors} from '../../../shared/theme/colors';
import {H5TextDocumentEditor} from '../../h5-editor/ui/H5TextDocumentEditor.web';
import {WidgetRenderer} from '../../widget-renderer/ui/WidgetRenderer';
import {WidgetEditorSheet} from '../../widget-editor/ui/WidgetEditorSheet';
import {WidgetTypePickerSheet} from '../../widget-editor/ui/WidgetTypePickerSheet';
import {useNoteDocumentMirror} from '../model/useNoteDocumentMirror';
import {useNoteEditorController} from '../model/useNoteEditorController';
import {useNoteWidgetEditing} from '../model/useNoteWidgetEditing';
import {EditNoteAuxiliaryModals} from './EditNoteAuxiliaryModals';
import {
  NoteEditorModeSwitch,
  type NoteEditorMode,
} from './NoteEditorModeSwitch';
import {NoteEditorToolbarSection} from './NoteEditorToolbarSection';
import type {NoteEditorModalProps} from './NoteEditorModal';
import {styles} from './styles';

type WebDocumentPreviewProps = {
  document: RichDocument;
  theme: ReturnType<typeof generateThemeColors>;
};

const WebDocumentPreview: React.FC<WebDocumentPreviewProps> = ({
  document,
  theme,
}) => {
  if (document.blocks.length === 0) {
    return (
      <View
        style={[
          webStyles.previewEmptyState,
          {
            backgroundColor: theme.background,
            borderColor: theme.border,
          },
        ]}>
        <Text style={[webStyles.previewEmptyStateText, {color: theme.textLight}]}>
          暂无可预览内容
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={webStyles.previewContentContainer}
      style={webStyles.previewContainer}>
      {document.blocks.map(block => {
        if (block.type === 'widget') {
          return (
            <View key={block.id} style={webStyles.previewSegment}>
              <WidgetRenderer theme={theme} widget={block.widget} />
            </View>
          );
        }

        return (
          <View
            key={block.id}
            style={[
              webStyles.previewTextBlock,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}>
            {block.type === 'list' ? (
              <View style={webStyles.previewListBlock}>
                {block.items.map((item, itemIndex) => (
                  <Text
                    key={`${block.id}-${itemIndex}`}
                    style={[webStyles.previewText, {color: theme.textDark}]}>
                    {block.ordered ? `${itemIndex + 1}. ${item}` : `• ${item}`}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={[webStyles.previewText, {color: theme.textDark}]}>
                {block.text}
              </Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isEditing,
  note,
  onChangeAudios,
  onChangeContent,
  onChangeDocument,
  onChangeFontSize,
  onChangeImages,
  onChangeTextSegments,
  onChangeTitle,
  onClose,
  onSave,
  theme,
  visible,
}) => {
  const [editorMode, setEditorMode] = useState<NoteEditorMode>('native');
  const {
    draftDocument,
    getCurrentDocument,
    handleAppendWidgets,
    handleApplyDocumentChange,
    handleMirrorContentChange,
  } = useNoteDocumentMirror({
    noteContent: note.content,
    noteDocument: note.document,
    onChangeDocument,
    visible,
  });
  const {
    activeWidgetEditor,
    handleCloseWidgetEditor,
    handleCloseWidgetTypePicker,
    handleDeleteActiveWidget,
    handleH5WidgetEvent,
    handleSaveWidget,
    handleSelectWidgetType,
    pendingWidgetInsert,
  } = useNoteWidgetEditing({
    applyDocumentChange: handleApplyDocumentChange,
    getCurrentDocument,
    visible,
  });

  useEffect(() => {
    if (!visible) {
      setEditorMode('native');
    }
  }, [visible]);

  const controller = useNoteEditorController({
    visible,
    note,
    draftDocument,
    onSave,
    onChangeAudios,
    onChangeContent,
    onChangeFontSize,
    onChangeImages,
    onChangeTextSegments,
    handleAppendWidgets,
    handleMirrorContentChange,
  });
  const h5WidgetInlinePanel =
    pendingWidgetInsert !== null || activeWidgetEditor !== null ? (
      <View
        testID="note-h5-widget-inline-panel"
        style={webStyles.h5WidgetInlinePanel}>
        <WidgetTypePickerSheet
          visible={pendingWidgetInsert !== null}
          onClose={handleCloseWidgetTypePicker}
          onSelect={handleSelectWidgetType}
          theme={theme}
        />
        <WidgetEditorSheet
          visible={activeWidgetEditor !== null}
          mode={activeWidgetEditor?.mode ?? 'edit'}
          widget={activeWidgetEditor?.widget ?? null}
          onClose={handleCloseWidgetEditor}
          onDelete={handleDeleteActiveWidget}
          onSave={handleSaveWidget}
          theme={theme}
        />
      </View>
    ) : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
        <SafeAreaView
          style={[styles.safeArea, {backgroundColor: theme.background}]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}>
            <View style={[styles.header, {backgroundColor: theme.primary}]}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={[styles.closeButtonText, {color: theme.surface}]}>
                  取消
                </Text>
              </TouchableOpacity>
              <Text style={[styles.headerTitle, {color: theme.surface}]}>
                {isEditing ? '编辑笔记' : '新建笔记'}
              </Text>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={controller.actions.handleSaveWithValidation}>
                <Text style={[styles.saveButtonText, {color: theme.surface}]}>
                  保存
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <TextInput
                style={[
                  styles.titleInput,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="标题"
                placeholderTextColor={theme.textLight}
                value={note.title}
                onChangeText={onChangeTitle}
              />

              <NoteEditorModeSwitch
                editorMode={editorMode}
                onChangeMode={setEditorMode}
                theme={theme}
              />

              {editorMode === 'native' ? (
                <TextInput
                  multiline
                  style={[
                    webStyles.contentInput,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="请输入正文"
                  placeholderTextColor={theme.textLight}
                  value={controller.editorContent}
                  onChangeText={controller.formatting.handleReplaceTextContent}
                  onSelectionChange={event => {
                    const {selection} = event.nativeEvent;
                    controller.formatting.handleEditorSelectionChange(
                      selection,
                      selection.start,
                    );
                  }}
                />
              ) : null}

              {editorMode === 'h5' ? (
                <View
                  style={[
                    webStyles.h5Container,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}>
                  <H5TextDocumentEditor
                    content={controller.editorContent}
                    document={draftDocument}
                    formatCommand={controller.h5FormatCommand ?? undefined}
                    fontSize={controller.formatting.fontSize}
                    onChangeState={controller.formatting.handleReplaceRichTextContent}
                    onMediaInsertRequest={controller.handleH5MediaInsertRequest}
                    onSelectionChange={
                      controller.formatting.handleEditorSelectionChange
                    }
                    onWidgetEvent={handleH5WidgetEvent}
                    onDeleteMedia={({kind, index}) => {
                      if (kind === 'image') {
                        controller.media.handleDeleteImage(index);
                        return;
                      }

                      controller.media.handleDeleteAudio(index);
                    }}
                    textSegments={controller.formatting.textSegments}
                    theme={theme}
                  />
                  {h5WidgetInlinePanel}
                </View>
              ) : null}

              {editorMode === 'preview' ? (
                <View
                  style={[
                    webStyles.previewPane,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}>
                  <WebDocumentPreview document={draftDocument} theme={theme} />
                </View>
              ) : null}

              <NoteEditorToolbarSection
                editorMode={editorMode}
                controller={controller}
                theme={theme}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>

      <EditNoteAuxiliaryModals
        isSaving={controller.actions.isSaving}
        onCloseValidation={controller.actions.handleCloseValidation}
        showAiThinkingModal={controller.actions.showAiThinkingModal}
        showValidationModal={controller.actions.showValidationModal}
        theme={theme}
        validationMessage={controller.actions.validationMessage}
      />
    </Modal>
  );
};

const webStyles = StyleSheet.create({
  contentInput: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 320,
    padding: 16,
    textAlignVertical: 'top',
  },
  h5Container: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  h5WidgetInlinePanel: {
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  previewContainer: {
    flex: 1,
  },
  previewContentContainer: {
    gap: 12,
    padding: 16,
  },
  previewEmptyState: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 240,
    paddingHorizontal: 16,
  },
  previewEmptyStateText: {
    fontSize: 14,
  },
  previewListBlock: {
    gap: 6,
  },
  previewPane: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  previewSegment: {
    marginBottom: 12,
  },
  previewText: {
    fontSize: 15,
    lineHeight: 22,
  },
  previewTextBlock: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
});

export default NoteEditorModal;
