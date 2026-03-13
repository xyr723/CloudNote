import type {Note} from '../../entities/note/types';

export interface NoteSyncProvider {
  pullNotes(username: string): Promise<Note[]>;
  pushNotes(username: string, notes: Note[]): Promise<void>;
}
