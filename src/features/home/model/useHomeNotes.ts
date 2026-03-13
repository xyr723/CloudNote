import {Alert} from 'react-native';
import {useCallback, useEffect, useMemo, useState} from 'react';
import type {Note, SortOrder, SortType} from '../../../entities/note/types';
import {providerRegistry} from '../../../providers/providerRegistry';
import {
  createNoteFromDraft,
  createWelcomeNote,
  DELETE_SUCCESS_DURATION,
  hasDraftContent,
  hasNoteChanged,
  mergeDraftIntoNote,
  SAVE_SUCCESS_DURATION,
  showTemporaryModal,
  SYNC_ERROR_DURATION,
} from './homeNoteUtils';
import {
  createDraftFromNote,
  createEmptyNoteDraft,
  type NoteDraft,
} from './noteDraft';

type UseHomeNotesInput = {
  isLoggedIn: boolean;
  username: string;
};

const DEFAULT_SORT_TYPE: SortType = 'editDate';
const DEFAULT_SORT_ORDER: SortOrder = 'desc';

export const useHomeNotes = ({
  isLoggedIn,
  username,
}: UseHomeNotesInput) => {
  const noteSyncProvider = useMemo(
    () => providerRegistry.getNoteSyncProvider(),
    [],
  );
  const trashProvider = useMemo(() => providerRegistry.getTrashProvider(), []);
  const [notes, setNotes] = useState<Note[]>([]);
  const [cachedNotes, setCachedNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentNote, setCurrentNote] = useState<NoteDraft>(
    createEmptyNoteDraft,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteSuccessModalVisible, setDeleteSuccessModalVisible] =
    useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [showSaveErrorModal, setShowSaveErrorModal] = useState(false);
  const [showSyncErrorModal, setShowSyncErrorModal] = useState(false);
  const [sortType, setSortType] = useState<SortType>(DEFAULT_SORT_TYPE);
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT_ORDER);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((leftNote, rightNote) => {
      let comparison = 0;

      switch (sortType) {
        case 'editDate':
        case 'createDate':
          comparison =
            leftNote.timestamp.getTime() - rightNote.timestamp.getTime();
          break;
        case 'title':
          comparison = leftNote.title.localeCompare(rightNote.title);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [notes, sortOrder, sortType]);

  const filteredNotes = useMemo(() => {
    return sortedNotes.filter(note =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, sortedNotes]);

  const syncNotesNow = useCallback(async () => {
    if (!username) {
      return;
    }

    await noteSyncProvider.pushNotes(username, notes);
    setCachedNotes(notes);
  }, [noteSyncProvider, notes, username]);

  const preloadNotes = useCallback(async () => {
    if (!username) {
      return;
    }

    try {
      const loadedNotes = await noteSyncProvider.pullNotes(username);
      setCachedNotes(loadedNotes);
    } catch (error) {
      console.error('预加载笔记失败:', error);
    }
  }, [noteSyncProvider, username]);

  useEffect(() => {
    if (isLoggedIn && username) {
      preloadNotes().catch(error => {
        console.error('预加载笔记失败:', error);
      });
    }
  }, [isLoggedIn, preloadNotes, username]);

  useEffect(() => {
    const loadNotes = async () => {
      if (!isLoggedIn || !username) {
        setNotes([]);
        setCachedNotes([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        if (cachedNotes.length > 0) {
          setNotes(cachedNotes);
          return;
        }

        const loadedNotes = await noteSyncProvider.pullNotes(username);

        if (loadedNotes.length === 0) {
          const welcomeNote = createWelcomeNote();
          setNotes([welcomeNote]);
          await noteSyncProvider.pushNotes(username, [welcomeNote]);
          setCachedNotes([welcomeNote]);
          return;
        }

        setNotes(loadedNotes);
      } catch (error) {
        console.error('加载笔记失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes().catch(error => {
      console.error('加载笔记失败:', error);
      setIsLoading(false);
    });
  }, [cachedNotes, isLoggedIn, noteSyncProvider, username]);

  useEffect(() => {
    if (!isLoggedIn || !username || notes.length === 0) {
      return;
    }

    const hasChanges = notes.some(note => {
      const cachedNote = cachedNotes.find(item => item.id === note.id);
      return hasNoteChanged(note, cachedNote);
    });

    if (!hasChanges) {
      return;
    }

    void noteSyncProvider.pushNotes(username, notes).catch(error => {
      console.error('自动保存笔记失败:', error);
    });
    setCachedNotes(notes);
  }, [cachedNotes, isLoggedIn, noteSyncProvider, notes, username]);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setCurrentNote(createEmptyNoteDraft());
    setIsEditing(false);
  }, []);

  const handleCreateNote = useCallback(() => {
    setCurrentNote(createEmptyNoteDraft());
    setIsEditing(false);
    setModalVisible(true);
  }, []);

  const handleEditNote = useCallback((note: Note) => {
    setCurrentNote(createDraftFromNote(note));
    setIsEditing(true);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!hasDraftContent(currentNote)) {
      return;
    }

    try {
      const updatedNotes =
        isEditing && currentNote.id
          ? notes.map(note =>
              note.id === currentNote.id
                ? mergeDraftIntoNote(note, currentNote)
                : note,
            )
          : [createNoteFromDraft(currentNote), ...notes];

      setNotes(updatedNotes);
      setCachedNotes(updatedNotes);

      if (username) {
        try {
          await noteSyncProvider.pushNotes(username, updatedNotes);
          showTemporaryModal(setShowSaveSuccessModal, SAVE_SUCCESS_DURATION);
        } catch (error) {
          console.error('保存笔记失败:', error);
          showTemporaryModal(setShowSyncErrorModal, SYNC_ERROR_DURATION);
        }
      }

      handleCloseModal();
    } catch (error) {
      console.error('保存笔记失败:', error);
      showTemporaryModal(setShowSaveErrorModal, SYNC_ERROR_DURATION);
    }
  }, [currentNote, handleCloseModal, isEditing, noteSyncProvider, notes, username]);

  const handleDeleteNote = useCallback((noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteModalVisible(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!noteToDelete || !username) {
      return;
    }

    try {
      const noteToMove = notes.find(note => note.id === noteToDelete);

      if (!noteToMove) {
        console.error('[笔记] 未找到要移动的笔记，ID:', noteToDelete);
        return;
      }

      const updatedNotes = notes.filter(note => note.id !== noteToDelete);
      await noteSyncProvider.pushNotes(username, updatedNotes);
      await trashProvider.moveToTrash(username, noteToMove);

      setNotes(updatedNotes);
      setCachedNotes(updatedNotes);
      setDeleteModalVisible(false);
      setNoteToDelete(null);
      showTemporaryModal(
        setDeleteSuccessModalVisible,
        DELETE_SUCCESS_DURATION,
      );
    } catch (error) {
      console.error('[笔记] 移动笔记到回收站失败:', error);
      Alert.alert('错误', '移动笔记到回收站失败');
    }
  }, [noteSyncProvider, noteToDelete, notes, trashProvider, username]);

  const handleRefresh = useCallback(async () => {
    if (!username) {
      return;
    }

    setIsRefreshing(true);
    try {
      const loadedNotes = await noteSyncProvider.pullNotes(username);
      setNotes(loadedNotes);
      setCachedNotes(loadedNotes);
    } catch (error) {
      console.error('刷新笔记失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [noteSyncProvider, username]);

  return {
    confirmDelete,
    currentNote,
    deleteModalVisible,
    deleteSuccessModalVisible,
    filteredNotes,
    handleCloseModal,
    handleCreateNote,
    handleDeleteNote,
    handleEditNote,
    handleRefresh,
    handleSave,
    isEditing,
    isLoading,
    isRefreshing,
    modalVisible,
    notes,
    searchQuery,
    setCurrentNote,
    setDeleteModalVisible,
    setDeleteSuccessModalVisible,
    setSearchQuery,
    setShowSaveErrorModal,
    setShowSaveSuccessModal,
    setShowSortMenu,
    setShowSyncErrorModal,
    setSortOrder,
    setSortType,
    showSaveErrorModal,
    showSaveSuccessModal,
    showSortMenu,
    showSyncErrorModal,
    sortOrder,
    sortType,
    syncNotesNow,
  };
};
