import type {RichDocument, WidgetBlock} from '../document/types';
import type {WidgetSchema} from '../widget/types';
import {
  appendWidgetSchemasToDocument,
  extractWidgetBlocks,
  hasWidgetBlocks,
  mergeTextDocumentWithWidgets,
} from './document';

const buildWidget = (id: string): WidgetSchema => ({
  id,
  type: 'todo-list',
  title: `Widget ${id}`,
  props: {
    items: ['a', 'b'],
  },
});

const buildWidgetBlock = (id: string): WidgetBlock => ({
  id: `block-${id}`,
  type: 'widget',
  widget: buildWidget(id),
});

describe('note document helpers', () => {
  test('extractWidgetBlocks returns an empty array for undefined document', () => {
    expect(extractWidgetBlocks(undefined)).toEqual([]);
  });

  test('extractWidgetBlocks only returns widget blocks', () => {
    const widgetBlock = buildWidgetBlock('1');
    const document: RichDocument = {
      version: '1.0',
      blocks: [
        {
          id: 'paragraph-1',
          type: 'paragraph',
          text: '正文',
        },
        widgetBlock,
        {
          id: 'list-1',
          type: 'list',
          items: ['一', '二'],
        },
      ],
    };

    expect(extractWidgetBlocks(document)).toEqual([widgetBlock]);
  });

  test('mergeTextDocumentWithWidgets appends existing widget blocks after text blocks', () => {
    const textDocument: RichDocument = {
      version: '1.0',
      blocks: [
        {
          id: 'paragraph-1',
          type: 'paragraph',
          text: '新的正文',
        },
      ],
      plainText: '新的正文',
    };
    const widgetBlock = buildWidgetBlock('existing');
    const existingDocument: RichDocument = {
      version: '1.0',
      blocks: [
        {
          id: 'paragraph-old',
          type: 'paragraph',
          text: '旧正文',
        },
        widgetBlock,
      ],
      plainText: '旧正文',
    };

    expect(mergeTextDocumentWithWidgets(textDocument, existingDocument)).toEqual(
      {
        version: '1.0',
        blocks: [textDocument.blocks[0], widgetBlock],
        plainText: '新的正文',
      },
    );
  });

  test('appendWidgetSchemasToDocument appends mapped widget blocks to document tail', () => {
    const baseDocument: RichDocument = {
      version: '1.0',
      blocks: [
        {
          id: 'paragraph-1',
          type: 'paragraph',
          text: '正文',
        },
      ],
      plainText: '正文',
    };
    const widgets = [buildWidget('new-1'), buildWidget('new-2')];

    expect(appendWidgetSchemasToDocument(baseDocument, widgets)).toEqual({
      version: '1.0',
      blocks: [
        baseDocument.blocks[0],
        {
          id: 'widget-new-1',
          type: 'widget',
          widget: widgets[0],
        },
        {
          id: 'widget-new-2',
          type: 'widget',
          widget: widgets[1],
        },
      ],
      plainText: '正文',
    });
  });

  test('hasWidgetBlocks only returns true when widget blocks exist', () => {
    expect(
      hasWidgetBlocks({
        version: '1.0',
        blocks: [
          {
            id: 'paragraph-1',
            type: 'paragraph',
            text: '正文',
          },
        ],
      }),
    ).toBe(false);

    expect(
      hasWidgetBlocks({
        version: '1.0',
        blocks: [buildWidgetBlock('1')],
      }),
    ).toBe(true);
  });
});
