import {useCallback} from 'react';
import type {NoteDraft} from '../../../entities/note/draft';
import type {
  EditableTextSegment,
  EditorSelection,
} from '../ui/types';
import {
  appendTextToTextSegments,
  replaceRichTextSegmentsState,
  replaceTextSegmentsContent,
  setGlobalTextSegmentsFontSize,
  toggleBoldForSelection,
  toggleGlobalBold,
  toggleGlobalItalic,
  toggleItalicForSelection,
} from './noteEditorFormattingUtils';
import {getTextSegmentsContent} from './noteEditorTextSegments';
import {useNoteFormattingState} from './useNoteFormattingState';

type FormattableNote = Pick<NoteDraft, 'content' | 'fontSize' | 'textSegments'>;

type UseNoteFormattingInput = {
  note: FormattableNote;
  onChangeContent: (content: string) => void;
  onChangeFontSize?: (size: number) => void;
  onChangeTextSegments?: (segments: EditableTextSegment[]) => void;
};

export const useNoteFormatting = ({
  note,
  onChangeContent,
  onChangeFontSize,
  onChangeTextSegments,
}: UseNoteFormattingInput) => {
  const formattingState = useNoteFormattingState({
    note,
    onChangeTextSegments,
  });
  const {
    applyTextSegmentsChange,
    cursorPosition,
    fontSize,
    handleEditorSelectionChange,
    isBold,
    isItalic,
    selection,
    setFontSize,
    setIsBold,
    setIsItalic,
    syncSelectionToContentEnd,
    textSegments,
  } = formattingState;

  const applyContentReplacement = useCallback(
    (nextContent: string, nextTextSegments: EditableTextSegment[]) => {
      syncSelectionToContentEnd(nextContent);
      applyTextSegmentsChange(nextTextSegments);
      onChangeContent(nextContent);
    },
    [applyTextSegmentsChange, onChangeContent, syncSelectionToContentEnd],
  );

  const handleFontSizeChange = useCallback(
    (nextSize: number) => {
      setFontSize(nextSize);
      applyTextSegmentsChange(
        setGlobalTextSegmentsFontSize(textSegments, nextSize),
      );
      onChangeFontSize?.(nextSize);
    },
    [applyTextSegmentsChange, onChangeFontSize, setFontSize, textSegments],
  );

  const handleSelectionStyleToggle = useCallback(
    ({
      currentValue,
      selectionToggle,
      setCurrentValue,
      toggleGlobalStyle,
    }: {
      currentValue: boolean;
      selectionToggle: (
        nextSegments: EditableTextSegment[],
        nextSelection: EditorSelection,
      ) => {content: string; textSegments: EditableTextSegment[]} | null;
      setCurrentValue: (nextValue: boolean) => void;
      toggleGlobalStyle: (
        nextSegments: EditableTextSegment[],
        nextValue: boolean,
      ) => EditableTextSegment[];
    }) => {
      if (selection.start === selection.end) {
        const nextValue = !currentValue;

        setCurrentValue(nextValue);
        applyTextSegmentsChange(toggleGlobalStyle(textSegments, nextValue));
        return;
      }

      const result = selectionToggle(textSegments, selection);

      if (!result) {
        return;
      }

      applyTextSegmentsChange(result.textSegments);
      onChangeContent(result.content);
    },
    [applyTextSegmentsChange, onChangeContent, selection, textSegments],
  );

  const handleIncreaseFontSize = useCallback(() => {
    handleFontSizeChange(fontSize + 2);
  }, [fontSize, handleFontSizeChange]);

  const handleDecreaseFontSize = useCallback(() => {
    handleFontSizeChange(fontSize - 2);
  }, [fontSize, handleFontSizeChange]);

  const handleToggleItalic = useCallback(() => {
    handleSelectionStyleToggle({
      currentValue: isItalic,
      selectionToggle: toggleItalicForSelection,
      setCurrentValue: setIsItalic,
      toggleGlobalStyle: toggleGlobalItalic,
    });
  }, [handleSelectionStyleToggle, isItalic, setIsItalic]);

  const handleBoldToggle = useCallback(() => {
    handleSelectionStyleToggle({
      currentValue: isBold,
      selectionToggle: toggleBoldForSelection,
      setCurrentValue: setIsBold,
      toggleGlobalStyle: toggleGlobalBold,
    });
  }, [handleSelectionStyleToggle, isBold, setIsBold]);

  const handleAppendText = useCallback(
    (appendedText: string) => {
      if (!appendedText) {
        return;
      }

      const nextTextSegments = appendTextToTextSegments(
        textSegments,
        appendedText,
        fontSize,
      );

      applyTextSegmentsChange(nextTextSegments);
      onChangeContent(getTextSegmentsContent(nextTextSegments));
    },
    [applyTextSegmentsChange, fontSize, onChangeContent, textSegments],
  );

  const handleReplaceTextContent = useCallback(
    (nextContent: string) => {
      applyContentReplacement(
        nextContent,
        replaceTextSegmentsContent({
          textSegments,
          nextContent,
          fallbackFontSize: fontSize,
        }),
      );
    },
    [applyContentReplacement, fontSize, textSegments],
  );

  const handleReplaceRichTextContent = useCallback(
    ({
      content: nextContent,
      textSegments: nextTextSegments,
    }: {
      content: string;
      textSegments?: EditableTextSegment[];
    }) => {
      applyContentReplacement(
        nextContent,
        replaceRichTextSegmentsState({
          content: nextContent,
          fallbackFontSize: fontSize,
          textSegments: nextTextSegments,
        }),
      );
    },
    [applyContentReplacement, fontSize],
  );

  return {
    applyTextSegmentsChange,
    cursorPosition,
    fontSize,
    handleAppendText,
    handleBoldToggle,
    handleDecreaseFontSize,
    handleEditorSelectionChange,
    handleIncreaseFontSize,
    handleReplaceRichTextContent,
    handleReplaceTextContent,
    handleToggleItalic,
    isBold,
    isItalic,
    selection,
    textSegments,
  };
};
