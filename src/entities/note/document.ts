import type {RichDocument, WidgetBlock} from '../document/types';
import type {WidgetSchema} from '../widget/types';

const EMPTY_DOCUMENT: RichDocument = {
  version: '1.0',
  blocks: [],
};

const isWidgetBlock = (
  block: RichDocument['blocks'][number],
): block is WidgetBlock => {
  return block.type === 'widget';
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

export const mergeTextDocumentWithWidgets = (
  textDocument: RichDocument,
  existingDocument?: RichDocument,
): RichDocument => {
  return {
    ...textDocument,
    blocks: [...textDocument.blocks, ...extractWidgetBlocks(existingDocument)],
  };
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

export const hasWidgetBlocks = (document?: RichDocument): boolean => {
  return extractWidgetBlocks(document).length > 0;
};
