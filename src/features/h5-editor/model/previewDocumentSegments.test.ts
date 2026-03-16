import {previewDocumentSegments} from './previewDocumentSegments';

describe('previewDocumentSegments', () => {
  test('groups consecutive non-widget blocks into html segments and keeps widget blocks isolated', () => {
    const document = {
      version: '1.0' as const,
      blocks: [
        {id: 'block-1', type: 'paragraph' as const, text: '第一段'},
        {
          id: 'block-2',
          type: 'list' as const,
          items: ['事项一', '事项二'],
        },
        {
          id: 'block-3',
          type: 'widget' as const,
          widget: {
            id: 'widget-1',
            type: 'todo-list' as const,
            title: '待办组件',
            props: {
              items: ['买菜', '写文档'],
            },
          },
        },
        {id: 'block-4', type: 'heading' as const, level: 2 as const, text: '第二节'},
        {id: 'block-5', type: 'code' as const, text: 'const x = 1;'},
      ],
    };

    expect(previewDocumentSegments(document)).toEqual([
      {
        type: 'html',
        blocks: [
          {id: 'block-1', type: 'paragraph', text: '第一段'},
          {id: 'block-2', type: 'list', items: ['事项一', '事项二']},
        ],
      },
      {
        type: 'widget',
        block: {
          id: 'block-3',
          type: 'widget',
          widget: {
            id: 'widget-1',
            type: 'todo-list',
            title: '待办组件',
            props: {
              items: ['买菜', '写文档'],
            },
          },
        },
      },
      {
        type: 'html',
        blocks: [
          {id: 'block-4', type: 'heading', level: 2, text: '第二节'},
          {id: 'block-5', type: 'code', text: 'const x = 1;'},
        ],
      },
    ]);
  });
});
