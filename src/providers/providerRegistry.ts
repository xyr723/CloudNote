import {runtimeConfig} from '../shared/config/runtimeConfig';
import type {AiProvider} from './ai/aiProvider';
import {MockAiProvider} from './ai/mock/mockAiProvider';
import {OpenAiCompatibleAiProvider} from './ai/openai-compatible/openAiCompatibleAiProvider';
import type {AttachmentProvider} from './attachment/attachmentProvider';
import {LocalAttachmentProvider} from './attachment/local/localAttachmentProvider';
import type {AuthProvider} from './auth/authProvider';
import {LocalAuthProvider} from './auth/local/localAuthProvider';
import type {EditorProvider} from './editor/editorProvider';
import {LocalHtmlEditorProvider} from './editor/local/localHtmlEditorProvider';
import {LocalNoteSyncProvider} from './sync/local/localNoteSyncProvider';
import type {NoteSyncProvider} from './sync/noteSyncProvider';
import {LocalTrashProvider} from './trash/local/localTrashProvider';
import type {TrashProvider} from './trash/trashProvider';

let aiProvider: AiProvider | null = null;
let attachmentProvider: AttachmentProvider | null = null;
let authProvider: AuthProvider | null = null;
let editorProvider: EditorProvider | null = null;
let noteSyncProvider: NoteSyncProvider | null = null;
let trashProvider: TrashProvider | null = null;

const createAiProvider = (): AiProvider => {
  if (
    runtimeConfig.ai.mode === 'openai-compatible' &&
    runtimeConfig.ai.apiUrl &&
    runtimeConfig.ai.apiKey &&
    runtimeConfig.ai.model
  ) {
    return new OpenAiCompatibleAiProvider({
      apiUrl: runtimeConfig.ai.apiUrl,
      apiKey: runtimeConfig.ai.apiKey,
      model: runtimeConfig.ai.model,
    });
  }

  return new MockAiProvider();
};

export const providerRegistry = {
  getAiProvider(): AiProvider {
    if (!aiProvider) {
      aiProvider = createAiProvider();
    }

    return aiProvider;
  },

  getAttachmentProvider(): AttachmentProvider {
    if (!attachmentProvider) {
      attachmentProvider = new LocalAttachmentProvider();
    }

    return attachmentProvider;
  },

  getAuthProvider(): AuthProvider {
    if (!authProvider) {
      authProvider = new LocalAuthProvider();
    }

    return authProvider;
  },

  getEditorProvider(): EditorProvider {
    if (!editorProvider) {
      editorProvider = new LocalHtmlEditorProvider();
    }

    return editorProvider;
  },

  getNoteSyncProvider(): NoteSyncProvider {
    if (!noteSyncProvider) {
      noteSyncProvider = new LocalNoteSyncProvider();
    }

    return noteSyncProvider;
  },

  getTrashProvider(): TrashProvider {
    if (!trashProvider) {
      trashProvider = new LocalTrashProvider();
    }

    return trashProvider;
  },
};
