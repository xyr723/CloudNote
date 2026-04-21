import type {RichDocument, WidgetBlock} from '../document/types';
import type {Note} from './types';
import type {WidgetSchema} from '../widget/types';

const EMPTY_DOCUMENT: RichDocument = {
  version: '1.0',
  blocks: [],
};

export type WidgetMoveDirection = 'up' | 'down';

export const createNoteDocumentMirrorInput = (content: string): string => {
  if (!content.trim()) {
    return '';
  }

  return content
    .replace(/\[图片(\d+)\]/g, (_marker, index: string) => {
      return `\n\n图片占位 ${parseInt(index, 10) + 1}\n\n`;
    })
    .replace(/\[音频(\d+)\]/g, (_marker, index: string) => {
      return `\n\n音频占位 ${parseInt(index, 10) + 1}\n\n`;
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const createMirrorTextBlocks = (
  plainText: string,
): RichDocument['blocks'] => {
  return plainText
    .split(/\n\s*\n/)
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .map((text, index) => ({
      id: `block-${index + 1}`,
      type: 'paragraph' as const,
      text,
    }));
};

export const createNoteTextMirrorDocument = (
  content: string,
): RichDocument => {
  const plainText = createNoteDocumentMirrorInput(content);

  return {
    version: '1.0',
    blocks: createMirrorTextBlocks(plainText),
    plainText,
  };
};

const isWidgetBlock = (
  block: RichDocument['blocks'][number],
): block is WidgetBlock => {
  return block.type === 'widget';
};

const isNonWidgetBlock = (
  block: RichDocument['blocks'][number],
): block is Exclude<RichDocument['blocks'][number], WidgetBlock> => {
  return !isWidgetBlock(block);
};

const resolveWidgetInsertIndex = (
  blocks: RichDocument['blocks'],
  afterBlockId?: string | null,
): number => {
  if (afterBlockId == null) {
    const firstWidgetIndex = blocks.findIndex(isWidgetBlock);

    return firstWidgetIndex === -1 ? blocks.length : firstWidgetIndex;
  }

  const targetBlockIndex = blocks.findIndex(block => {
    return block.id === afterBlockId;
  });

  return targetBlockIndex === -1 ? blocks.length : targetBlockIndex + 1;
};

const createWidgetBlockId = (
  widget: WidgetSchema,
  usedIds: Set<string>,
): string => {
  const baseId = `widget-${widget.id}`;

  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  let suffix = 1;
  let candidateId = `${baseId}-${suffix}`;

  while (usedIds.has(candidateId)) {
    suffix += 1;
    candidateId = `${baseId}-${suffix}`;
  }

  usedIds.add(candidateId);
  return candidateId;
};

export const extractWidgetBlocks = (
  document?: RichDocument,
): WidgetBlock[] => {
  if (!document) {
    return [];
  }

  return document.blocks.filter(isWidgetBlock);
};

export const findWidgetBlock = (
  document: RichDocument | undefined,
  blockId: string,
): WidgetBlock | null => {
  if (!document) {
    return null;
  }

  const block = document.blocks.find(candidate => candidate.id === blockId);

  return block && isWidgetBlock(block) ? block : null;
};

export const replaceWidgetBlock = (
  document: RichDocument,
  blockId: string,
  nextWidget: WidgetSchema,
): RichDocument => {
  let didReplace = false;
  const nextBlocks = document.blocks.map(block => {
    if (block.id !== blockId || !isWidgetBlock(block)) {
      return block;
    }

    didReplace = true;

    return {
      ...block,
      widget: nextWidget,
    };
  });

  if (!didReplace) {
    return document;
  }

  return {
    ...document,
    blocks: nextBlocks,
  };
};

export const removeWidgetBlock = (
  document: RichDocument,
  blockId: string,
): RichDocument => {
  const nextBlocks = document.blocks.filter(block => block.id !== blockId);

  if (nextBlocks.length === document.blocks.length) {
    return document;
  }

  return {
    ...document,
    blocks: nextBlocks,
  };
};

export const moveWidgetBlock = (
  document: RichDocument,
  blockId: string,
  direction: WidgetMoveDirection,
): RichDocument => {
  const widgetBlocks = extractWidgetBlocks(document);
  const currentIndex = widgetBlocks.findIndex(block => block.id === blockId);

  if (currentIndex === -1) {
    return document;
  }

  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (nextIndex < 0 || nextIndex >= widgetBlocks.length) {
    return document;
  }

  const reorderedWidgetBlocks = [...widgetBlocks];
  [reorderedWidgetBlocks[currentIndex], reorderedWidgetBlocks[nextIndex]] = [
    reorderedWidgetBlocks[nextIndex],
    reorderedWidgetBlocks[currentIndex],
  ];

  let widgetIndex = 0;
  let didChange = false;
  const nextBlocks = document.blocks.map(block => {
    if (!isWidgetBlock(block)) {
      return block;
    }

    const reorderedBlock = reorderedWidgetBlocks[widgetIndex];
    widgetIndex += 1;
    didChange = didChange || reorderedBlock !== block;

    return reorderedBlock;
  });

  if (!didChange) {
    return document;
  }

  return {
    ...document,
    blocks: nextBlocks,
  };
};

export const repositionWidgetBlock = (
  document: RichDocument,
  blockId: string,
  afterBlockId?: string | null,
): RichDocument => {
  const currentIndex = document.blocks.findIndex(block => {
    return block.id === blockId && isWidgetBlock(block);
  });

  if (currentIndex === -1 || afterBlockId === blockId) {
    return document;
  }

  const targetBlock = document.blocks[currentIndex];
  const remainingBlocks = document.blocks.filter(block => block.id !== blockId);
  const insertIndex = resolveWidgetInsertIndex(remainingBlocks, afterBlockId);
  const nextBlocks = [
    ...remainingBlocks.slice(0, insertIndex),
    targetBlock,
    ...remainingBlocks.slice(insertIndex),
  ];

  if (
    nextBlocks.length === document.blocks.length &&
    nextBlocks.every((block, index) => block === document.blocks[index])
  ) {
    return document;
  }

  return {
    ...document,
    blocks: nextBlocks,
  };
};

export const appendWidgetBlock = (
  document: RichDocument | undefined,
  widget: WidgetSchema,
): RichDocument => {
  return appendWidgetSchemasToDocument(document, [widget]);
};

export const insertWidgetBlock = (
  document: RichDocument | undefined,
  widget: WidgetSchema,
  afterBlockId?: string | null,
): RichDocument => {
  return insertWidgetSchemasToDocument(document, [widget], afterBlockId);
};

export const mergeTextDocumentWithWidgets = (
  textDocument: RichDocument,
  existingDocument?: RichDocument,
): RichDocument => {
  if (!existingDocument || !hasWidgetBlocks(existingDocument)) {
    return textDocument;
  }

  const nextTextBlocks = textDocument.blocks.filter(isNonWidgetBlock);
  let textBlockIndex = 0;

  const nextBlocks: RichDocument['blocks'] = [];

  existingDocument.blocks.forEach(block => {
    if (isWidgetBlock(block)) {
      nextBlocks.push(block);
      return;
    }

    const nextTextBlock = nextTextBlocks[textBlockIndex];

    if (!nextTextBlock || isWidgetBlock(nextTextBlock)) {
      return;
    }

    textBlockIndex += 1;
    nextBlocks.push({
      ...nextTextBlock,
      id: block.id,
    });
  });

  if (textBlockIndex < nextTextBlocks.length) {
    nextBlocks.push(...nextTextBlocks.slice(textBlockIndex));
  }

  return {
    ...textDocument,
    blocks: nextBlocks,
  };
};

export const createLiveNoteDocument = ({
  content,
  document,
}: {
  content: string;
  document?: RichDocument;
}): RichDocument => {
  return mergeTextDocumentWithWidgets(
    createNoteTextMirrorDocument(content),
    document,
  );
};

export const getNotePlainTextPreview = ({
  content,
  document,
}: Pick<Note, 'content' | 'document'>): string => {
  return document?.plainText ?? createNoteDocumentMirrorInput(content);
};

export const appendWidgetSchemasToDocument = (
  document: RichDocument | undefined,
  widgets: WidgetSchema[],
): RichDocument => {
  const baseDocument = document ?? EMPTY_DOCUMENT;

  if (widgets.length === 0) {
    return baseDocument;
  }

  const usedIds = new Set(baseDocument.blocks.map(block => block.id));
  const widgetBlocks: WidgetBlock[] = widgets.map(widget => ({
    id: createWidgetBlockId(widget, usedIds),
    type: 'widget',
    widget,
  }));

  return {
    ...baseDocument,
    blocks: [...baseDocument.blocks, ...widgetBlocks],
  };
};

export const insertWidgetSchemasToDocument = (
  document: RichDocument | undefined,
  widgets: WidgetSchema[],
  afterBlockId?: string | null,
): RichDocument => {
  const baseDocument = document ?? EMPTY_DOCUMENT;

  if (widgets.length === 0) {
    return baseDocument;
  }

  const usedIds = new Set(baseDocument.blocks.map(block => block.id));
  const widgetBlocks: WidgetBlock[] = widgets.map(widget => ({
    id: createWidgetBlockId(widget, usedIds),
    type: 'widget',
    widget,
  }));
  const insertIndex = resolveWidgetInsertIndex(
    baseDocument.blocks,
    afterBlockId,
  );

  return {
    ...baseDocument,
    blocks: [
      ...baseDocument.blocks.slice(0, insertIndex),
      ...widgetBlocks,
      ...baseDocument.blocks.slice(insertIndex),
    ],
  };
};

export const hasWidgetBlocks = (document?: RichDocument): boolean => {
  return extractWidgetBlocks(document).length > 0;
};
