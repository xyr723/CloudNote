import type {TextSegment} from '../../../entities/note/types';

const NOTE_MARKER_PATTERN = /(\[图片\d+\]|\[音频\d+\])/g;

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const getTextSegmentsContent = (textSegments: TextSegment[]): string => {
  return textSegments.map(segment => segment.text).join('');
};

const hasSyncedTextSegments = (
  textSegments: TextSegment[] | undefined,
  content: string,
): textSegments is TextSegment[] => {
  return Boolean(
    textSegments && getTextSegmentsContent(textSegments) === content,
  );
};

const createNoteMarkerLabel = (marker: string): string => {
  const imageMatch = marker.match(/^\[图片(\d+)\]$/);

  if (imageMatch) {
    return `图片 ${parseInt(imageMatch[1], 10) + 1}`;
  }

  const audioMatch = marker.match(/^\[音频(\d+)\]$/);

  if (audioMatch) {
    return `音频 ${parseInt(audioMatch[1], 10) + 1}`;
  }

  return marker;
};

const resolveNoteMarkerDeleteMeta = (
  marker: string,
): {kind: 'image' | 'audio'; index: number} | null => {
  const imageMatch = marker.match(/^\[图片(\d+)\]$/);

  if (imageMatch) {
    return {
      kind: 'image',
      index: parseInt(imageMatch[1], 10),
    };
  }

  const audioMatch = marker.match(/^\[音频(\d+)\]$/);

  if (audioMatch) {
    return {
      kind: 'audio',
      index: parseInt(audioMatch[1], 10),
    };
  }

  return null;
};

const createNoteMarkerHtml = (marker: string): string => {
  const deleteMeta = resolveNoteMarkerDeleteMeta(marker);

  return [
    '<span class="note-marker"',
    ` data-note-marker="${escapeHtml(marker)}"`,
    ' contenteditable="false">',
    '<span class="note-marker-label">',
    `${escapeHtml(createNoteMarkerLabel(marker))}`,
    '</span>',
    deleteMeta
      ? [
          '<button',
          ' type="button"',
          ' class="note-marker-remove"',
          ` data-note-marker-delete-kind="${deleteMeta.kind}"`,
          ` data-note-marker-delete-index="${deleteMeta.index}"`,
          ' aria-label="删除媒体">',
          '&times;',
          '</button>',
        ].join('')
      : '',
    '</span>',
  ].join('');
};

const createSegmentContentHtml = (text: string): string => {
  return text
    .split(NOTE_MARKER_PATTERN)
    .map(part => {
      if (!part) {
        return '';
      }

      return NOTE_MARKER_PATTERN.test(part)
        ? createNoteMarkerHtml(part)
        : escapeHtml(part);
    })
    .join('');
};

const resolveTextSegments = ({
  content,
  textSegments,
  fallbackFontSize,
  defaultTextColor,
}: {
  content: string;
  textSegments?: TextSegment[];
  fallbackFontSize: number;
  defaultTextColor: string;
}): TextSegment[] => {
  if (hasSyncedTextSegments(textSegments, content)) {
    return textSegments;
  }

  return [
    {
      text: content,
      fontSize: fallbackFontSize,
      isBold: false,
      color: defaultTextColor,
    },
  ];
};

const createSegmentStyle = ({
  defaultTextColor,
  fallbackFontSize,
  segment,
}: {
  defaultTextColor: string;
  fallbackFontSize: number;
  segment: TextSegment;
}): string => {
  const color = segment.color ?? defaultTextColor;
  const fontSize = segment.fontSize ?? fallbackFontSize;
  const fontWeight = segment.isBold ? 'bold' : 'normal';
  const fontStyle = segment.isItalic ? 'italic' : 'normal';

  return [
    `font-size: ${fontSize}px`,
    `font-weight: ${fontWeight}`,
    `font-style: ${fontStyle}`,
    `color: ${color}`,
  ].join('; ');
};

const createSegmentHtml = ({
  defaultTextColor,
  fallbackFontSize,
  segment,
}: {
  defaultTextColor: string;
  fallbackFontSize: number;
  segment: TextSegment;
}): string => {
  const color = segment.color ?? defaultTextColor;
  const fontSize = segment.fontSize ?? fallbackFontSize;

  return [
    '<span class="note-text-segment"',
    ` data-note-font-size="${fontSize}"`,
    ` data-note-is-bold="${segment.isBold ? 'true' : 'false'}"`,
    ` data-note-is-italic="${segment.isItalic ? 'true' : 'false'}"`,
    ` data-note-color="${escapeHtml(color)}"`,
    ` style="${createSegmentStyle({
      defaultTextColor,
      fallbackFontSize,
      segment,
    })}">`,
    `${createSegmentContentHtml(segment.text)}`,
    '</span>',
  ].join('');
};

export const createH5TextEditorBodyHtml = ({
  content,
  textSegments,
  fallbackFontSize,
  defaultTextColor,
}: {
  content: string;
  textSegments?: TextSegment[];
  fallbackFontSize: number;
  defaultTextColor: string;
}): string => {
  return resolveTextSegments({
    content,
    textSegments,
    fallbackFontSize,
    defaultTextColor,
  })
    .map(segment =>
      createSegmentHtml({
        defaultTextColor,
        fallbackFontSize,
        segment,
      }),
    )
    .join('');
};
