import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type {Note} from '../../../entities/note/types';
import {useTrashNotes} from './useTrashNotes';

const mockListNotes = jest.fn();
const mockRestoreNote = jest.fn();
const mockDeleteNote = jest.fn();
const mockPullNotes = jest.fn();
const mockPushNotes = jest.fn();

jest.mock('../../../providers/providerRegistry', () => ({
  providerRegistry: {
    getTrashProvider: () => ({
      listNotes: mockListNotes,
      restoreNote: mockRestoreNote,
      deleteNote: mockDeleteNote,
    }),
    getNoteSyncProvider: () => ({
      pullNotes: mockPullNotes,
      pushNotes: mockPushNotes,
    }),
  },
}));

const createNote = (overrides: Partial<Note> = {}): Note => {
  return {
    id: 'note-1',
    title: '已删除笔记',
    content: '这里是内容',
    timestamp: new Date('2026-03-15T00:00:00.000Z'),
    ...overrides,
  };
};

const expectHookState = (
  hookState: ReturnType<typeof useTrashNotes> | null,
): ReturnType<typeof useTrashNotes> => {
  expect(hookState).not.toBeNull();

  if (!hookState) {
    throw new Error('hook state is not ready');
  }

  return hookState;
};

describe('useTrashNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('loads trash notes for current user', async () => {
    const trashNotes = [createNote()];
    mockListNotes.mockResolvedValue(trashNotes);

    let latestHook: ReturnType<typeof useTrashNotes> | null = null;

    const Probe = () => {
      latestHook = useTrashNotes({username: 'alice'});
      return null;
    };

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<Probe />);
      await Promise.resolve();
    });

    const hookState = expectHookState(latestHook);

    expect(mockListNotes).toHaveBeenCalledWith('alice');
    expect(hookState.notes).toEqual(trashNotes);
    expect(hookState.isLoading).toBe(false);
  });

  test('refresh reloads trash notes', async () => {
    mockListNotes
      .mockResolvedValueOnce([createNote({id: 'note-1'})])
      .mockResolvedValueOnce([createNote({id: 'note-2'})]);

    let latestHook: ReturnType<typeof useTrashNotes> | null = null;

    const Probe = () => {
      latestHook = useTrashNotes({username: 'alice'});
      return null;
    };

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<Probe />);
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      await latestHook?.refresh();
    });

    const hookState = expectHookState(latestHook);

    expect(mockListNotes).toHaveBeenCalledTimes(2);
    expect(hookState.notes).toEqual([createNote({id: 'note-2'})]);
  });

  test('requestRestore stores selected note and active action', async () => {
    mockListNotes.mockResolvedValue([]);
    const note = createNote();
    let latestHook: ReturnType<typeof useTrashNotes> | null = null;

    const Probe = () => {
      latestHook = useTrashNotes({username: 'alice'});
      return null;
    };

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<Probe />);
      await Promise.resolve();
    });

    ReactTestRenderer.act(() => {
      latestHook?.requestRestore(note);
    });

    const hookState = expectHookState(latestHook);

    expect(hookState.activeAction).toBe('restore');
    expect(hookState.selectedNote).toEqual(note);
  });

  test('confirmAction restores note back to note list and updates feedback', async () => {
    const deletedNote = createNote({id: 'trash-1'});
    const restoredNote = createNote({id: 'trash-1', deletedAt: undefined});
    mockListNotes.mockResolvedValue([deletedNote]);
    mockRestoreNote.mockResolvedValue(restoredNote);
    mockPullNotes.mockResolvedValue([createNote({id: 'note-2'})]);

    let latestHook: ReturnType<typeof useTrashNotes> | null = null;

    const Probe = () => {
      latestHook = useTrashNotes({username: 'alice'});
      return null;
    };

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<Probe />);
      await Promise.resolve();
    });

    ReactTestRenderer.act(() => {
      latestHook?.requestRestore(deletedNote);
    });

    await ReactTestRenderer.act(async () => {
      await latestHook?.confirmAction();
    });

    expect(mockRestoreNote).toHaveBeenCalledWith('alice', 'trash-1');
    expect(mockPullNotes).toHaveBeenCalledWith('alice');
    expect(mockPushNotes).toHaveBeenCalledWith('alice', [
      restoredNote,
      createNote({id: 'note-2'}),
    ]);

    let hookState = expectHookState(latestHook);
    expect(hookState.notes).toEqual([]);
    expect(hookState.successFeedback).toBe('restore');

    await ReactTestRenderer.act(async () => {
      jest.runAllTimers();
    });

    hookState = expectHookState(latestHook);
    expect(hookState.successFeedback).toBe(null);
  });

  test('confirmAction deletes note from trash and updates feedback', async () => {
    const deletedNote = createNote({id: 'trash-1'});
    mockListNotes.mockResolvedValue([deletedNote]);
    mockDeleteNote.mockResolvedValue(undefined);

    let latestHook: ReturnType<typeof useTrashNotes> | null = null;

    const Probe = () => {
      latestHook = useTrashNotes({username: 'alice'});
      return null;
    };

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<Probe />);
      await Promise.resolve();
    });

    ReactTestRenderer.act(() => {
      latestHook?.requestDelete(deletedNote);
    });

    await ReactTestRenderer.act(async () => {
      await latestHook?.confirmAction();
    });

    expect(mockDeleteNote).toHaveBeenCalledWith('alice', 'trash-1');

    let hookState = expectHookState(latestHook);
    expect(hookState.notes).toEqual([]);
    expect(hookState.successFeedback).toBe('delete');

    await ReactTestRenderer.act(async () => {
      jest.runAllTimers();
    });

    hookState = expectHookState(latestHook);
    expect(hookState.successFeedback).toBe(null);
  });
});
