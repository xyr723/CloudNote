import type {
  DocumentBlock,
  RichDocument,
  WidgetBlock,
} from '../../../entities/document/types';

export type PreviewHtmlBlock = Exclude<DocumentBlock, WidgetBlock>;

export type PreviewHtmlSegment = {
  type: 'html';
  blocks: PreviewHtmlBlock[];
};

export type PreviewWidgetSegment = {
  type: 'widget';
  block: WidgetBlock;
};

export type PreviewDocumentSegment =
  | PreviewHtmlSegment
  | PreviewWidgetSegment;

const isWidgetBlock = (block: DocumentBlock): block is WidgetBlock => {
  return block.type === 'widget';
};

const flushHtmlSegment = (
  segments: PreviewDocumentSegment[],
  htmlBlocks: PreviewHtmlBlock[],
): void => {
  if (htmlBlocks.length === 0) {
    return;
  }

  segments.push({
    type: 'html',
    blocks: [...htmlBlocks],
  });
};

export const previewDocumentSegments = (
  document: RichDocument,
): PreviewDocumentSegment[] => {
  const segments: PreviewDocumentSegment[] = [];
  const currentHtmlBlocks: PreviewHtmlBlock[] = [];

  document.blocks.forEach(block => {
    if (isWidgetBlock(block)) {
      flushHtmlSegment(segments, currentHtmlBlocks);
      currentHtmlBlocks.length = 0;
      segments.push({
        type: 'widget',
        block,
      });
      return;
    }

    currentHtmlBlocks.push(block);
  });

  flushHtmlSegment(segments, currentHtmlBlocks);

  return segments;
};
