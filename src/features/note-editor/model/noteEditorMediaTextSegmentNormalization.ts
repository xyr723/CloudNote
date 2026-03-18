import type {EditableTextSegment} from '../ui/types';
import {hasSyncedTextSegments} from './noteEditorTextSegments';

type SegmentStyle = Omit<EditableTextSegment, 'text'>;

type SegmentCharacter = {
  char: string;
  style: SegmentStyle;
};

export const resolveTextSegments = ({
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

const getSegmentStyle = (segment: EditableTextSegment): SegmentStyle => {
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

export const normalizeTextSegmentsContent = (
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

export const getFallbackSegmentStyle = ({
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
