import React, {useCallback, useEffect, useState} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {NoteDraft} from '../../../entities/note/draft';
import type {TextSegment} from '../../../entities/note/types';
import {generateThemeColors} from '../../../shared/theme/colors';
import {useNoteEditorActions} from '../model/useNoteEditorActions';
import {useNoteFormatting} from '../model/useNoteFormatting';
import {useNoteMedia} from '../model/useNoteMedia';
import {useAudioPlayback} from '../model/useAudioPlayback';
import {useNoteRecording} from '../model/useNoteRecording';
import {getTextSegmentsContent} from '../model/noteEditorTextSegments';
import {EditNoteAuxiliaryModals} from './EditNoteAuxiliaryModals';
import {EditNoteContent} from './EditNoteContent';
import {EditNoteToolbar} from './EditNoteToolbar';
import {NoteImageEntryFlow} from './NoteImageEntryFlow';
import {NoteEditorPreviewPane} from './NoteEditorPreviewPane';
import {H5TextDocumentEditor} from '../../h5-editor/ui/H5TextDocumentEditor';
import type {H5TextEditorFormatCommand} from '../../h5-editor/model/h5TextEditorBridge';
import {styles} from './styles';

export interface NoteEditorModalProps {
  visible: boolean;
  isEditing: boolean;
  note: NoteDraft;
  onSave: () => Promise<void>;
  onClose: () => void;
  onChangeTitle: (text: string) => void;
  onChangeContent: (text: string) => void;
  onChangeImages?: (images: string[]) => void;
  onChangeAudios?: (audios: string[]) => void;
  onChangeFontSize?: (size: number) => void;
  onChangeTextSegments?: (segments: TextSegment[]) => void;
  theme: ReturnType<typeof generateThemeColors>;
}

