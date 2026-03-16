import type {NoteDraft} from '../../../entities/note/draft';
import type {Note} from '../../../entities/note/types';
import {
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
      document: widgetDocument,
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
