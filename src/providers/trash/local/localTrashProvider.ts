import type {Note} from '../../../entities/note/types';
import {localNoteStore} from '../../../shared/lib/localNoteStore';
import type {TrashProvider} from '../trashProvider';

export class LocalTrashProvider implements TrashProvider {
  async listNotes(username: string): Promise<Note[]> {
    const notes = await localNoteStore.loadTrashNotes(username);
    return notes.filter(note => !note.isHidden);
  }

  async moveToTrash(username: string, note: Note): Promise<void> {
    await localNoteStore.moveNoteToTrash(username, note);
  }

  async restoreNote(username: string, noteId: string): Promise<Note | null> {
    return localNoteStore.restoreTrashNote(username, noteId);
  }

  async deleteNote(username: string, noteId: string): Promise<void> {
    await localNoteStore.deleteTrashNote(username, noteId);
  }
}
