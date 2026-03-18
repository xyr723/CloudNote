import {
  createNoteDocumentMirrorInput,
  createWidgetOnlyDocument,
} from './noteEditorDocument';

describe('noteEditorDocument', () => {
  test('normalizes media markers into preview-friendly mirror text', () => {
    expect(
      createNoteDocumentMirrorInput('开头[图片0]中间[音频1]结尾'),
    ).toBe('开头\n\n图片占位 1\n\n中间\n\n音频占位 2\n\n结尾');
  });

  test('extracts a widget-only document from a mixed live document', () => {
    expect(
      createWidgetOnlyDocument({
        version: '1.0',
        plainText: '正文',
        blocks: [
          {
            id: 'block-1',
            type: 'paragraph',
            text: '正文',
          },
          {
            id: 'widget-1',
            type: 'widget',
            widget: {
              id: 'todo-1',
              type: 'todo-list',
              title: '待办',
              props: {
                items: ['一', '二'],
              },
            },
          },
        ],
      }),
    ).toEqual({
      version: '1.0',
      blocks: [
        {
          id: 'widget-1',
          type: 'widget',
          widget: {
            id: 'todo-1',
            type: 'todo-list',
            title: '待办',
            props: {
              items: ['一', '二'],
            },
          },
        },
      ],
    });
  });
});
