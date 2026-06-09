import type {generateThemeColors} from '../../../shared/theme/colors';
import type {RichDocument} from '../../../entities/document/types';
import type {TextSegment} from '../../../entities/note/types';

export type EditableTextSegment = TextSegment;

export type NoteEditorChangeState = {
  audios?: string[];
  content: string;
  document?: RichDocument;
  fontSize?: number;
  images?: string[];
  textSegments?: EditableTextSegment[];
};

export type NoteEditorTextChangeState = {
  content: string;
  textSegments?: EditableTextSegment[];
};

export type EditorSelection = {
  start: number;
  end: number;
};

export type NoteEditorTheme = ReturnType<typeof generateThemeColors>;
