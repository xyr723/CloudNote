import type {NoteDraft} from '../../../entities/note/draft';
import type {Note} from '../../../entities/note/types';
import {createLiveNoteDocument} from '../../../entities/note/document';
import {
  createWelcomeNote,
  createNoteFromDraft,
  hasDraftContent,
  hasNoteChanged,
  mergeDraftIntoNote,
} from './homeNoteUtils';

const widgetDocument = {
  version: '1.0' as const,
  blocks: [
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
};

describe('homeNoteUtils', () => {
  test('createWelcomeNote seeds a live document mirror', () => {
    const note = createWelcomeNote();

    expect(note.document).toEqual(
      createLiveNoteDocument({
        content: note.content,
        document: undefined,
      }),
    );
  });

  test('createNoteFromDraft keeps document payload', () => {
    const draft: NoteDraft = {
      title: '标题',
      content: '',
      document: widgetDocument,
    };

    expect(createNoteFromDraft(draft)).toMatchObject({
      title: '标题',
      content: '',
      document: widgetDocument,
    });
  });

  test('createNoteFromDraft refreshes stale text mirror while preserving widgets', () => {
    const draft: NoteDraft = {
      title: '标题',
      content: '新正文',
      document: {
        version: '1.0',
        blocks: [
          {
            id: 'paragraph-old',
            type: 'paragraph',
            text: '旧正文',
          },
          ...widgetDocument.blocks,
        ],
        plainText: '旧正文',
      },
    };

    expect(createNoteFromDraft(draft)).toMatchObject({
      content: '新正文',
      document: createLiveNoteDocument({
        content: '新正文',
        document: draft.document,
      }),
    });
  });

  test('mergeDraftIntoNote keeps document payload', () => {
    const note: Note = {
      id: 'note-1',
      title: '旧标题',
      content: '旧正文',
      timestamp: new Date('2026-03-16T00:00:00.000Z'),
    };
    const draft: NoteDraft = {
      id: 'note-1',
      title: '新标题',
      content: '新正文',
      document: widgetDocument,
    };

    expect(mergeDraftIntoNote(note, draft)).toMatchObject({
      id: 'note-1',
      title: '新标题',
      content: '新正文',
      document: createLiveNoteDocument({
        content: '新正文',
        document: widgetDocument,
      }),
    });
  });

  test('mergeDraftIntoNote refreshes stale text mirror while preserving widgets', () => {
    const note: Note = {
      id: 'note-1',
      title: '旧标题',
      content: '旧正文',
      timestamp: new Date('2026-03-16T00:00:00.000Z'),
      document: {
        version: '1.0',
        blocks: [
          {
            id: 'paragraph-old',
            type: 'paragraph',
            text: '旧正文',
          },
          ...widgetDocument.blocks,
        ],
        plainText: '旧正文',
      },
    };
    const draft: NoteDraft = {
      id: 'note-1',
      title: '新标题',
      content: '新正文[图片0]',
      document: note.document,
    };

    expect(mergeDraftIntoNote(note, draft)).toMatchObject({
      id: 'note-1',
      title: '新标题',
      content: '新正文[图片0]',
      document: createLiveNoteDocument({
        content: '新正文[图片0]',
        document: note.document,
      }),
    });
  });

  test('hasNoteChanged returns true when document changes', () => {
    const cachedNote: Note = {
      id: 'note-1',
      title: '标题',
      content: '正文',
      timestamp: new Date('2026-03-16T00:00:00.000Z'),
    };
    const updatedNote: Note = {
      ...cachedNote,
      document: widgetDocument,
    };

    expect(hasNoteChanged(updatedNote, cachedNote)).toBe(true);
  });

  test('hasDraftContent returns true for drafts with widget blocks only', () => {
    expect(
      hasDraftContent({
        title: '',
        content: '',
        document: widgetDocument,
      }),
    ).toBe(true);
  });
});
