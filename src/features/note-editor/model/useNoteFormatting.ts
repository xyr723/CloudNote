import {useCallback, useEffect, useState} from 'react';
import type {NoteDraft} from '../../../entities/note/draft';
import type {
  EditableTextSegment,
  EditorSelection,
} from '../ui/types';
import {
  appendTextToTextSegments,
  createDefaultTextSegments,
  replaceRichTextSegmentsState,
  replaceTextSegmentsContent,
  setGlobalTextSegmentsFontSize,
  toggleBoldForSelection,
  toggleGlobalBold,
  toggleGlobalItalic,
  toggleItalicForSelection,
} from './noteEditorFormattingUtils';
import {getTextSegmentsContent} from './noteEditorTextSegments';

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
  const [fontSize, setFontSize] = useState(note.fontSize || 16);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [selection, setSelection] = useState<EditorSelection>({
    start: 0,
    end: 0,
  });
  const [cursorPosition, setCursorPosition] = useState(0);
  const [textSegments, setTextSegments] = useState<EditableTextSegment[]>(
    createDefaultTextSegments(note),
  );

  useEffect(() => {
    setFontSize(note.fontSize || 16);
    setTextSegments(createDefaultTextSegments(note));
  }, [note]);

  const applyTextSegmentsChange = useCallback(
    (nextTextSegments: EditableTextSegment[]) => {
      setTextSegments(nextTextSegments);
      onChangeTextSegments?.(nextTextSegments);
    },
    [onChangeTextSegments],
  );

  const handleEditorSelectionChange = useCallback(
    (nextSelection: EditorSelection, nextCursorPosition: number) => {
      setSelection(nextSelection);
      setCursorPosition(nextCursorPosition);
    },
    [],
  );

  const handleFontSizeChange = useCallback(
    (nextSize: number) => {
      const nextTextSegments = setGlobalTextSegmentsFontSize(
        textSegments,
        nextSize,
      );

      setFontSize(nextSize);
      applyTextSegmentsChange(nextTextSegments);
      onChangeFontSize?.(nextSize);
    },
    [applyTextSegmentsChange, onChangeFontSize, textSegments],
  );

  const handleIncreaseFontSize = useCallback(() => {
    handleFontSizeChange(fontSize + 2);
  }, [fontSize, handleFontSizeChange]);

  const handleDecreaseFontSize = useCallback(() => {
    handleFontSizeChange(fontSize - 2);
  }, [fontSize, handleFontSizeChange]);

  const handleToggleItalic = useCallback(() => {
    if (selection.start === selection.end) {
      const nextIsItalic = !isItalic;
      const nextTextSegments = toggleGlobalItalic(textSegments, nextIsItalic);

      setIsItalic(nextIsItalic);
      applyTextSegmentsChange(nextTextSegments);
      return;
    }

    const result = toggleItalicForSelection(textSegments, selection);

    if (!result) {
      return;
    }

    applyTextSegmentsChange(result.textSegments);
    onChangeContent(result.content);
  }, [
    applyTextSegmentsChange,
    isItalic,
    onChangeContent,
    selection,
    textSegments,
  ]);

  const handleBoldToggle = useCallback(() => {
    if (selection.start === selection.end) {
      const nextIsBold = !isBold;
      const nextTextSegments = toggleGlobalBold(textSegments, nextIsBold);

      setIsBold(nextIsBold);
      applyTextSegmentsChange(nextTextSegments);
      return;
    }

    const result = toggleBoldForSelection(textSegments, selection);

    if (!result) {
      return;
    }

    applyTextSegmentsChange(result.textSegments);
    onChangeContent(result.content);
  }, [
    applyTextSegmentsChange,
    isBold,
    onChangeContent,
    selection,
    textSegments,
  ]);

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
      onChangeContent(nextContent);
    },
    [applyTextSegmentsChange, fontSize, onChangeContent, textSegments],
  );

  const handleReplaceTextContent = useCallback(
    (nextContent: string) => {
      const nextTextSegments = replaceTextSegmentsContent({
        textSegments,
        nextContent,
        fallbackFontSize: fontSize,
      });

      setSelection({
        start: nextContent.length,
        end: nextContent.length,
      });
      setCursorPosition(nextContent.length);
      applyTextSegmentsChange(nextTextSegments);
      onChangeContent(nextContent);
    },
    [applyTextSegmentsChange, fontSize, onChangeContent, textSegments],
  );

  const handleReplaceRichTextContent = useCallback(
    ({
      content: nextContent,
      textSegments: nextTextSegments,
    }: {
      content: string;
      textSegments?: EditableTextSegment[];
    }) => {
      const resolvedTextSegments = replaceRichTextSegmentsState({
        content: nextContent,
        fallbackFontSize: fontSize,
        textSegments: nextTextSegments,
      });

      setSelection({
        start: nextContent.length,
        end: nextContent.length,
      });
      setCursorPosition(nextContent.length);
      applyTextSegmentsChange(resolvedTextSegments);
      onChangeContent(nextContent);
    },
    [applyTextSegmentsChange, fontSize, onChangeContent],
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
