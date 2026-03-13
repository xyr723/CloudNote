import type {Note} from '../../entities/note/types';

export interface TrashProvider {
  listNotes(username: string): Promise<Note[]>;
  moveToTrash(username: string, note: Note): Promise<void>;
  restoreNote(username: string, noteId: string): Promise<Note | null>;
  deleteNote(username: string, noteId: string): Promise<void>;
}
