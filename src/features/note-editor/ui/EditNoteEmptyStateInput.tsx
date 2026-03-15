import React from 'react';
import {TextInput} from 'react-native';
import {createTextInputStyle} from './EditNoteTextTokenInput';
import type {EditorSelection} from './types';

type EditNoteEmptyStateInputProps = {
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  onContentChange: (content: string) => void;
  onSelectionChange: (
    selection: EditorSelection,
    cursorPosition: number,
  ) => void;
  placeholderTextColor: string;
  textColor: string;
};

export const EditNoteEmptyStateInput: React.FC<
  EditNoteEmptyStateInputProps
> = ({
  fontSize,
  isBold,
  isItalic,
  onContentChange,
  onSelectionChange,
  placeholderTextColor,
  textColor,
}) => {
  return (
    <TextInput
      style={createTextInputStyle({
        fontSize,
        isBold,
        isItalic,
        textColor,
      })}
      placeholder="点击此处开始编辑笔记..."
      placeholderTextColor={placeholderTextColor}
      onChangeText={onContentChange}
      onSelectionChange={event => {
        const {selection} = event.nativeEvent;
        onSelectionChange(selection, selection.start);
      }}
      multiline
    />
  );
};
