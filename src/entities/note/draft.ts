import type {RichDocument} from '../document/types';
import {createLiveNoteDocument} from './document';
import type {Note, TextSegment} from './types';

export interface NoteDraft {
  id?: string;
  title: string;
  content: string;
  images?: string[];
  audios?: string[];
  fontSize?: number;
  textSegments?: TextSegment[];
  document?: RichDocument;
}

export const EMPTY_NOTE_DRAFT: NoteDraft = {
  title: '',
  content: '',
  document: createLiveNoteDocument({
    content: '',
    document: undefined,
  }),
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
    document: createLiveNoteDocument({
      content: note.content,
      document: note.document,
    }),
  };
};

export const applyDraftContentChange = (
  draft: NoteDraft,
  content: string,
): NoteDraft => {
  return {
    ...draft,
    content,
    document: createLiveNoteDocument({
      content,
      document: draft.document,
    }),
  };
};
