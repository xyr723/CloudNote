import type {EditableTextSegment} from '../ui/types';
import {getTextSegmentsContent, hasSyncedTextSegments} from './noteEditorTextSegments';

const normalizeMarkerContent = (content: string): string => {
  return content.replace(/\n\s*\n/g, '\n').trim();
};

const extractMarkerIndices = (
  content: string,
  markerType: '图片' | '音频',
): Set<number> => {
  const markers =
    content.match(
      markerType === '图片' ? /\[图片\d+\]/g : /\[音频\d+\]/g,
    ) || [];

  return new Set(
    markers.map(marker => parseInt(marker.match(/\d+/)?.[0] || '0', 10)),
  );
};

export const insertMarkerAtCursor = (
  content: string,
  cursorPosition: number,
  marker: string,
): string => {
  return (
    content.slice(0, cursorPosition) + marker + content.slice(cursorPosition)
  );
};

const resolveTextSegments = ({
  content,
  fontSize,
  textSegments,
}: {
  content: string;
  fontSize: number;
  textSegments?: EditableTextSegment[];
}): EditableTextSegment[] => {
  if (hasSyncedTextSegments(textSegments, content)) {
    return textSegments;
  }

  return [
    {
      text: content,
      fontSize,
      isBold: false,
    },
  ];
};

const normalizeTextSegments = (
  textSegments: EditableTextSegment[],
  fallbackFontSize: number,
): EditableTextSegment[] => {
  const filteredSegments = textSegments.filter(segment => segment.text !== '');

  if (filteredSegments.length > 0) {
    return filteredSegments;
  }

  return [
    {
      text: '',
      fontSize: fallbackFontSize,
      isBold: false,
    },
  ];
};

type SegmentStyle = Omit<EditableTextSegment, 'text'>;

type SegmentCharacter = {
  char: string;
  style: SegmentStyle;
};

const getSegmentStyle = (
  segment: EditableTextSegment,
): SegmentStyle => {
  return {
    color: segment.color,
    fontSize: segment.fontSize,
    isBold: segment.isBold,
    isItalic: segment.isItalic,
  };
};

const createStyledTextSegment = (
  text: string,
  style: SegmentStyle,
): EditableTextSegment => {
  const nextSegment: EditableTextSegment = {
    text,
    fontSize: style.fontSize,
  };

  if (style.isBold !== undefined) {
    nextSegment.isBold = style.isBold;
  }

  if (style.isItalic !== undefined) {
    nextSegment.isItalic = style.isItalic;
  }

  if (style.color !== undefined) {
    nextSegment.color = style.color;
  }

  return nextSegment;
};

const areSegmentStylesEqual = (
  left: SegmentStyle,
  right: SegmentStyle,
): boolean => {
  return (
    left.color === right.color &&
    left.fontSize === right.fontSize &&
    left.isBold === right.isBold &&
    left.isItalic === right.isItalic
  );
};

const trimSegmentCharacters = (
  characters: SegmentCharacter[],
): SegmentCharacter[] => {
  let startIndex = 0;
  let endIndex = characters.length - 1;

  while (startIndex <= endIndex && /\s/.test(characters[startIndex].char)) {
    startIndex += 1;
  }

  while (endIndex >= startIndex && /\s/.test(characters[endIndex].char)) {
    endIndex -= 1;
  }

  return characters.slice(startIndex, endIndex + 1);
};

const normalizeSegmentCharacters = (
  characters: SegmentCharacter[],
): SegmentCharacter[] => {
  const trimmedCharacters = trimSegmentCharacters(characters);
  const normalizedCharacters: SegmentCharacter[] = [];
  let index = 0;

  while (index < trimmedCharacters.length) {
    const currentCharacter = trimmedCharacters[index];

    if (currentCharacter.char !== '\n') {
      normalizedCharacters.push(currentCharacter);
      index += 1;
      continue;
    }

    let lookahead = index + 1;
    let lastCollapsedNewlineIndex = -1;

    while (
      lookahead < trimmedCharacters.length &&
      /\s/.test(trimmedCharacters[lookahead].char)
    ) {
      if (trimmedCharacters[lookahead].char === '\n') {
        lastCollapsedNewlineIndex = lookahead;
      }

      lookahead += 1;
    }

    normalizedCharacters.push(currentCharacter);

    if (lastCollapsedNewlineIndex !== -1) {
      index = lastCollapsedNewlineIndex + 1;
      continue;
    }

    index += 1;
  }

  return normalizedCharacters;
};

