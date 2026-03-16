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

  test('loads old notes without document field', async () => {
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
        document: undefined,
      },
    ]);
  });

  test('ignores invalid persisted document payloads instead of dropping the note', async () => {
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
        document: undefined,
        deletedAt: undefined,
        isHidden: undefined,
      },
    ]);
  });
});
