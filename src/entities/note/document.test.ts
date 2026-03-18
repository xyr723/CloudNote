import type {RichDocument, WidgetBlock} from '../document/types';
import type {WidgetSchema} from '../widget/types';
import {
  appendWidgetBlock,
  appendWidgetSchemasToDocument,
  extractWidgetBlocks,
  findWidgetBlock,
  hasWidgetBlocks,
  insertWidgetBlock,
  mergeTextDocumentWithWidgets,
  moveWidgetBlock,
  removeWidgetBlock,
  replaceWidgetBlock,
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

  test('findWidgetBlock locates widget block by block id', () => {
    const widgetBlock = buildWidgetBlock('target');
    const document: RichDocument = {
      version: '1.0',
      blocks: [
        {
          id: 'paragraph-1',
          type: 'paragraph',
          text: '正文',
        },
        widgetBlock,
      ],
    };

    expect(findWidgetBlock(document, widgetBlock.id)).toEqual(widgetBlock);
  });

  test('replaceWidgetBlock only replaces the widget of the target block', () => {
    const firstWidgetBlock = buildWidgetBlock('1');
    const secondWidgetBlock = buildWidgetBlock('2');
    const nextWidget = buildWidget('next');
    const document: RichDocument = {
      version: '1.0',
      blocks: [firstWidgetBlock, secondWidgetBlock],
    };

    expect(replaceWidgetBlock(document, secondWidgetBlock.id, nextWidget)).toEqual(
      {
        version: '1.0',
        blocks: [
          firstWidgetBlock,
          {
            ...secondWidgetBlock,
            widget: nextWidget,
          },
        ],
      },
    );
  });

  test('removeWidgetBlock removes target widget block and keeps other block order', () => {
    const document: RichDocument = {
      version: '1.0',
      blocks: [
        {
          id: 'paragraph-1',
          type: 'paragraph',
          text: '前文',
        },
        buildWidgetBlock('1'),
        {
          id: 'paragraph-2',
          type: 'paragraph',
          text: '后文',
        },
      ],
    };

    expect(removeWidgetBlock(document, 'block-1')).toEqual({
      version: '1.0',
      blocks: [
        {
          id: 'paragraph-1',
          type: 'paragraph',
          text: '前文',
        },
        {
          id: 'paragraph-2',
          type: 'paragraph',
          text: '后文',
        },
      ],
    });
  });

  test('appendWidgetBlock appends a new widget block to the document tail', () => {
    const document: RichDocument = {
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
    const widget = buildWidget('tail');

    expect(appendWidgetBlock(document, widget)).toEqual({
      version: '1.0',
      blocks: [
        document.blocks[0],
        {
          id: 'widget-tail',
          type: 'widget',
          widget,
        },
      ],
      plainText: '正文',
    });
  });

  test('insertWidgetBlock inserts before the first widget when afterBlockId is null', () => {
    const firstWidgetBlock = buildWidgetBlock('1');
    const secondWidgetBlock = buildWidgetBlock('2');
    const document: RichDocument = {
      version: '1.0',
      blocks: [
        {
          id: 'paragraph-1',
          type: 'paragraph',
          text: '正文',
        },
        firstWidgetBlock,
        secondWidgetBlock,
      ],
      plainText: '正文',
    };
    const widget = buildWidget('new-head');

    expect(insertWidgetBlock(document, widget, null)).toEqual({
      version: '1.0',
      blocks: [
        document.blocks[0],
        {
          id: 'widget-new-head',
          type: 'widget',
          widget,
        },
        firstWidgetBlock,
        secondWidgetBlock,
      ],
      plainText: '正文',
    });
  });

  test('insertWidgetBlock inserts after the target widget block', () => {
    const firstWidgetBlock = buildWidgetBlock('1');
    const secondWidgetBlock = buildWidgetBlock('2');
    const document: RichDocument = {
      version: '1.0',
      blocks: [firstWidgetBlock, secondWidgetBlock],
    };
    const widget = buildWidget('after-first');

    expect(insertWidgetBlock(document, widget, firstWidgetBlock.id)).toEqual({
      version: '1.0',
      blocks: [
        firstWidgetBlock,
        {
          id: 'widget-after-first',
          type: 'widget',
          widget,
        },
        secondWidgetBlock,
      ],
    });
  });

  test('insertWidgetBlock falls back to appending when afterBlockId is stale', () => {
    const firstWidgetBlock = buildWidgetBlock('1');
    const secondWidgetBlock = buildWidgetBlock('2');
    const document: RichDocument = {
      version: '1.0',
      blocks: [firstWidgetBlock, secondWidgetBlock],
    };
    const widget = buildWidget('tail-fallback');

    expect(insertWidgetBlock(document, widget, 'missing-widget-block')).toEqual({
      version: '1.0',
      blocks: [
        firstWidgetBlock,
        secondWidgetBlock,
        {
          id: 'widget-tail-fallback',
          type: 'widget',
          widget,
        },
      ],
    });
  });

  test('moveWidgetBlock reorders widget blocks while keeping text blocks in place', () => {
    const firstWidgetBlock = buildWidgetBlock('1');
    const secondWidgetBlock = buildWidgetBlock('2');
    const document: RichDocument = {
      version: '1.0',
      blocks: [
        {
          id: 'paragraph-1',
          type: 'paragraph',
          text: '前文',
        },
        firstWidgetBlock,
        {
          id: 'paragraph-2',
          type: 'paragraph',
          text: '后文',
        },
        secondWidgetBlock,
      ],
      plainText: '前文\n\n后文',
    };

    expect(moveWidgetBlock(document, secondWidgetBlock.id, 'up')).toEqual({
      version: '1.0',
      blocks: [
        {
          id: 'paragraph-1',
          type: 'paragraph',
          text: '前文',
        },
        secondWidgetBlock,
        {
          id: 'paragraph-2',
          type: 'paragraph',
          text: '后文',
        },
        firstWidgetBlock,
      ],
      plainText: '前文\n\n后文',
    });
  });
});