const normalizeTextSegmentsContent = (
  textSegments: EditableTextSegment[],
  fallbackFontSize: number,
): EditableTextSegment[] => {
  const characters = textSegments.flatMap(segment => {
    const style = getSegmentStyle(segment);

    return Array.from(segment.text).map(char => ({
      char,
      style,
    }));
  });
  const normalizedCharacters = normalizeSegmentCharacters(characters);

  if (normalizedCharacters.length === 0) {
    return normalizeTextSegments([], fallbackFontSize);
  }

  const normalizedTextSegments: EditableTextSegment[] = [];
  let currentStyle = normalizedCharacters[0].style;
  let currentText = normalizedCharacters[0].char;

  for (let index = 1; index < normalizedCharacters.length; index += 1) {
    const currentCharacter = normalizedCharacters[index];

    if (areSegmentStylesEqual(currentStyle, currentCharacter.style)) {
      currentText += currentCharacter.char;
      continue;
    }

    normalizedTextSegments.push(
      createStyledTextSegment(currentText, currentStyle),
    );
    currentStyle = currentCharacter.style;
    currentText = currentCharacter.char;
  }

  normalizedTextSegments.push(
    createStyledTextSegment(currentText, currentStyle),
  );

  return normalizeTextSegments(normalizedTextSegments, fallbackFontSize);
};

const getFallbackSegmentStyle = ({
  fontSize,
  textSegments,
}: {
  fontSize: number;
  textSegments: EditableTextSegment[];
}): Omit<EditableTextSegment, 'text'> => {
  const lastSegment = [...textSegments].reverse().find(segment => segment.text !== '');

  if (!lastSegment) {
    return {
      fontSize,
      isBold: false,
    };
  }

  return {
    fontSize: lastSegment.fontSize ?? fontSize,
    isBold: lastSegment.isBold,
    isItalic: lastSegment.isItalic,
    color: lastSegment.color,
  };
};

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

export const removeImageMarker = (
  content: string,
  imageIndex: number,
  totalImages: number,
): string => {
  let nextContent = content.replace(
    new RegExp(`\\[图片${imageIndex}\\]`, 'g'),
    '',
  );

  for (let index = imageIndex + 1; index < totalImages; index += 1) {
    nextContent = nextContent.replace(
      new RegExp(`\\[图片${index}\\]`, 'g'),
      `[图片${index - 1}]`,
    );
  }

  return normalizeMarkerContent(nextContent);
};

export const removeAudioMarker = (
  content: string,
  audioIndex: number,
  totalAudios: number,
): string => {
  let nextContent = content.replace(
    new RegExp(`\\[音频${audioIndex}\\]`, 'g'),
    '',
  );

  for (let index = audioIndex + 1; index < totalAudios; index += 1) {
    nextContent = nextContent.replace(
      new RegExp(`\\[音频${index}\\]`, 'g'),
      `[音频${index - 1}]`,
    );
  }

  return normalizeMarkerContent(nextContent);
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
  const cleanedTextSegments = normalizeTextSegmentsContent(
    resolvedTextSegments.map(segment => ({
      ...segment,
      text: removeInvalidImageMarkersFromSegmentText(segment.text, imageCount),
    })),
    fontSize,
  );
  const cleanedContent = normalizeMarkerContent(
    getTextSegmentsContent(cleanedTextSegments),
  );
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

type SyncImageMarkersInput = {
  content: string;
  imageCount: number;
  isUserDelete: boolean;
};

export const syncImageMarkers = ({
  content,
  imageCount,
  isUserDelete,
}: SyncImageMarkersInput): string => {
  let nextContent = content;
  const markers = nextContent.match(/\[图片\d+\]/g) || [];
  const invalidMarkers = markers.filter(marker => {
    const index = parseInt(marker.match(/\d+/)?.[0] || '0', 10);
    return index >= imageCount;
  });

  invalidMarkers.forEach(marker => {
    nextContent = nextContent.replace(marker, '');
  });
  nextContent = normalizeMarkerContent(nextContent);

  if (isUserDelete) {
    return nextContent;
  }

  const existingIndices = extractMarkerIndices(nextContent, '图片');

  for (let index = 0; index < imageCount; index += 1) {
    if (existingIndices.has(index)) {
      continue;
    }

    const marker = `[图片${index}]`;
    if (nextContent.endsWith('\n')) {
      nextContent += marker;
    } else if (nextContent === '') {
      nextContent = marker;
    } else {
      nextContent += `\n${marker}`;
    }
  }

  return nextContent.trim();
};
