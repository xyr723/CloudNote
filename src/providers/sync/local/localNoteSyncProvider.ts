import type {Note} from '../../../entities/note/types';
import {localNoteStore} from '../../../shared/lib/localNoteStore';
import type {NoteSyncProvider} from '../noteSyncProvider';

const normalizeNote = (note: Note): Note => ({
  ...note,
  timestamp:
    note.timestamp instanceof Date
      ? note.timestamp
      : new Date(note.timestamp),
});

export class LocalNoteSyncProvider implements NoteSyncProvider {
  async pullNotes(username: string): Promise<Note[]> {
    const notes = await localNoteStore.loadNotes(username);
    return notes.map(normalizeNote);
  }

  async pushNotes(username: string, notes: Note[]): Promise<void> {
    await localNoteStore.saveNotes(username, notes.map(normalizeNote));
  }
}
