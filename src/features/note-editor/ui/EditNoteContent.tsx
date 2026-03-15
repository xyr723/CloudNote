import React from 'react';
import {View} from 'react-native';
import {buildContentTokens} from '../model/noteEditorContentTokens';
import {hasSyncedTextSegments} from '../model/noteEditorTextSegments';
import {EditNoteContentBlocks} from './EditNoteContentBlocks';
import {EditNoteEmptyStateInput} from './EditNoteEmptyStateInput';
import {styles} from './styles';
import type {
  EditableTextSegment,
  EditorSelection,
  NoteEditorTheme,
} from './types';

type EditNoteContentProps = {
  audios: string[];
  content: string;
  currentAudioIndex: number;
  fontSize: number;
  images: string[];
  isBold: boolean;
  isItalic: boolean;
  isPlaying: boolean;
  onContentChange: (content: string) => void;
  onDeleteAudio: (audioIndex: number) => void;
  onDeleteImage: (imageIndex: number) => void;
  onPlayAudio: (audioIndex: number) => void;
  onSelectionChange: (
    selection: EditorSelection,
    cursorPosition: number,
  ) => void;
  onTextSegmentsChange?: (segments: EditableTextSegment[]) => void;
  textSegments: EditableTextSegment[];
  theme: NoteEditorTheme;
};

export const EditNoteContent: React.FC<EditNoteContentProps> = ({
  audios,
  content,
  currentAudioIndex,
  fontSize,
  images,
  isBold,
  isItalic,
  isPlaying,
  onContentChange,
  onDeleteAudio,
  onDeleteImage,
  onPlayAudio,
  onSelectionChange,
  onTextSegmentsChange,
  textSegments,
  theme,
}) => {
  const resolvedTextSegments =
    hasSyncedTextSegments(textSegments, content)
      ? textSegments
      : [
          {
            text: content,
            fontSize,
            isBold,
            isItalic,
            color: theme.text,
          },
        ];
  const tokens = buildContentTokens({
    defaultFontSize: fontSize,
    defaultIsBold: isBold,
    defaultIsItalic: isItalic,
    defaultTextColor: theme.text,
    segments: resolvedTextSegments,
  });

  if (content.trim() === '' && images.length === 0 && audios.length === 0) {
    return (
      <View style={styles.contentWrapper}>
        <EditNoteEmptyStateInput
          fontSize={fontSize}
          isBold={isBold}
          isItalic={isItalic}
          onContentChange={onContentChange}
          onSelectionChange={onSelectionChange}
          placeholderTextColor={theme.textLight}
          textColor={theme.text}
        />
      </View>
    );
  }

  return (
    <View style={styles.contentWrapper}>
      <EditNoteContentBlocks
        audios={audios}
        currentAudioIndex={currentAudioIndex}
        images={images}
        isPlaying={isPlaying}
        onContentChange={onContentChange}
        onDeleteAudio={onDeleteAudio}
        onDeleteImage={onDeleteImage}
        onPlayAudio={onPlayAudio}
        onSelectionChange={onSelectionChange}
        onTextSegmentsChange={onTextSegmentsChange}
        resolvedTextSegments={resolvedTextSegments}
        theme={theme}
        tokens={tokens}
      />
    </View>
  );
};
