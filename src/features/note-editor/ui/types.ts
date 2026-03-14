import type {generateThemeColors} from '../../../shared/theme/colors';
import type {TextSegment} from '../../../entities/note/types';

export type EditableTextSegment = TextSegment;

export type EditorSelection = {
  start: number;
  end: number;
};

export type NoteEditorTheme = ReturnType<typeof generateThemeColors>;
