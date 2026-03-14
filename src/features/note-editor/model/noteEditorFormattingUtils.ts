import type {NoteDraft} from '../../../entities/note/draft';
import type {
  EditableTextSegment,
  EditorSelection,
} from '../ui/types';
import {
  getTextSegmentsContent,
  hasSyncedTextSegments,
} from './noteEditorTextSegments';

type FormattableNote = Pick<NoteDraft, 'content' | 'fontSize' | 'textSegments'>;

type ToggleableStyleKey = 'isBold' | 'isItalic';

export const createDefaultTextSegments = (
  note: FormattableNote,
): EditableTextSegment[] => {
  if (hasSyncedTextSegments(note.textSegments, note.content)) {
    return note.textSegments;
  }

  return (
    [
      {
        text: note.content,
        fontSize: note.fontSize || 16,
        isBold: false,
      },
    ]
  );
};

export const toggleGlobalBold = (
  textSegments: EditableTextSegment[],
  nextIsBold: boolean,
): EditableTextSegment[] => {
  return toggleGlobalStyle(textSegments, 'isBold', nextIsBold);
};

export const toggleGlobalItalic = (
  textSegments: EditableTextSegment[],
  nextIsItalic: boolean,
): EditableTextSegment[] => {
  return toggleGlobalStyle(textSegments, 'isItalic', nextIsItalic);
};

export const appendTextToTextSegments = (
  textSegments: EditableTextSegment[],
  appendedText: string,
  fallbackFontSize: number,
): EditableTextSegment[] => {
  if (!appendedText) {
    return textSegments;
  }

  if (textSegments.length === 0) {
    return [
      {
        text: appendedText,
        fontSize: fallbackFontSize,
        isBold: false,
      },
    ];
  }

  const nextTextSegments = [...textSegments];
  const lastSegmentIndex = nextTextSegments.length - 1;
  const lastSegment = nextTextSegments[lastSegmentIndex];

  nextTextSegments[lastSegmentIndex] = {
    ...lastSegment,
    text: lastSegment.text + appendedText,
  };

  return nextTextSegments;
};

const toggleGlobalStyle = (
  textSegments: EditableTextSegment[],
  styleKey: ToggleableStyleKey,
  nextValue: boolean,
): EditableTextSegment[] => {
  return textSegments.map(segment => ({
    ...segment,
    [styleKey]: nextValue,
  }));
};

const findSegmentIndexBySelectionStart = (
  textSegments: EditableTextSegment[],
  selectionStart: number,
): number => {
  let offset = 0;

  for (let index = 0; index < textSegments.length; index += 1) {
    const segment = textSegments[index];
    const segmentEnd = offset + segment.text.length;

    if (selectionStart >= offset && selectionStart < segmentEnd) {
      return index;
    }

    offset = segmentEnd;
  }

  return -1;
};

export const toggleBoldForSelection = (
  textSegments: EditableTextSegment[],
  selection: EditorSelection,
): {content: string; textSegments: EditableTextSegment[]} | null => {
  return toggleStyleForSelection(textSegments, selection, 'isBold');
};

export const toggleItalicForSelection = (
  textSegments: EditableTextSegment[],
  selection: EditorSelection,
): {content: string; textSegments: EditableTextSegment[]} | null => {
  return toggleStyleForSelection(textSegments, selection, 'isItalic');
};

const toggleStyleForSelection = (
  textSegments: EditableTextSegment[],
  selection: EditorSelection,
  styleKey: ToggleableStyleKey,
): {content: string; textSegments: EditableTextSegment[]} | null => {
  if (selection.start === selection.end) {
    return null;
  }

  const startSegmentIndex = findSegmentIndexBySelectionStart(
    textSegments,
    selection.start,
  );

  if (startSegmentIndex === -1) {
    return null;
  }

  const currentSegment = textSegments[startSegmentIndex];
  const segmentStart = textSegments
    .slice(0, startSegmentIndex)
    .reduce((total, segment) => total + segment.text.length, 0);
  const relativeStart = selection.start - segmentStart;
  const relativeEnd = Math.min(
    selection.end - segmentStart,
    currentSegment.text.length,
  );
  const beforeText = currentSegment.text.slice(0, relativeStart);
  const selectedText = currentSegment.text.slice(relativeStart, relativeEnd);
  const afterText = currentSegment.text.slice(relativeEnd);
  const nextSegments: EditableTextSegment[] = [];

  if (beforeText) {
    nextSegments.push({...currentSegment, text: beforeText});
  }

  nextSegments.push({
    ...currentSegment,
    text: selectedText,
    [styleKey]: !currentSegment[styleKey],
  });

  if (afterText) {
    nextSegments.push({...currentSegment, text: afterText});
  }

  const nextTextSegments = [...textSegments];
  nextTextSegments.splice(startSegmentIndex, 1, ...nextSegments);

  return {
    content: getTextSegmentsContent(nextTextSegments),
    textSegments: nextTextSegments,
  };
};
