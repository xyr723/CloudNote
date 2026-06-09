import {useCallback} from 'react';
import type {NoteDraft} from '../../../entities/note/draft';
import type {
  EditableTextSegment,
  EditorSelection,
  NoteEditorChangeState,
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
  onChangeContent?: (content: string) => void;
  onChangeState?: (state: NoteEditorChangeState) => void;
  onChangeFontSize?: (size: number) => void;
  onChangeTextSegments?: (segments: EditableTextSegment[]) => void;
};

export const useNoteFormatting = ({
  note,
  onChangeContent,
  onChangeState,
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
    setTextSegments,
    syncSelectionToContentEnd,
    textSegments,
  } = formattingState;

  const emitChangeState = useCallback(
    (nextState: NoteEditorChangeState) => {
      onChangeState?.(nextState);
    },
    [onChangeState],
  );

  const applyContentReplacement = useCallback(
    (nextContent: string, nextTextSegments: EditableTextSegment[]) => {
      syncSelectionToContentEnd(nextContent);
      applyTextSegmentsChange(nextTextSegments);
      if (onChangeState) {
        emitChangeState({
          content: nextContent,
          textSegments: nextTextSegments,
        });
        return;
      }

      onChangeContent?.(nextContent);
    },
    [
      applyTextSegmentsChange,
      emitChangeState,
      onChangeContent,
      onChangeState,
      syncSelectionToContentEnd,
    ],
  );

  const applyExternalRichTextState = useCallback(
    ({
      content: nextContent,
      fontSize: nextFontSize,
      textSegments: nextTextSegments,
    }: {
      content: string;
      fontSize?: number;
      textSegments?: EditableTextSegment[];
    }) => {
      if (typeof nextFontSize === 'number') {
        setFontSize(nextFontSize);
      }

      syncSelectionToContentEnd(nextContent);
      setTextSegments(
        replaceRichTextSegmentsState({
          content: nextContent,
          fallbackFontSize: nextFontSize ?? fontSize,
          textSegments: nextTextSegments,
        }),
      );
    },
    [fontSize, setFontSize, setTextSegments, syncSelectionToContentEnd],
  );

  const handleFontSizeChange = useCallback(
    (nextSize: number) => {
      const nextTextSegments = setGlobalTextSegmentsFontSize(
        textSegments,
        nextSize,
      );

      setFontSize(nextSize);
      applyTextSegmentsChange(nextTextSegments);
      if (onChangeState) {
        emitChangeState({
          content: getTextSegmentsContent(nextTextSegments),
          fontSize: nextSize,
          textSegments: nextTextSegments,
        });
        return;
      }

      onChangeFontSize?.(nextSize);
    },
    [
      applyTextSegmentsChange,
      emitChangeState,
      onChangeFontSize,
      onChangeState,
      setFontSize,
      textSegments,
    ],
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
        const nextTextSegments = toggleGlobalStyle(textSegments, nextValue);

        setCurrentValue(nextValue);
        applyTextSegmentsChange(nextTextSegments);
        if (onChangeState) {
          emitChangeState({
            content: getTextSegmentsContent(nextTextSegments),
            textSegments: nextTextSegments,
          });
        }
        return;
      }

      const result = selectionToggle(textSegments, selection);

      if (!result) {
        return;
      }

      applyTextSegmentsChange(result.textSegments);
      if (onChangeState) {
        emitChangeState({
          content: result.content,
          textSegments: result.textSegments,
        });
        return;
      }

      onChangeContent?.(result.content);
    },
    [
      applyTextSegmentsChange,
      emitChangeState,
      onChangeContent,
      onChangeState,
      selection,
      textSegments,
    ],
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
      const nextContent = getTextSegmentsContent(nextTextSegments);

      applyTextSegmentsChange(nextTextSegments);
      if (onChangeState) {
        emitChangeState({
          content: nextContent,
          textSegments: nextTextSegments,
        });
        return;
      }

      onChangeContent?.(nextContent);
    },
    [
      applyTextSegmentsChange,
      emitChangeState,
      fontSize,
      onChangeContent,
      onChangeState,
      textSegments,
    ],
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
    applyExternalRichTextState,
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
