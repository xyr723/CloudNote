import type {EditableTextSegment} from '../ui/types';

export type TextToken = {
  type: 'text';
  segmentIndex: number;
  segmentTextEnd: number;
  segmentTextStart: number;
  text: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  color: string;
};

export type MarkerToken =
  | {type: 'image'; imageIndex: number; marker: string}
  | {type: 'audio'; audioIndex: number; marker: string};

export type ContentToken = TextToken | MarkerToken;

const markerPattern = /(\[图片\d+\]|\[音频\d+\])/g;

export const buildContentTokens = ({
  defaultFontSize,
  defaultIsBold,
  defaultIsItalic,
  defaultTextColor,
  segments,
}: {
  defaultFontSize: number;
  defaultIsBold: boolean;
  defaultIsItalic: boolean;
  defaultTextColor: string;
  segments: EditableTextSegment[];
}): ContentToken[] => {
  return segments.flatMap<ContentToken>((segment, segmentIndex) => {
    let segmentOffset = 0;

    return segment.text.split(markerPattern).flatMap<ContentToken>(part => {
      if (!part) {
        return [];
      }

      const segmentTextStart = segmentOffset;
      const segmentTextEnd = segmentTextStart + part.length;
      segmentOffset = segmentTextEnd;

      const imageMatch = part.match(/^\[图片(\d+)\]$/);
      if (imageMatch) {
        return [
          {
            type: 'image' as const,
            imageIndex: parseInt(imageMatch[1], 10),
            marker: part,
          },
        ];
      }

      const audioMatch = part.match(/^\[音频(\d+)\]$/);
      if (audioMatch) {
        return [
          {
            type: 'audio' as const,
            audioIndex: parseInt(audioMatch[1], 10),
            marker: part,
          },
        ];
      }

      return [
        {
          type: 'text' as const,
          segmentIndex,
          segmentTextStart,
          segmentTextEnd,
          text: part,
          fontSize: segment.fontSize ?? defaultFontSize,
          isBold: segment.isBold ?? defaultIsBold,
          isItalic: segment.isItalic ?? defaultIsItalic,
          color: segment.color ?? defaultTextColor,
        },
      ];
    });
  });
};

export const getTokenLength = (token: ContentToken): number => {
  return token.type === 'text' ? token.text.length : token.marker.length;
};

export const getTokenOffsetBeforeIndex = (
  tokens: ContentToken[],
  tokenIndex: number,
): number => {
  return tokens
    .slice(0, tokenIndex)
    .reduce((total, currentToken) => total + getTokenLength(currentToken), 0);
};
