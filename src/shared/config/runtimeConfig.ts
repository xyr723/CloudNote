export type AiMode = 'mock' | 'openai-compatible';

type ProcessLike = {
  env?: Record<string, string | undefined>;
};

type GlobalWithProcess = typeof globalThis & {
  process?: ProcessLike;
};

const globalObject = globalThis as GlobalWithProcess;

const readEnv = (key: string): string | undefined => {
  const value = globalObject.process?.env?.[key];

  if (!value) {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const resolveAiMode = (): AiMode => {
  return readEnv('CLOUDNOTE_AI_MODE') === 'openai-compatible'
    ? 'openai-compatible'
    : 'mock';
};

export const runtimeConfig = Object.freeze({
  ai: {
    mode: resolveAiMode(),
    apiUrl: readEnv('CLOUDNOTE_AI_API_URL'),
    apiKey: readEnv('CLOUDNOTE_AI_API_KEY'),
    model: readEnv('CLOUDNOTE_AI_MODEL'),
  },
});
