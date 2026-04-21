import type {EditableTextSegment} from '../ui/types';
import {getTextSegmentsContent} from './noteEditorTextSegments';
import {
  insertMarkerAtCursor,
  normalizeMarkerContent,
  syncImageMarkers,
} from './noteEditorMediaContentMarkers';
import {
  getFallbackSegmentStyle,
  normalizeTextSegmentsContent,
  resolveTextSegments,
} from './noteEditorMediaTextSegmentNormalization';

const findSegmentIndexByCursorPosition = (
  textSegments: EditableTextSegment[],
  cursorPosition: number,
): number => {
  const totalLength = textSegments.reduce(
    (total, segment) => total + segment.text.length,
    0,
  );
  const safeCursorPosition = Math.max(0, Math.min(cursorPosition, totalLength));
  let offset = 0;

  for (let index = 0; index < textSegments.length; index += 1) {
    const segment = textSegments[index];
    const segmentEnd = offset + segment.text.length;

    if (safeCursorPosition <= segmentEnd) {
      return index;
    }

    offset = segmentEnd;
  }

  return Math.max(textSegments.length - 1, 0);
};

export const insertMarkerIntoTextSegments = ({
  content,
  cursorPosition,
  fontSize,
  marker,
  textSegments,
}: {
  content: string;
  cursorPosition: number;
  fontSize: number;
  marker: string;
  textSegments?: EditableTextSegment[];
}): EditableTextSegment[] => {
  const resolvedTextSegments = resolveTextSegments({
    content,
    fontSize,
    textSegments,
  });
  const segmentIndex = findSegmentIndexByCursorPosition(
    resolvedTextSegments,
    cursorPosition,
  );
  const segmentStart = resolvedTextSegments
    .slice(0, segmentIndex)
    .reduce((total, segment) => total + segment.text.length, 0);
  const relativeCursorPosition = cursorPosition - segmentStart;
  const nextTextSegments = [...resolvedTextSegments];
  const targetSegment = nextTextSegments[segmentIndex];

  nextTextSegments[segmentIndex] = {
    ...targetSegment,
    text: insertMarkerAtCursor(
      targetSegment.text,
      relativeCursorPosition,
      marker,
    ),
  };

  return nextTextSegments;
};

const removeMarkerFromSegmentText = ({
  markerType,
  segmentText,
  startIndex,
  totalCount,
}: {
  markerType: '图片' | '音频';
  segmentText: string;
  startIndex: number;
  totalCount: number;
}): string => {
  let nextText = segmentText.replace(
    new RegExp(`\\[${markerType}${startIndex}\\]`, 'g'),
    '',
  );

  for (let index = startIndex + 1; index < totalCount; index += 1) {
    nextText = nextText.replace(
      new RegExp(`\\[${markerType}${index}\\]`, 'g'),
      `[${markerType}${index - 1}]`,
    );
  }

  return nextText;
};

const removeInvalidImageMarkersFromSegmentText = (
  segmentText: string,
  imageCount: number,
): string => {
  return segmentText.replace(/\[图片(\d+)\]/g, (marker, indexValue) => {
    return parseInt(indexValue, 10) >= imageCount ? '' : marker;
  });
};

const removeMarkerFromTextSegments = ({
  content,
  fontSize,
  markerType,
  startIndex,
  textSegments,
  totalCount,
}: {
  content: string;
  fontSize: number;
  markerType: '图片' | '音频';
  startIndex: number;
  textSegments?: EditableTextSegment[];
  totalCount: number;
}): EditableTextSegment[] => {
  const resolvedTextSegments = resolveTextSegments({
    content,
    fontSize,
    textSegments,
  });
  const nextTextSegments = resolvedTextSegments.map(segment => ({
    ...segment,
    text: removeMarkerFromSegmentText({
      markerType,
      segmentText: segment.text,
      startIndex,
      totalCount,
    }),
  }));

  return normalizeTextSegmentsContent(nextTextSegments, fontSize);
};

export const removeImageMarkerFromTextSegments = ({
  content,
  fontSize,
  imageIndex,
  textSegments,
  totalImages,
}: {
  content: string;
  fontSize: number;
  imageIndex: number;
  textSegments?: EditableTextSegment[];
  totalImages: number;
}): EditableTextSegment[] => {
  return removeMarkerFromTextSegments({
    content,
    fontSize,
    markerType: '图片',
    startIndex: imageIndex,
    textSegments,
    totalCount: totalImages,
  });
};

export const removeAudioMarkerFromTextSegments = ({
  audioIndex,
  content,
  fontSize,
  textSegments,
  totalAudios,
}: {
  audioIndex: number;
  content: string;
  fontSize: number;
  textSegments?: EditableTextSegment[];
  totalAudios: number;
}): EditableTextSegment[] => {
  return removeMarkerFromTextSegments({
    content,
    fontSize,
    markerType: '音频',
    startIndex: audioIndex,
    textSegments,
    totalCount: totalAudios,
  });
};

export const syncImageMarkersInTextSegments = ({
  content,
  fontSize,
  imageCount,
  isUserDelete,
  textSegments,
}: {
  content: string;
  fontSize: number;
  imageCount: number;
  isUserDelete: boolean;
  textSegments?: EditableTextSegment[];
}): EditableTextSegment[] => {
  const resolvedTextSegments = resolveTextSegments({
    content,
    fontSize,
    textSegments,
  });
  const invalidMarkersRemovedTextSegments = resolvedTextSegments.map(segment => ({
    ...segment,
    text: removeInvalidImageMarkersFromSegmentText(segment.text, imageCount),
  }));
  const didRemoveInvalidMarkers = invalidMarkersRemovedTextSegments.some(
    (segment, index) => segment.text !== resolvedTextSegments[index].text,
  );
  const cleanedTextSegments = didRemoveInvalidMarkers
    ? normalizeTextSegmentsContent(invalidMarkersRemovedTextSegments, fontSize)
    : resolvedTextSegments;
  const cleanedContent = didRemoveInvalidMarkers
    ? normalizeMarkerContent(getTextSegmentsContent(cleanedTextSegments))
    : getTextSegmentsContent(cleanedTextSegments);
  const nextContent = syncImageMarkers({
    content,
    imageCount,
    isUserDelete,
  });

  if (nextContent === cleanedContent) {
    return cleanedTextSegments;
  }

  if (nextContent.startsWith(cleanedContent)) {
    const appendedSuffix = nextContent.slice(cleanedContent.length);
    const nextTextSegments = [...cleanedTextSegments];
    const lastSegmentIndex = nextTextSegments.length - 1;

    nextTextSegments[lastSegmentIndex] = {
      ...nextTextSegments[lastSegmentIndex],
      text: nextTextSegments[lastSegmentIndex].text + appendedSuffix,
    };

    return nextTextSegments;
  }

  return [
    {
      text: nextContent,
      ...getFallbackSegmentStyle({
        fontSize,
        textSegments: cleanedTextSegments,
      }),
    },
  ];
};
