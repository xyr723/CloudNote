import {createLiveNoteDocument, hasWidgetBlocks} from '../../../entities/note/document';
import type {NoteDraft} from '../../../entities/note/draft';
import type {Dispatch, SetStateAction} from 'react';
import type {Note} from '../../../entities/note/types';

export const SAVE_SUCCESS_DURATION = 1000;
export const DELETE_SUCCESS_DURATION = 1500;
export const SYNC_ERROR_DURATION = 3000;

const WELCOME_NOTE_ID = 'MQ==';

export const createWelcomeNote = (): Note => {
  const content =
    '这是一个简单的笔记示例：\n\n今天的待办：\n1. 早起晨跑\n2. 准备早餐\n3. 阅读一小时\n4. 整理房间\n\n小贴士：\n- 点击笔记可以编辑内容\n- 点击右下角的"+"按钮创建新笔记\n- 长按笔记可以删除\n- 在顶部搜索框搜索笔记\n- 保持记录的习惯\n- 整理思维，提高效率';

  return {
    id: WELCOME_NOTE_ID,
    title: '欢迎使用云笔记',
    content,
    timestamp: new Date(),
    document: createLiveNoteDocument({
      content,
      document: undefined,
    }),
  };
};

export const hasNoteChanged = (
  note: Note,
  cachedNote: Note | undefined,
): boolean => {
  if (!cachedNote) {
    return true;
  }

  return (
    cachedNote.title !== note.title ||
    cachedNote.content !== note.content ||
    JSON.stringify(cachedNote.images) !== JSON.stringify(note.images) ||
    JSON.stringify(cachedNote.audios) !== JSON.stringify(note.audios) ||
    cachedNote.fontSize !== note.fontSize ||
    JSON.stringify(cachedNote.textSegments) !==
      JSON.stringify(note.textSegments) ||
    JSON.stringify(cachedNote.document) !== JSON.stringify(note.document)
  );
};

export const mergeDraftIntoNote = (note: Note, draft: NoteDraft): Note => {
  return {
    ...note,
    title: draft.title,
    content: draft.content,
    timestamp: new Date(),
    images: draft.images,
    audios: draft.audios,
    fontSize: draft.fontSize,
    textSegments: draft.textSegments,
    document: createLiveNoteDocument({
      content: draft.content,
      document: draft.document,
    }),
  };
};

export const createNoteFromDraft = (draft: NoteDraft): Note => {
  return {
    id: Date.now().toString(),
    title: draft.title,
    content: draft.content,
    timestamp: new Date(),
    images: draft.images,
    audios: draft.audios,
    fontSize: draft.fontSize,
    textSegments: draft.textSegments,
    document: createLiveNoteDocument({
      content: draft.content,
      document: draft.document,
    }),
  };
};

export const hasDraftContent = (draft: NoteDraft): boolean => {
  return Boolean(
    draft.title.trim() ||
      draft.content.trim() ||
      draft.images?.length ||
      draft.audios?.length ||
      hasWidgetBlocks(draft.document),
  );
};

export const showTemporaryModal = (
  setVisible: Dispatch<SetStateAction<boolean>>,
  duration: number,
): void => {
  setVisible(true);
  setTimeout(() => {
    setVisible(false);
  }, duration);
};
