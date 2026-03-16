import type {
  DocumentBlock,
  RichDocument,
  TextBlock,
} from '../../../entities/document/types';
import type {EditorProvider} from '../editorProvider';

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const renderTextBlock = (block: TextBlock): string => {
  const content = escapeHtml(block.text);

  switch (block.type) {
    case 'heading':
      return `<h${block.level ?? 1}>${content}</h${block.level ?? 1}>`;
    case 'quote':
      return `<blockquote>${content}</blockquote>`;
    case 'code':
      return `<pre><code>${content}</code></pre>`;
    case 'paragraph':
    default:
      return `<p>${content}</p>`;
  }
};

const renderBlockHtml = (block: DocumentBlock): string => {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
    case 'quote':
    case 'code':
      return renderTextBlock(block);
    case 'list': {
      const tagName = block.ordered ? 'ol' : 'ul';
      const items = block.items
        .map(item => `<li>${escapeHtml(item)}</li>`)
        .join('');

      return `<${tagName}>${items}</${tagName}>`;
    }
    case 'widget':
      const widgetTitle = block.widget.title ?? block.widget.type;

      return [
        `<div class="widget-placeholder" data-widget-id="${escapeHtml(block.widget.id)}" data-widget-type="${escapeHtml(block.widget.type)}">`,
        `<strong>${escapeHtml(widgetTitle)}</strong>`,
        '</div>',
      ].join('');
  }
};

export class LocalHtmlEditorProvider implements EditorProvider {
  async parse(input: string): Promise<RichDocument> {
    const blocks = input
      .split(/\n\s*\n/)
      .map(part => part.trim())
      .filter(part => part.length > 0)
      .map((text, index) => ({
        id: `block-${index + 1}`,
        type: 'paragraph' as const,
        text,
      }));

    return {
      version: '1.0',
      blocks,
      plainText: input,
    };
  }

  async serialize(document: RichDocument): Promise<string> {
    return document.blocks
      .map(block => {
        switch (block.type) {
          case 'paragraph':
          case 'heading':
          case 'quote':
          case 'code':
            return block.text;
          case 'list':
            return block.items.join('\n');
          case 'widget':
            return block.widget.title ?? block.widget.type;
        }
      })
      .join('\n\n');
  }

  async renderHtml(document: RichDocument): Promise<string> {
    return document.blocks.map(renderBlockHtml).join('');
  }
}
