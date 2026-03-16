import type {RichDocument} from '../document/types';

export interface TextSegment {
  text: string;
  fontSize: number;
  isBold?: boolean;
  isItalic?: boolean;
  color?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  images?: string[];
  audios?: string[];
  fontSize?: number;
  textSegments?: TextSegment[];
  document?: RichDocument;
  deletedAt?: string;
  isHidden?: boolean;
}

export type SortType = 'editDate' | 'createDate' | 'title';
export type SortOrder = 'asc' | 'desc';
