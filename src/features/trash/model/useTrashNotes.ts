import {Alert} from 'react-native';
import {useCallback, useEffect, useMemo, useState} from 'react';
import type {Note} from '../../../entities/note/types';
import {providerRegistry} from '../../../providers/providerRegistry';

type TrashAction = 'restore' | 'delete' | null;
type TrashSuccessFeedback = 'restore' | 'delete' | null;

type UseTrashNotesInput = {
  username: string;
};

const SUCCESS_FEEDBACK_DURATION = 1500;

export const useTrashNotes = ({username}: UseTrashNotesInput) => {
  const trashProvider = useMemo(() => providerRegistry.getTrashProvider(), []);
  const noteSyncProvider = useMemo(
    () => providerRegistry.getNoteSyncProvider(),
    [],
  );
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeAction, setActiveAction] = useState<TrashAction>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [successFeedback, setSuccessFeedback] =
    useState<TrashSuccessFeedback>(null);

  const loadNotes = useCallback(async () => {
    if (!username) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const trashNotes = await trashProvider.listNotes(username);
      setNotes(trashNotes);
    } catch (error) {
      console.error('[回收站] 加载笔记失败:', error);
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [trashProvider, username]);

  useEffect(() => {
    loadNotes().catch(error => {
      console.error('[回收站] 加载笔记失败:', error);
      setNotes([]);
      setIsLoading(false);
    });
  }, [loadNotes]);

  useEffect(() => {
    if (!successFeedback) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setSuccessFeedback(null);
    }, SUCCESS_FEEDBACK_DURATION);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [successFeedback]);

  const refresh = useCallback(async () => {
    if (!username) {
      return;
    }

    try {
      setIsRefreshing(true);
      const trashNotes = await trashProvider.listNotes(username);
      setNotes(trashNotes);
    } catch (error) {
      console.error('[回收站] 刷新笔记失败:', error);
      setNotes([]);
    } finally {
      setIsRefreshing(false);
    }
  }, [trashProvider, username]);

  const requestRestore = useCallback((note: Note) => {
    setSelectedNote(note);
    setActiveAction('restore');
  }, []);

  const requestDelete = useCallback((note: Note) => {
    setSelectedNote(note);
    setActiveAction('delete');
  }, []);

  const closeActionModal = useCallback(() => {
    setActiveAction(null);
    setSelectedNote(null);
  }, []);

  const closeSuccessFeedback = useCallback(() => {
    setSuccessFeedback(null);
  }, []);

  const confirmAction = useCallback(async () => {
    if (!selectedNote || !activeAction) {
      return;
    }

    try {
      if (activeAction === 'restore') {
        const restoredNote = await trashProvider.restoreNote(
          username,
          selectedNote.id,
        );

        if (!restoredNote) {
          throw new Error('未找到要恢复的笔记');
        }

        const sourceNotes = await noteSyncProvider.pullNotes(username);
        await noteSyncProvider.pushNotes(username, [restoredNote, ...sourceNotes]);
        setNotes(currentNotes =>
          currentNotes.filter(note => note.id !== selectedNote.id),
        );
        setSuccessFeedback('restore');
      }

      if (activeAction === 'delete') {
        await trashProvider.deleteNote(username, selectedNote.id);
        setNotes(currentNotes =>
          currentNotes.filter(note => note.id !== selectedNote.id),
        );
        setSuccessFeedback('delete');
      }

      setActiveAction(null);
      setSelectedNote(null);
    } catch (error) {
      console.error(
        activeAction === 'restore'
          ? '[回收站] 恢复笔记失败:'
          : '[回收站] 彻底删除笔记失败:',
        error,
      );
      Alert.alert(
        '错误',
        activeAction === 'restore' ? '恢复笔记失败' : '彻底删除笔记失败',
      );
    }
  }, [
    activeAction,
    noteSyncProvider,
    selectedNote,
    trashProvider,
    username,
  ]);

  return {
    notes,
    isLoading,
    isRefreshing,
    activeAction,
    selectedNote,
    successFeedback,
    refresh,
    requestRestore,
    requestDelete,
    closeActionModal,
    closeSuccessFeedback,
    confirmAction,
  };
};
