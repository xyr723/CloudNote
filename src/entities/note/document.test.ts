import type {RichDocument, WidgetBlock} from '../document/types';
import type {Note} from './types';
import type {WidgetSchema} from '../widget/types';
import {
  appendWidgetBlock,
  appendWidgetSchemasToDocument,
  createLiveNoteDocument,
  extractWidgetBlocks,
  findWidgetBlock,
  getNotePlainTextPreview,
  hasWidgetBlocks,
  insertWidgetBlock,
  mergeTextDocumentWithWidgets,
  moveWidgetBlock,
  repositionWidgetBlock,
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

  test('mergeTextDocumentWithWidgets keeps existing widget positions while refreshing text blocks', () => {
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
        blocks: [
          {
            ...textDocument.blocks[0],
            id: 'paragraph-old',
          },
          widgetBlock,
        ],
        plainText: '新的正文',
      },
    );
  });

  test('createLiveNoteDocument rebuilds mirror text blocks and preserves widget order', () => {
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

    expect(
      createLiveNoteDocument({
        content: '新正文[图片0]',
        document: existingDocument,
      }),
    ).toEqual({
      version: '1.0',
      blocks: [
        {
          id: 'paragraph-old',
          type: 'paragraph',
          text: '新正文',
        },
        widgetBlock,
        {
          id: 'block-2',
          type: 'paragraph',
          text: '图片占位 1',
        },
      ],
      plainText: '新正文\n\n图片占位 1',
    });
  });

  test('createLiveNoteDocument preserves existing non-widget block types while refreshing mirror text', () => {
    const existingDocument: RichDocument = {
      version: '1.0',
      blocks: [
        {
          id: 'heading-1',
          type: 'heading',
          level: 2,
          text: '旧标题',
        },
        {
          id: 'list-1',
          type: 'list',
          items: ['旧事项一', '旧事项二'],
          ordered: true,
        },
        {
          id: 'quote-1',
          type: 'quote',
          text: '旧引用',
        },
      ],
      plainText: '旧标题\n\n旧事项一\n旧事项二\n\n旧引用',
    };

    expect(
      createLiveNoteDocument({
        content: '新标题\n\n事项一\n事项二\n\n新引用',
        document: existingDocument,
      }),
    ).toEqual({
      version: '1.0',
      blocks: [
        {
          id: 'heading-1',
          type: 'heading',
          level: 2,
          text: '新标题',
        },
        {
          id: 'list-1',
          type: 'list',
          items: ['事项一', '事项二'],
          ordered: true,
        },
        {
          id: 'quote-1',
          type: 'quote',
          text: '新引用',
        },
      ],
      plainText: '新标题\n\n事项一\n事项二\n\n新引用',
    });
  });

  test('getNotePlainTextPreview prefers document plainText when available', () => {
    const note = {
      id: 'note-1',
      title: '标题',
      content: '前文[图片0]后文',
      timestamp: new Date('2026-04-21T00:00:00.000Z'),
      document: {
        version: '1.0' as const,
        blocks: [
          {
            id: 'block-1',
            type: 'paragraph' as const,
            text: '前文',
          },
          {
            id: 'block-2',
            type: 'paragraph' as const,
            text: '图片占位 1',
          },
          {
            id: 'block-3',
            type: 'paragraph' as const,
            text: '后文',
          },
        ],
        plainText: '前文\n\n图片占位 1\n\n后文',
      },
    } satisfies Note;

    expect(getNotePlainTextPreview(note)).toBe('前文\n\n图片占位 1\n\n后文');
  });

  test('getNotePlainTextPreview falls back to normalized mirror content', () => {
    expect(
      getNotePlainTextPreview({
        content: '前文[音频0]后文',
      }),
    ).toBe('前文\n\n音频占位 1\n\n后文');
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

  test('insertWidgetBlock inserts after the target text block', () => {
    const firstWidgetBlock = buildWidgetBlock('1');
    const document: RichDocument = {
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
        firstWidgetBlock,
      ],
      plainText: '前文\n\n后文',
    };
    const widget = buildWidget('middle');

    expect(insertWidgetBlock(document, widget, 'paragraph-1')).toEqual({
      version: '1.0',
      blocks: [
        document.blocks[0],
        {
          id: 'widget-middle',
          type: 'widget',
          widget,
        },
        document.blocks[1],
        firstWidgetBlock,
      ],
      plainText: '前文\n\n后文',
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

  test('repositionWidgetBlock moves a widget after the requested text block', () => {
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

    expect(
      repositionWidgetBlock(document, firstWidgetBlock.id, 'paragraph-2'),
    ).toEqual({
      version: '1.0',
      blocks: [
        document.blocks[0],
        document.blocks[2],
        firstWidgetBlock,
        secondWidgetBlock,
      ],
      plainText: '前文\n\n后文',
    });
  });
});
