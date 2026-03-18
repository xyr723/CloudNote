import type {RichDocument} from '../../../entities/document/types';
import {extractWidgetBlocks} from '../../../entities/note/document';

export const createNoteDocumentMirrorInput = (content: string): string => {
  if (!content.trim()) {
    return '';
  }

  return content
    .replace(/\[图片(\d+)\]/g, (_, index: string) => {
      return `\n\n图片占位 ${parseInt(index, 10) + 1}\n\n`;
    })
    .replace(/\[音频(\d+)\]/g, (_, index: string) => {
      return `\n\n音频占位 ${parseInt(index, 10) + 1}\n\n`;
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const hasSyncedNoteDocumentMirror = (
  document: RichDocument | undefined,
  content: string,
): document is RichDocument => {
  return Boolean(
    document && document.plainText === createNoteDocumentMirrorInput(content),
  );
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

export const createWidgetOnlyDocument = (
  document?: RichDocument,
): RichDocument | undefined => {
  if (!document) {
    return undefined;
  }

  return {
    version: document.version,
    blocks: extractWidgetBlocks(document),
  };
};
