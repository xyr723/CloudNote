import React, {useEffect, useState} from 'react';
import type {RichDocument} from '../../../entities/document/types';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {NoteDraft} from '../../../entities/note/draft';
import type {TextSegment} from '../../../entities/note/types';
import {generateThemeColors} from '../../../shared/theme/colors';
import {useNoteEditorController} from '../model/useNoteEditorController';
import {useNoteDocumentMirror} from '../model/useNoteDocumentMirror';
import {useNoteWidgetEditing} from '../model/useNoteWidgetEditing';
import {EditNoteAuxiliaryModals} from './EditNoteAuxiliaryModals';
import {NoteEditorContentPane} from './NoteEditorContentPane';
import {
  NoteEditorModeSwitch,
  type NoteEditorMode,
} from './NoteEditorModeSwitch';
import {NoteEditorToolbarSection} from './NoteEditorToolbarSection';
import {WidgetEditorSheet} from '../../widget-editor/ui/WidgetEditorSheet';
import {WidgetTypePickerSheet} from '../../widget-editor/ui/WidgetTypePickerSheet';
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
  onChangeDocument?: (document: RichDocument) => void;
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
  onChangeDocument,
  onChangeFontSize,
  onChangeTextSegments,
  visible,
  theme,
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
  const actions = controller.actions;
  const h5WidgetInlinePanel =
    pendingWidgetInsert !== null || activeWidgetEditor !== null ? (
      <View
        testID="note-h5-widget-inline-panel"
        style={{
          gap: 12,
          marginTop: 12,
        }}>
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

              <NoteEditorModeSwitch
                editorMode={editorMode}
                onChangeMode={setEditorMode}
                theme={theme}
              />
              <NoteEditorContentPane
                editorMode={editorMode}
                controller={controller}
                draftDocument={draftDocument}
                h5WidgetInlinePanel={h5WidgetInlinePanel}
                onH5WidgetEvent={handleH5WidgetEvent}
                theme={theme}
              />
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
