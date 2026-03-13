import type {Note, TextSegment} from '../../../entities/note/types';

export interface NoteDraft {
  id?: string;
  title: string;
  content: string;
  images?: string[];
  audios?: string[];
  fontSize?: number;
  textSegments?: TextSegment[];
}

export const EMPTY_NOTE_DRAFT: NoteDraft = {
  title: '',
  content: '',
};

export const createEmptyNoteDraft = (): NoteDraft => {
  return {...EMPTY_NOTE_DRAFT};
};

export const createDraftFromNote = (note: Note): NoteDraft => {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    images: note.images,
    audios: note.audios,
    fontSize: note.fontSize,
    textSegments: note.textSegments,
  };
};