const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isEditing,
  note,
  onSave,
  onClose,
  onChangeTitle,
  onChangeContent,
  onChangeImages,
  onChangeAudios,
  onChangeFontSize,
  onChangeTextSegments,
  visible,
  theme,
}) => {
  const [tempNoteId] = useState(
    () => `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
  );
  const [editorMode, setEditorMode] = useState<'native' | 'h5' | 'preview'>(
    'native',
  );
  const [h5FormatCommand, setH5FormatCommand] =
    useState<H5TextEditorFormatCommand | null>(null);

  useEffect(() => {
    if (!visible) {
      setEditorMode('native');
      setH5FormatCommand(null);
    }
  }, [visible]);

  const handleQueueH5FormatCommand = useCallback(
    (type: H5TextEditorFormatCommand['type']) => {
      setH5FormatCommand(currentCommand => ({
        id: (currentCommand?.id ?? 0) + 1,
        type,
      }));
    },
    [],
  );
  const handleNoopAsync = useCallback(async () => {}, []);

  const formatting = useNoteFormatting({
    note,
    onChangeContent,
    onChangeFontSize,
    onChangeTextSegments,
  });
  const editorContent = getTextSegmentsContent(formatting.textSegments);
  const media = useNoteMedia({
    content: editorContent,
    cursorPosition: formatting.cursorPosition,
    fontSize: formatting.fontSize,
    note,
    onChangeAudios,
    onChangeContent,
    onChangeImages,
    onChangeTextSegments: formatting.applyTextSegmentsChange,
    tempNoteId,
    textSegments: formatting.textSegments,
  });
  const recording = useNoteRecording({
    applyAudiosChange: media.applyAudiosChange,
    applyContentChange: media.applyContentChange,
    applyTextSegmentsChange: formatting.applyTextSegmentsChange,
    audios: media.audios,
    content: editorContent,
    cursorPosition: formatting.cursorPosition,
    fontSize: formatting.fontSize,
    noteId: note.id,
    textSegments: formatting.textSegments,
    tempNoteId,
  });
  const playback = useAudioPlayback({
    audios: media.audios,
  });
  const actions = useNoteEditorActions({
    audiosCount: media.audios.length,
    content: editorContent,
    imagesCount: media.images.length,
    onAppendText: formatting.handleAppendText,
    onSave,
    title: note.title,
  });

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
                onPress={actions.handleSaveWithValidation}>
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
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  },
                ]}
                placeholder="标题"
                placeholderTextColor={theme.textLight}
                value={note.title}
                onChangeText={onChangeTitle}
              />

              <View
                style={[
                  styles.modeSwitch,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}>
                <TouchableOpacity
                  style={[
                    styles.modeSwitchButton,
                    editorMode === 'native' && {
                      backgroundColor: theme.primary,
                    },
                  ]}
                  onPress={() => setEditorMode('native')}>
                  <Text
                    style={[
                      styles.modeSwitchButtonText,
                      {
                        color:
                          editorMode === 'native' ? theme.surface : theme.text,
                      },
                    ]}>
                    原生
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeSwitchButton,
                    editorMode === 'h5' && {
                      backgroundColor: theme.primary,
                    },
                  ]}
                  onPress={() => setEditorMode('h5')}>
                  <Text
                    style={[
                      styles.modeSwitchButtonText,
                      {
                        color:
                          editorMode === 'h5' ? theme.surface : theme.text,
                      },
                    ]}>
                    H5
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeSwitchButton,
                    editorMode === 'preview' && {
                      backgroundColor: theme.primary,
                    },
                  ]}
                  onPress={() => setEditorMode('preview')}>
                  <Text
                    style={[
                      styles.modeSwitchButtonText,
                      {
                        color:
                          editorMode === 'preview'
                            ? theme.surface
                            : theme.text,
                      },
                    ]}>
                    预览
                  </Text>
                </TouchableOpacity>
              </View>

              {editorMode === 'native' ? (
                <ScrollView style={styles.contentScroll}>
                  <View
                    style={[
                      styles.contentContainer,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}>
                    <EditNoteContent
                      audios={media.audios}
                      content={editorContent}
                      currentAudioIndex={playback.currentAudioIndex}
                      fontSize={formatting.fontSize}
                      images={media.images}
                      isBold={formatting.isBold}
                      isItalic={formatting.isItalic}
                      isPlaying={playback.isPlaying}
                      onContentChange={media.applyContentChange}
                      onDeleteAudio={media.handleDeleteAudio}
                      onDeleteImage={media.handleDeleteImage}
                      onPlayAudio={playback.handlePlayAudio}
                      onSelectionChange={formatting.handleEditorSelectionChange}
                      onTextSegmentsChange={formatting.applyTextSegmentsChange}
                      textSegments={formatting.textSegments}
                      theme={theme}
                    />
                  </View>
                </ScrollView>
              ) : editorMode === 'h5' ? (
                <View
                  style={[
                    styles.contentContainer,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}>
                  <H5TextDocumentEditor
                    content={editorContent}
                    formatCommand={h5FormatCommand ?? undefined}
                    fontSize={formatting.fontSize}
                    onChangeState={formatting.handleReplaceRichTextContent}
                    onSelectionChange={formatting.handleEditorSelectionChange}
                    onDeleteMedia={({kind, index}) => {
                      if (kind === 'image') {
                        media.handleDeleteImage(index);
                        return;
                      }

                      media.handleDeleteAudio(index);
                    }}
                    textSegments={formatting.textSegments}
                    theme={theme}
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.contentContainer,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}>
                  <NoteEditorPreviewPane content={editorContent} theme={theme} />
                </View>
              )}

              {editorMode === 'native' ? (
                <NoteImageEntryFlow
                  onCaptureImage={media.handleCamera}
                  onPickImage={media.handleImagePicker}
                  theme={theme}>
                  {openImageOptions => (
                    <EditNoteToolbar
                      isAiThinking={actions.isAiThinking}
                      isBold={formatting.isBold}
                      isItalic={formatting.isItalic}
                      isRecording={recording.isRecording}
                      onAiComplete={actions.handleAiComplete}
                      onBoldToggle={formatting.handleBoldToggle}
                      onDecreaseFontSize={formatting.handleDecreaseFontSize}
                      onIncreaseFontSize={formatting.handleIncreaseFontSize}
                      onRecordingToggle={recording.handleRecordingToggle}
                      onShowImageOptions={openImageOptions}
                      onToggleItalic={formatting.handleToggleItalic}
                      selection={formatting.selection}
                      textSegments={formatting.textSegments}
                      theme={theme}
                    />
                  )}
                </NoteImageEntryFlow>
              ) : editorMode === 'h5' ? (
                <NoteImageEntryFlow
                  onCaptureImage={media.handleCamera}
                  onPickImage={media.handleImagePicker}
                  theme={theme}>
                  {openImageOptions => (
                    <EditNoteToolbar
                      disableAiComplete
                      isAiThinking={actions.isAiThinking}
                      isBold={formatting.isBold}
                      isItalic={formatting.isItalic}
                      isRecording={recording.isRecording}
                      onAiComplete={handleNoopAsync}
                      onBoldToggle={() => handleQueueH5FormatCommand('bold')}
                      onDecreaseFontSize={formatting.handleDecreaseFontSize}
                      onIncreaseFontSize={formatting.handleIncreaseFontSize}
                      onRecordingToggle={recording.handleRecordingToggle}
                      onShowImageOptions={openImageOptions}
                      onToggleItalic={() => handleQueueH5FormatCommand('italic')}
                      selection={formatting.selection}
                      textSegments={formatting.textSegments}
                      theme={theme}
                    />
                  )}
                </NoteImageEntryFlow>
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>

      <EditNoteAuxiliaryModals
        isSaving={actions.isSaving}
        onCloseValidation={actions.handleCloseValidation}
        showAiThinkingModal={actions.showAiThinkingModal}
        showValidationModal={actions.showValidationModal}
        theme={theme}
        validationMessage={actions.validationMessage}
      />
    </Modal>
  );
};

export default NoteEditorModal;
