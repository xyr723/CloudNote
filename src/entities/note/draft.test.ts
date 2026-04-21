import {
  applyDraftContentChange,
  createDraftFromNote,
  createEmptyNoteDraft,
} from './draft';

describe('note draft helpers', () => {
  test('createEmptyNoteDraft starts with an empty live document mirror', () => {
    expect(createEmptyNoteDraft()).toEqual({
      title: '',
      content: '',
      document: {
        version: '1.0',
        blocks: [],
        plainText: '',
      },
    });
  });

  test('createDraftFromNote refreshes stale live document mirror while preserving widget blocks', () => {
    const note = {
      id: 'note-1',
      title: '标题',
      content: '新正文',
      timestamp: new Date('2026-04-21T00:00:00.000Z'),
      document: {
        version: '1.0' as const,
        blocks: [
          {
            id: 'paragraph-old',
            type: 'paragraph' as const,
            text: '旧正文',
          },
          {
            id: 'widget-existing',
            type: 'widget' as const,
            widget: {
              id: 'todo-1',
              type: 'todo-list' as const,
              title: '待办',
              props: {
                items: ['一'],
              },
            },
          },
        ],
        plainText: '旧正文',
      },
    };

    expect(createDraftFromNote(note)).toMatchObject({
      id: 'note-1',
      title: '标题',
      content: '新正文',
      document: {
        version: '1.0',
        blocks: [
          {
            id: 'paragraph-old',
            type: 'paragraph',
            text: '新正文',
          },
          {
            id: 'widget-existing',
            type: 'widget',
            widget: {
              id: 'todo-1',
              type: 'todo-list',
              title: '待办',
            },
          },
        ],
        plainText: '新正文',
      },
    });
  });

  test('applyDraftContentChange refreshes live document mirror and preserves widgets', () => {
    expect(
      applyDraftContentChange(
        {
          id: 'note-1',
          title: '标题',
          content: '旧正文',
          document: {
            version: '1.0',
            blocks: [
              {
                id: 'paragraph-old',
                type: 'paragraph',
                text: '旧正文',
              },
              {
                id: 'widget-existing',
                type: 'widget',
                widget: {
                  id: 'todo-1',
                  type: 'todo-list',
                  title: '待办',
                  props: {
                    items: ['一'],
                  },
                },
              },
            ],
            plainText: '旧正文',
          },
        },
        '新正文[图片0]',
      ),
    ).toMatchObject({
      id: 'note-1',
      title: '标题',
      content: '新正文[图片0]',
      document: {
        version: '1.0',
        blocks: [
          {
            id: 'paragraph-old',
            type: 'paragraph',
            text: '新正文',
          },
          {
            id: 'widget-existing',
            type: 'widget',
            widget: {
              id: 'todo-1',
              type: 'todo-list',
              title: '待办',
            },
          },
          {
            id: 'block-2',
            type: 'paragraph',
            text: '图片占位 1',
          },
        ],
        plainText: '新正文\n\n图片占位 1',
      },
    });
  });
});
