import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Redirect, useLocalSearchParams, useRouter} from 'expo-router';
import type {RichDocument} from '../../../entities/document/types';
import {
  applyDraftContentChange,
  createDraftFromNote,
  createEmptyNoteDraft,
  type NoteDraft,
} from '../../../entities/note/draft';
import type {Note, TextSegment} from '../../../entities/note/types';
import {providerRegistry} from '../../../providers/providerRegistry';
import {useThemePreferences} from '../../../shared/theme/useThemePreferences';
import {
  createNoteFromDraft,
  hasDraftContent,
  mergeDraftIntoNote,
} from '../../home/model/homeNoteUtils';
import {useAuthSession} from '../../auth/model/AuthSessionProvider';
import NoteEditorModal from './NoteEditorModal';

const resolveNoteIdParam = (
  noteId: string | string[] | undefined,
): string | null => {
  if (typeof noteId === 'string' && noteId.length > 0) {
    return noteId;
  }

  if (Array.isArray(noteId) && typeof noteId[0] === 'string' && noteId[0]) {
    return noteId[0];
  }

  return null;
};

export const NoteEditorRouteScreen: React.FC = () => {
  const router = useRouter();
  const {noteId} = useLocalSearchParams<{noteId?: string | string[]}>();
  const resolvedNoteId = resolveNoteIdParam(noteId);
  const {theme} = useThemePreferences();
  const {isHydrating, user} = useAuthSession();
  const noteSyncProvider = useMemo(
    () => providerRegistry.getNoteSyncProvider(),
    [],
  );
  const [draft, setDraft] = useState<NoteDraft>(createEmptyNoteDraft);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isMissingNote, setIsMissingNote] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadDraft = async () => {
      if (!user.isLoggedIn || !user.username) {
        if (isMounted) {
          setIsEditorReady(true);
        }
        return;
      }

      try {
        const loadedNotes = await noteSyncProvider.pullNotes(user.username);

        if (!isMounted) {
          return;
        }

        setNotes(loadedNotes);

        if (!resolvedNoteId) {
          setDraft(createEmptyNoteDraft());
          setIsMissingNote(false);
          return;
        }

        const matchedNote =
          loadedNotes.find(noteItem => noteItem.id === resolvedNoteId) ?? null;

        if (!matchedNote) {
          setDraft(createEmptyNoteDraft());
          setIsMissingNote(true);
          return;
        }

        setDraft(createDraftFromNote(matchedNote));
        setIsMissingNote(false);
      } catch (error) {
        console.error('加载编辑笔记失败:', error);
        if (isMounted) {
          setDraft(createEmptyNoteDraft());
          setIsMissingNote(Boolean(resolvedNoteId));
        }
      } finally {
        if (isMounted) {
          setIsEditorReady(true);
        }
      }
    };

    setIsEditorReady(false);
    loadDraft().catch(error => {
      console.error('加载编辑笔记失败:', error);
      if (isMounted) {
        setIsEditorReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [noteSyncProvider, resolvedNoteId, user.isLoggedIn, user.username]);

  const handleClose = useCallback(() => {
    router.replace('/(notes)');
  }, [router]);

  const handleSave = useCallback(async () => {
    if (!user.username) {
      handleClose();
      return;
    }

    if (!hasDraftContent(draft)) {
      handleClose();
      return;
    }

    const nextNotes =
      resolvedNoteId && draft.id
        ? notes.map(note =>
            note.id === draft.id ? mergeDraftIntoNote(note, draft) : note,
          )
        : [createNoteFromDraft(draft), ...notes];

    await noteSyncProvider.pushNotes(user.username, nextNotes);
    handleClose();
  }, [draft, handleClose, noteSyncProvider, notes, resolvedNoteId, user.username]);

  if (isHydrating) {
    return null;
  }

  if (!user.isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!isEditorReady) {
    return null;
  }

  if (isMissingNote) {
    return <Redirect href="/(notes)" />;
  }

  return (
    <NoteEditorModal
      visible
      isEditing={Boolean(resolvedNoteId)}
      note={draft}
      onSave={handleSave}
      onClose={handleClose}
      onChangeTitle={title => setDraft(previous => ({...previous, title}))}
      onChangeContent={content =>
        setDraft(previous => applyDraftContentChange(previous, content))
      }
      onChangeImages={images => setDraft(previous => ({...previous, images}))}
      onChangeAudios={audios => setDraft(previous => ({...previous, audios}))}
      onChangeDocument={(document: RichDocument) =>
        setDraft(previous => ({...previous, document}))
      }
      onChangeFontSize={fontSize =>
        setDraft(previous => ({...previous, fontSize}))
      }
      onChangeTextSegments={(textSegments: TextSegment[]) =>
        setDraft(previous => ({...previous, textSegments}))
      }
      theme={theme}
    />
  );
};

export default NoteEditorRouteScreen;
