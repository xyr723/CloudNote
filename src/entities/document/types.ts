import type {WidgetSchema} from '../widget/types';

export type TextBlockType = 'paragraph' | 'heading' | 'quote' | 'code';

export interface BaseBlock {
  id: string;
}

export interface TextBlock extends BaseBlock {
  type: TextBlockType;
  text: string;
  level?: 1 | 2 | 3;
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  items: string[];
  ordered?: boolean;
}

export interface WidgetBlock extends BaseBlock {
  type: 'widget';
  widget: WidgetSchema;
}

export type DocumentBlock = TextBlock | ListBlock | WidgetBlock;

export interface RichDocument {
  version: '1.0';
  blocks: DocumentBlock[];
  plainText?: string;
}
