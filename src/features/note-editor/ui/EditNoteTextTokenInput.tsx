import React from 'react';
import {TextInput} from 'react-native';
import type {StyleProp, TextStyle} from 'react-native';
import {
  getTokenOffsetBeforeIndex,
  type ContentToken,
  type TextToken,
} from '../model/noteEditorContentTokens';
import {getTextSegmentsContent} from '../model/noteEditorTextSegments';
import {styles} from './styles';
import type {
  EditableTextSegment,
  EditorSelection,
  NoteEditorTextChangeState,
} from './types';

type EditNoteTextTokenInputProps = {
  onChangeState?: (state: NoteEditorTextChangeState) => void;
  onContentChange: (content: string) => void;
  onSelectionChange: (
    selection: EditorSelection,
    cursorPosition: number,
  ) => void;
  onTextSegmentsChange?: (segments: EditableTextSegment[]) => void;
  resolvedTextSegments: EditableTextSegment[];
  token: TextToken;
  tokenIndex: number;
  tokens: ContentToken[];
};

export const createTextInputStyle = ({
  fontSize,
  isBold,
  isItalic,
  textColor,
}: {
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  textColor: string;
}): StyleProp<TextStyle> => {
  const fontWeight: TextStyle['fontWeight'] = isBold ? 'bold' : 'normal';
  const fontStyle: TextStyle['fontStyle'] = isItalic ? 'italic' : 'normal';

  return [
    styles.textContent,
    {
      fontSize,
      fontWeight,
      fontStyle,
      color: textColor,
      padding: 8,
      margin: 0,
      textAlignVertical: 'top' as const,
    },
  ];
};

export const EditNoteTextTokenInput: React.FC<EditNoteTextTokenInputProps> = ({
  onChangeState,
  onContentChange,
  onSelectionChange,
  onTextSegmentsChange,
  resolvedTextSegments,
  token,
  tokenIndex,
  tokens,
}) => {
  return (
    <TextInput
      style={createTextInputStyle({
        fontSize: token.fontSize,
        isBold: token.isBold,
        isItalic: token.isItalic,
        textColor: token.color,
      })}
      value={token.text}
      onChangeText={text => {
        const nextTextSegments = [...resolvedTextSegments];
        const currentSegment = nextTextSegments[token.segmentIndex];

        nextTextSegments[token.segmentIndex] = {
          ...currentSegment,
          text:
            currentSegment.text.slice(0, token.segmentTextStart) +
            text +
            currentSegment.text.slice(token.segmentTextEnd),
        };
        const nextState = {
          content: getTextSegmentsContent(nextTextSegments),
          textSegments: nextTextSegments,
        };

        if (onChangeState) {
          onChangeState(nextState);
          return;
        }

        onContentChange(nextState.content);
        onTextSegmentsChange?.(nextTextSegments);
      }}
      onSelectionChange={event => {
        const {selection} = event.nativeEvent;
        const position =
          selection.start + getTokenOffsetBeforeIndex(tokens, tokenIndex);

        onSelectionChange(selection, position);
      }}
      multiline
    />
  );
};
