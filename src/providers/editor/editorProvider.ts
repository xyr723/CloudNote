import type {RichDocument} from '../../entities/document/types';

export interface EditorProvider {
  parse(input: string): Promise<RichDocument>;
  serialize(document: RichDocument): Promise<string>;
  renderHtml(document: RichDocument): Promise<string>;
}
