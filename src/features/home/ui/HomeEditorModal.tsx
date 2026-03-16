import React from 'react';
import type {NoteDraft} from '../../../entities/note/draft';
import type {RichDocument} from '../../../entities/document/types';
import {generateThemeColors} from '../../../shared/theme/colors';
import type {TextSegment} from '../../../entities/note/types';
import NoteEditorModal from '../../note-editor/ui/NoteEditorModal';

type HomeEditorModalProps = {
  currentNote: NoteDraft;
  isEditing: boolean;
  modalVisible: boolean;
  onChangeAudios: (audios: string[]) => void;
  onChangeContent: (text: string) => void;
  onChangeDocument: (document: RichDocument) => void;
  onChangeFontSize: (fontSize: number) => void;
  onChangeImages: (images: string[]) => void;
  onChangeTextSegments: (segments: TextSegment[]) => void;
  onChangeTitle: (text: string) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  theme: ReturnType<typeof generateThemeColors>;
};

export const HomeEditorModal: React.FC<HomeEditorModalProps> = ({
  currentNote,
  isEditing,
  modalVisible,
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
}) => {
  if (!modalVisible) {
    return null;
  }

  return (
    <NoteEditorModal
      visible={modalVisible}
      isEditing={isEditing}
      note={currentNote}
      onSave={onSave}
      onClose={onClose}
      onChangeTitle={onChangeTitle}
      onChangeContent={onChangeContent}
      onChangeImages={onChangeImages}
      onChangeAudios={onChangeAudios}
      onChangeDocument={onChangeDocument}
      onChangeFontSize={onChangeFontSize}
      onChangeTextSegments={onChangeTextSegments}
      theme={theme}
    />
  );
};
