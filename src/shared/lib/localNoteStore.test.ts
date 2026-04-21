import AsyncStorage from '@react-native-async-storage/async-storage';
import {Buffer} from 'buffer';
import {localNoteStore} from './localNoteStore';

const encodeString = (value: string): string => {
  return Buffer.from(unescape(encodeURIComponent(value)), 'binary').toString(
    'base64',
  );
};

const encodeNotesPayload = (value: unknown): string => {
  return JSON.stringify(value, (_key, item: unknown) => {
    if (typeof item === 'string') {
      return encodeString(item);
    }

    return item;
  });
};

const decodeNotesPayload = (value: string): unknown => {
  return JSON.parse(value, (_key, item: unknown) => {
    if (typeof item !== 'string') {
      return item;
    }

    try {
      return decodeURIComponent(
        escape(Buffer.from(item, 'base64').toString('binary')),
      );
    } catch (_error) {
      return item;
    }
  });
};

describe('localNoteStore', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  test('round-trips notes with document widget blocks', async () => {
    const note = {
      id: 'note-1',
      title: '标题',
      content: '正文',
      timestamp: new Date('2026-03-16T00:00:00.000Z'),
      document: {
        version: '1.0' as const,
        blocks: [
          {
            id: 'paragraph-1',
            type: 'paragraph' as const,
            text: '正文',
          },
          {
            id: 'widget-1',
            type: 'widget' as const,
            widget: {
              id: 'todo-1',
              type: 'todo-list' as const,
              title: '待办',
              props: {
                items: ['一', '二'],
              },
            },
          },
        ],
        plainText: '正文',
      },
    };

    await localNoteStore.saveNotes('alice', [note]);

    await expect(localNoteStore.loadNotes('alice')).resolves.toEqual([note]);
  });

  test('loads old notes without document field as text mirror document', async () => {
    const note = {
      id: 'note-old',
      title: '旧笔记',
      content: '旧正文',
      timestamp: new Date('2026-03-16T00:00:00.000Z'),
    };

    await localNoteStore.saveNotes('alice', [note]);

    await expect(localNoteStore.loadNotes('alice')).resolves.toEqual([
      {
        ...note,
        document: {
          version: '1.0',
          blocks: [
            {
              id: 'block-1',
              type: 'paragraph',
              text: '旧正文',
            },
          ],
          plainText: '旧正文',
        },
      },
    ]);
  });

  test('normalizes stale live document mirror when loading notes', async () => {
    await AsyncStorage.setItem(
      'notes_alice',
      encodeNotesPayload([
        {
          id: 'note-stale',
          title: '旧镜像',
          content: '新正文[图片0]',
          timestamp: '2026-03-16T00:00:00.000Z',
          document: {
            version: '1.0',
            blocks: [
              {
                id: 'paragraph-old',
                type: 'paragraph',
                text: '旧正文',
              },
              {
                id: 'widget-1',
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
      ]),
    );

    await expect(localNoteStore.loadNotes('alice')).resolves.toEqual([
      {
        id: 'note-stale',
        title: '旧镜像',
        content: '新正文[图片0]',
        timestamp: new Date('2026-03-16T00:00:00.000Z'),
        images: undefined,
        audios: undefined,
        fontSize: undefined,
        textSegments: undefined,
        document: {
          version: '1.0',
          blocks: [
            {
              id: 'paragraph-old',
              type: 'paragraph',
              text: '新正文',
            },
            {
              id: 'widget-1',
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
            {
              id: 'block-2',
              type: 'paragraph',
              text: '图片占位 1',
            },
          ],
          plainText: '新正文\n\n图片占位 1',
        },
        deletedAt: undefined,
        isHidden: undefined,
      },
    ]);
  });

  test('normalizes stale live document mirror before saving notes', async () => {
    await localNoteStore.saveNotes('alice', [
      {
        id: 'note-stale-save',
        title: '旧镜像',
        content: '新正文[图片0]',
        timestamp: new Date('2026-03-16T00:00:00.000Z'),
        document: {
          version: '1.0',
          blocks: [
            {
              id: 'paragraph-old',
              type: 'paragraph',
              text: '旧正文',
            },
            {
              id: 'widget-1',
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
    ]);

    const persistedNotes = decodeNotesPayload(
      (await AsyncStorage.getItem('notes_alice')) ?? '[]',
    ) as Array<{
      document?: unknown;
    }>;

    expect(persistedNotes[0]?.document).toEqual({
      version: '1.0',
      blocks: [
        {
          id: 'paragraph-old',
          type: 'paragraph',
          text: '新正文',
        },
        {
          id: 'widget-1',
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
        {
          id: 'block-2',
          type: 'paragraph',
          text: '图片占位 1',
        },
      ],
      plainText: '新正文\n\n图片占位 1',
    });
  });

  test('persists text mirror document for notes without document field', async () => {
    await localNoteStore.saveNotes('alice', [
      {
        id: 'note-no-document',
        title: '纯文本',
        content: '正文',
        timestamp: new Date('2026-03-16T00:00:00.000Z'),
      },
    ]);

    const persistedNotes = decodeNotesPayload(
      (await AsyncStorage.getItem('notes_alice')) ?? '[]',
    ) as Array<{
      document?: unknown;
    }>;

    expect(persistedNotes[0]?.document).toEqual({
      version: '1.0',
      blocks: [
        {
          id: 'block-1',
          type: 'paragraph',
          text: '正文',
        },
      ],
      plainText: '正文',
    });
  });

  test('falls back to text mirror when persisted document payload is invalid', async () => {
    await AsyncStorage.setItem(
      'notes_alice',
      encodeNotesPayload([
        {
          id: 'note-invalid',
          title: '坏文档',
          content: '正文',
          timestamp: '2026-03-16T00:00:00.000Z',
          document: {
            version: '1.0',
            blocks: [
              {
                id: 'widget-bad',
                type: 'widget',
                widget: 'not-an-object',
              },
            ],
          },
        },
      ]),
    );

    await expect(localNoteStore.loadNotes('alice')).resolves.toEqual([
      {
        id: 'note-invalid',
        title: '坏文档',
        content: '正文',
        timestamp: new Date('2026-03-16T00:00:00.000Z'),
        images: undefined,
        audios: undefined,
        fontSize: undefined,
        textSegments: undefined,
        document: {
          version: '1.0',
          blocks: [
            {
              id: 'block-1',
              type: 'paragraph',
              text: '正文',
            },
          ],
          plainText: '正文',
        },
        deletedAt: undefined,
        isHidden: undefined,
      },
    ]);
  });
});
