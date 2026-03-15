import React from 'react';
import type {ContentToken} from '../model/noteEditorContentTokens';
import {EditNoteAudioBlock} from './EditNoteAudioBlock';
import {EditNoteImageBlock} from './EditNoteImageBlock';
import {EditNoteTextTokenInput} from './EditNoteTextTokenInput';
import type {
  EditableTextSegment,
  EditorSelection,
  NoteEditorTheme,
} from './types';

type EditNoteContentBlocksProps = {
  audios: string[];
  currentAudioIndex: number;
  images: string[];
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
  resolvedTextSegments: EditableTextSegment[];
  theme: NoteEditorTheme;
  tokens: ContentToken[];
};

export const EditNoteContentBlocks: React.FC<EditNoteContentBlocksProps> = ({
  audios,
  currentAudioIndex,
  images,
  isPlaying,
  onContentChange,
  onDeleteAudio,
  onDeleteImage,
  onPlayAudio,
  onSelectionChange,
  onTextSegmentsChange,
  resolvedTextSegments,
  theme,
  tokens,
}) => {
  return (
    <>
      {tokens.map((token, index) => {
        if (token.type === 'image') {
          if (!images[token.imageIndex]) {
            return null;
          }

          return (
            <EditNoteImageBlock
              key={`image-${token.imageIndex}-${index}`}
              imageIndex={token.imageIndex}
              imageUri={images[token.imageIndex]}
              onDelete={onDeleteImage}
            />
          );
        }

        if (token.type === 'audio') {
          if (!audios[token.audioIndex]) {
            return null;
          }

          return (
            <EditNoteAudioBlock
              key={`audio-${token.audioIndex}-${index}`}
              audioIndex={token.audioIndex}
              isActive={isPlaying && currentAudioIndex === token.audioIndex}
              onDelete={onDeleteAudio}
              onPlay={onPlayAudio}
              theme={theme}
            />
          );
        }

        return (
          <EditNoteTextTokenInput
            key={`text-${index}`}
            onContentChange={onContentChange}
            onSelectionChange={onSelectionChange}
            onTextSegmentsChange={onTextSegmentsChange}
            resolvedTextSegments={resolvedTextSegments}
            token={token}
            tokenIndex={index}
            tokens={tokens}
          />
        );
      })}
    </>
  );
};
