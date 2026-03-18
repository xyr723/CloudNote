import React from 'react';
import {generateThemeColors} from '../../../shared/theme/colors';
import type {NoteEditorController} from '../model/useNoteEditorController';
import {EditNoteToolbar} from './EditNoteToolbar';
import {NoteImageEntryFlow} from './NoteImageEntryFlow';
import type {NoteEditorMode} from './NoteEditorModeSwitch';

type NoteEditorToolbarSectionProps = {
  editorMode: NoteEditorMode;
  controller: NoteEditorController;
  theme: ReturnType<typeof generateThemeColors>;
};

export const NoteEditorToolbarSection: React.FC<
  NoteEditorToolbarSectionProps
> = ({editorMode, controller, theme}) => {
  if (editorMode === 'preview') {
    return null;
  }

  const isH5 = editorMode === 'h5';
  const {actions, formatting, handleNoopAsync, media, recording} = controller;

  return (
    <NoteImageEntryFlow
      onCaptureImage={media.handleCamera}
      onPickImage={media.handleImagePicker}
      theme={theme}>
      {openImageOptions => (
        <EditNoteToolbar
          disableAiComplete={isH5}
          isAiThinking={actions.isAiThinking}
          isBold={formatting.isBold}
          isItalic={formatting.isItalic}
          isRecording={recording.isRecording}
          onAiComplete={isH5 ? handleNoopAsync : actions.handleAiComplete}
          onBoldToggle={
            isH5
              ? () => controller.handleQueueH5FormatCommand('bold')
              : formatting.handleBoldToggle
          }
          onDecreaseFontSize={formatting.handleDecreaseFontSize}
          onIncreaseFontSize={formatting.handleIncreaseFontSize}
          onRecordingToggle={recording.handleRecordingToggle}
          onShowImageOptions={openImageOptions}
          onToggleItalic={
            isH5
              ? () => controller.handleQueueH5FormatCommand('italic')
              : formatting.handleToggleItalic
          }
          selection={formatting.selection}
          textSegments={formatting.textSegments}
          theme={theme}
        />
      )}
    </NoteImageEntryFlow>
  );
};
