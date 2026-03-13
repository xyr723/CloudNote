import React from 'react';
import EditNotePage from '../../../../app/components/EditNotePage';
import {generateThemeColors} from '../../../../app/theme/colors';
import type {TextSegment} from '../../../entities/note/types';
import type {NoteDraft} from '../model/noteDraft';

type HomeEditorModalProps = {
  currentNote: NoteDraft;
  isEditing: boolean;
  modalVisible: boolean;
  onChangeAudios: (audios: string[]) => void;
  onChangeContent: (text: string) => void;
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
    <EditNotePage
      visible={modalVisible}
      isEditing={isEditing}
      note={currentNote}
      onSave={onSave}
      onClose={onClose}
      onChangeTitle={onChangeTitle}
      onChangeContent={onChangeContent}
      onChangeImages={onChangeImages}
      onChangeAudios={onChangeAudios}
      onChangeFontSize={onChangeFontSize}
      onChangeTextSegments={onChangeTextSegments}
      theme={theme}
    />
  );
};
