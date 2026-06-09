import {useCallback, useEffect, useState} from 'react';
import type {NoteDraft} from '../../../entities/note/draft';
import type {
  EditableTextSegment,
  EditorSelection,
} from '../ui/types';
import {createDefaultTextSegments} from './noteEditorFormattingUtils';

type FormattableNote = Pick<NoteDraft, 'content' | 'fontSize' | 'textSegments'>;

const createCollapsedSelection = (contentLength: number): EditorSelection => {
  return {
    start: contentLength,
    end: contentLength,
  };
};

export const useNoteFormattingState = ({
  note,
  onChangeTextSegments,
}: {
  note: FormattableNote;
  onChangeTextSegments?: (segments: EditableTextSegment[]) => void;
}) => {
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

  const syncSelectionToContentEnd = useCallback((content: string) => {
    setSelection(createCollapsedSelection(content.length));
    setCursorPosition(content.length);
  }, []);

  return {
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
  };
};
