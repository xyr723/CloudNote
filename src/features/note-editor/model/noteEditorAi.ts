import {providerRegistry} from '../../../providers/providerRegistry';

export const completeNoteEditorTextWithAi = async (
  existingContent: string,
  prompt: string,
): Promise<string> => {
  const result = await providerRegistry.getAiProvider().completeDocument({
    existingContent,
    prompt,
  });

  return result.text;
};
