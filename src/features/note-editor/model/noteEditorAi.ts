import type {AiCompletionResult} from '../../../providers/ai/aiProvider';
import {providerRegistry} from '../../../providers/providerRegistry';

export const completeNoteEditorTextWithAi = async (
  existingContent: string,
  prompt: string,
): Promise<AiCompletionResult> => {
  return providerRegistry.getAiProvider().completeDocument({
    existingContent,
    prompt,
  });
};
