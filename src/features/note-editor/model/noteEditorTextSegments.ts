import type {EditableTextSegment} from '../ui/types';

export const getTextSegmentsContent = (
  textSegments: EditableTextSegment[],
): string => {
  return textSegments.map(segment => segment.text).join('');
};

export const hasSyncedTextSegments = (
  textSegments: EditableTextSegment[] | undefined,
  content: string,
): textSegments is EditableTextSegment[] => {
  return Boolean(
    textSegments && getTextSegmentsContent(textSegments) === content,
  );
};
