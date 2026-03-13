import {providerRegistry} from '../../src/providers/providerRegistry';

// 这里保留旧函数签名，避免一次性改动页面调用方。
export const completeTextWithLLM = async (
  existsContent: string,
  userPrompt: string,
): Promise<string> => {
  try {
    const result = await providerRegistry.getAiProvider().completeDocument({
      existingContent: existsContent,
      prompt: userPrompt,
    });

    return result.text;
  } catch (error) {
    console.error('Error completing text:', error);
    throw error;
  }
};
