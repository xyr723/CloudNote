import type {RichDocument} from '../../entities/document/types';
import type {WidgetSchema} from '../../entities/widget/types';

export interface CompleteDocumentInput {
  existingContent: string;
  prompt: string;
  document?: RichDocument;
}

export interface GenerateWidgetsInput {
  prompt: string;
  existingContent?: string;
  maxWidgets?: number;
}

export interface AiCompletionMetadata {
  provider: string;
  model: string;
  usedFallback: boolean;
}

export interface AiCompletionResult {
  text: string;
  widgets?: WidgetSchema[];
  metadata: AiCompletionMetadata;
}

export interface AiProvider {
  completeDocument(input: CompleteDocumentInput): Promise<AiCompletionResult>;
  generateWidgets(input: GenerateWidgetsInput): Promise<WidgetSchema[]>;
}
