import type {generateThemeColors} from '../../../../app/theme/colors';

export type EditableTextSegment = {
  text: string;
  fontSize: number;
  isBold?: boolean;
};

export type EditorSelection = {
  start: number;
  end: number;
};

export type NoteEditorTheme = ReturnType<typeof generateThemeColors>;
