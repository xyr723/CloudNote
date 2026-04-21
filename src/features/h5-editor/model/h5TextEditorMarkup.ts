import type {
  DocumentBlock,
  RichDocument,
  WidgetBlock,
} from '../../../entities/document/types';
import {extractWidgetBlocks} from '../../../entities/note/document';
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

const isWidgetBlock = (block: DocumentBlock): block is WidgetBlock => {
  return block.type === 'widget';
};

const resolveBlockTextContent = (block: Exclude<DocumentBlock, WidgetBlock>): string => {
  if (block.type === 'list') {
    return block.items.join('\n');
  }

  return block.text;
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

const cloneSegmentWithText = (
  segment: TextSegment,
  text: string,
): TextSegment => {
  const nextSegment: TextSegment = {
    text,
    fontSize: segment.fontSize,
  };

  if (segment.isBold) {
    nextSegment.isBold = true;
  }

  if (segment.isItalic) {
    nextSegment.isItalic = true;
  }

  if (segment.color) {
    nextSegment.color = segment.color;
  }

  return nextSegment;
};

type SegmentCursor = {
  segmentIndex: number;
  textOffset: number;
};

const takeSegmentSlice = (
  segments: TextSegment[],
  cursor: SegmentCursor,
  length: number,
): TextSegment[] | null => {
  const collectedSegments: TextSegment[] = [];
  let remainingLength = length;

  while (remainingLength > 0) {
    const currentSegment = segments[cursor.segmentIndex];

    if (!currentSegment) {
      return null;
    }

    const nextText = currentSegment.text.slice(
      cursor.textOffset,
      cursor.textOffset + remainingLength,
    );

    if (nextText.length === 0) {
      cursor.segmentIndex += 1;
      cursor.textOffset = 0;
      continue;
    }

    collectedSegments.push(cloneSegmentWithText(currentSegment, nextText));
    cursor.textOffset += nextText.length;
    remainingLength -= nextText.length;

    if (cursor.textOffset >= currentSegment.text.length) {
      cursor.segmentIndex += 1;
      cursor.textOffset = 0;
    }
  }

  return collectedSegments;
};

const advanceSegmentCursor = (
  segments: TextSegment[],
  cursor: SegmentCursor,
  length: number,
): boolean => {
  return takeSegmentSlice(segments, cursor, length) !== null;
};

const splitResolvedSegmentsByTextBlocks = ({
  segments,
  textBlocks,
}: {
  segments: TextSegment[];
  textBlocks: Array<Exclude<DocumentBlock, WidgetBlock>>;
}): TextSegment[][] | null => {
  const blockTexts = textBlocks.map(resolveBlockTextContent);
  const joinedBlockText = blockTexts.join('\n\n');

  if (joinedBlockText !== getTextSegmentsContent(segments)) {
    return null;
  }

  const cursor: SegmentCursor = {
    segmentIndex: 0,
    textOffset: 0,
  };
  const segmentedBlocks: TextSegment[][] = [];

  for (const [index, blockText] of blockTexts.entries()) {
    const nextSegments = takeSegmentSlice(segments, cursor, blockText.length);

    if (!nextSegments) {
      return null;
    }

    if (
      index < blockTexts.length - 1 &&
      !advanceSegmentCursor(segments, cursor, 2)
    ) {
      return null;
    }

    segmentedBlocks.push(nextSegments);
  }

  return segmentedBlocks;
};

const createTextBlockHtml = ({
  blockId,
  defaultTextColor,
  fallbackFontSize,
  segments,
}: {
  blockId: string;
  defaultTextColor: string;
  fallbackFontSize: number;
  segments: TextSegment[];
}): string => {
  const blockHtml = segments
    .map(segment =>
      createSegmentHtml({
        defaultTextColor,
        fallbackFontSize,
        segment,
      }),
    )
    .join('');

  return [
    '<div class="note-text-block"',
    ` data-note-text-block-id="${escapeHtml(blockId)}">`,
    blockHtml || '<br />',
    '</div>',
  ].join('');
};

const createWidgetPlaceholderHtml = ({
  block,
  canMoveDown,
  canMoveUp,
}: {
  block: WidgetBlock;
  canMoveDown: boolean;
  canMoveUp: boolean;
}): string => {
  const title = block.widget.title ?? block.widget.type;
  const description = block.widget.description;

  return [
    '<div class="note-widget-block"',
    ` data-widget-block-id="${escapeHtml(block.id)}"`,
    ` data-widget-id="${escapeHtml(block.widget.id)}"`,
    ` data-widget-type="${escapeHtml(block.widget.type)}"`,
    ' contenteditable="false"',
    ' tabindex="0">',
    '<div class="note-widget-meta">',
    `<div class="note-widget-title">${escapeHtml(title)}</div>`,
    description
      ? `<div class="note-widget-description">${escapeHtml(description)}</div>`
      : '',
    '</div>',
    '<div class="note-widget-actions">',
    '<button type="button" class="note-widget-button" data-widget-drag-handle="true" draggable="true">',
    '拖拽',
    '</button>',
    '<button type="button" class="note-widget-button" data-widget-action="move-up"',
    canMoveUp ? '' : ' disabled',
    '>',
    '上移',
    '</button>',
    '<button type="button" class="note-widget-button" data-widget-action="move-down"',
    canMoveDown ? '' : ' disabled',
    '>',
    '下移',
    '</button>',
    '<button type="button" class="note-widget-button" data-widget-action="edit">',
    '编辑',
    '</button>',
    '<button type="button" class="note-widget-button note-widget-button-danger" data-widget-action="delete">',
    '删除',
    '</button>',
    '</div>',
    '</div>',
  ].join('');
};

const createWidgetInsertButtonHtml = (afterBlockId?: string | null): string => {
  return [
    '<button type="button" class="note-widget-insert-button"',
    afterBlockId
      ? ` data-widget-insert-after-block-id="${escapeHtml(afterBlockId)}"`
      : '',
    ' data-widget-insert-request="true"',
    ' contenteditable="false">',
    '新增组件',
    '</button>',
  ].join('');
};

const createFallbackWidgetBlocksHtml = (document?: RichDocument): string => {
  if (!document) {
    return '';
  }

  const widgetBlocks = extractWidgetBlocks(document);

  if (widgetBlocks.length === 0) {
    return createWidgetInsertButtonHtml(null);
  }

  return [
    createWidgetInsertButtonHtml(null),
    ...widgetBlocks.flatMap((block, index) => [
      createWidgetPlaceholderHtml({
        block,
        canMoveUp: index > 0,
        canMoveDown: index < widgetBlocks.length - 1,
      }),
      createWidgetInsertButtonHtml(block.id),
    ]),
  ].join('');
};

const createFallbackBodyHtml = ({
  defaultTextColor,
  document,
  fallbackFontSize,
  segments,
}: {
  defaultTextColor: string;
  document?: RichDocument;
  fallbackFontSize: number;
  segments: TextSegment[];
}): string => {
  return [
    segments
      .map(segment =>
        createSegmentHtml({
          defaultTextColor,
          fallbackFontSize,
          segment,
        }),
      )
      .join(''),
    createFallbackWidgetBlocksHtml(document),
  ].join('');
};

const createOrderedDocumentHtml = ({
  defaultTextColor,
  document,
  fallbackFontSize,
  segments,
}: {
  defaultTextColor: string;
  document: RichDocument;
  fallbackFontSize: number;
  segments: TextSegment[];
}): string | null => {
  if (document.blocks.length === 0) {
    return null;
  }

  const textBlocks = document.blocks.filter(
    (block): block is Exclude<DocumentBlock, WidgetBlock> => !isWidgetBlock(block),
  );
  const segmentedTextBlocks = splitResolvedSegmentsByTextBlocks({
    segments,
    textBlocks,
  });

  if (!segmentedTextBlocks) {
    return null;
  }

  const widgetBlocks = extractWidgetBlocks(document);
  let textBlockIndex = 0;
  let widgetBlockIndex = 0;

  return document.blocks
    .flatMap(block => {
      if (isWidgetBlock(block)) {
        const currentWidgetIndex = widgetBlockIndex;
        widgetBlockIndex += 1;

        return [
          createWidgetPlaceholderHtml({
            block,
            canMoveUp: currentWidgetIndex > 0,
            canMoveDown: currentWidgetIndex < widgetBlocks.length - 1,
          }),
          createWidgetInsertButtonHtml(block.id),
        ];
      }

      const blockSegments = segmentedTextBlocks[textBlockIndex] ?? [];
      textBlockIndex += 1;

      return [
        createTextBlockHtml({
          blockId: block.id,
          defaultTextColor,
          fallbackFontSize,
          segments: blockSegments,
        }),
        createWidgetInsertButtonHtml(block.id),
      ];
    })
    .join('');
};

export const createH5TextEditorBodyHtml = ({
  content,
  document,
  textSegments,
  fallbackFontSize,
  defaultTextColor,
}: {
  content: string;
  document?: RichDocument;
  textSegments?: TextSegment[];
  fallbackFontSize: number;
  defaultTextColor: string;
}): string => {
  const resolvedSegments = resolveTextSegments({
    content,
    textSegments,
    fallbackFontSize,
    defaultTextColor,
  });

  if (document) {
    const orderedDocumentHtml = createOrderedDocumentHtml({
      defaultTextColor,
      document,
      fallbackFontSize,
      segments: resolvedSegments,
    });

    if (orderedDocumentHtml !== null) {
      return orderedDocumentHtml;
    }
  }

  return createFallbackBodyHtml({
    defaultTextColor,
    document,
    fallbackFontSize,
    segments: resolvedSegments,
  });
};
