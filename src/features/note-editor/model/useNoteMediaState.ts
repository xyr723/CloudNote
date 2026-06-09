import {useCallback, useEffect, useState} from 'react';
import type {NoteDraft} from '../../../entities/note/draft';
import type {
  EditableTextSegment,
  NoteEditorChangeState,
} from '../ui/types';

type ApplyImageInsertionState = {
  content: string;
  images: string[];
  textSegments?: EditableTextSegment[];
};

type UseNoteMediaStateInput = {
  externalContent: string;
  note: Pick<NoteDraft, 'audios' | 'images'>;
  onChangeState?: (state: NoteEditorChangeState) => void;
  onChangeAudios?: (audios: string[]) => void;
  onChangeContent?: (content: string) => void;
  onChangeImages?: (images: string[]) => void;
  onChangeTextSegments?: (segments: EditableTextSegment[]) => void;
};

const resolveMediaItems = (items?: string[]): string[] => {
  return items ?? [];
};

export const useNoteMediaState = ({
  externalContent,
  note,
  onChangeState,
  onChangeAudios,
  onChangeContent,
  onChangeImages,
  onChangeTextSegments,
}: UseNoteMediaStateInput) => {
  const [images, setImages] = useState<string[]>(() => {
    return resolveMediaItems(note.images);
  });
  const [audios, setAudios] = useState<string[]>(() => {
    return resolveMediaItems(note.audios);
  });
  const [content, setContent] = useState(externalContent);

  useEffect(() => {
    setImages(resolveMediaItems(note.images));
    setAudios(resolveMediaItems(note.audios));
  }, [note.audios, note.images]);

  useEffect(() => {
    setContent(externalContent);
  }, [externalContent]);

  const applyStateChange = useCallback(
    (nextState: NoteEditorChangeState) => {
      if (typeof nextState.images !== 'undefined') {
        setImages(nextState.images);
      }

      if (typeof nextState.audios !== 'undefined') {
        setAudios(nextState.audios);
      }

      setContent(nextState.content);
      onChangeState?.(nextState);
    },
    [onChangeState],
  );

  const applyContentChange = useCallback(
    (nextContent: string) => {
      setContent(nextContent);
      if (onChangeState) {
        onChangeState({
          content: nextContent,
        });
        return;
      }

      onChangeContent?.(nextContent);
    },
    [onChangeContent, onChangeState],
  );

  const applyImagesChange = useCallback(
    (nextImages: string[]) => {
      setImages(nextImages);
      if (onChangeState) {
        onChangeState({
          content,
          images: nextImages,
        });
        return;
      }

      onChangeImages?.(nextImages);
    },
    [content, onChangeImages, onChangeState],
  );

  const applyAudiosChange = useCallback(
    (nextAudios: string[]) => {
      setAudios(nextAudios);
      if (onChangeState) {
        onChangeState({
          audios: nextAudios,
          content,
        });
        return;
      }

      onChangeAudios?.(nextAudios);
    },
    [content, onChangeAudios, onChangeState],
  );

  const applyTextSegmentsChange = useCallback(
    (nextTextSegments: EditableTextSegment[]) => {
      if (onChangeState) {
        onChangeState({
          content,
          textSegments: nextTextSegments,
        });
        return;
      }

      onChangeTextSegments?.(nextTextSegments);
    },
    [content, onChangeState, onChangeTextSegments],
  );

  const applyImageInsertionState = useCallback(
    (nextState: ApplyImageInsertionState) => {
      setImages(nextState.images);
      setContent(nextState.content);
      if (onChangeState) {
        onChangeState({
          content: nextState.content,
          images: nextState.images,
          textSegments: nextState.textSegments,
        });
        return;
      }

      onChangeImages?.(nextState.images);
      onChangeContent?.(nextState.content);

      if (nextState.textSegments) {
        onChangeTextSegments?.(nextState.textSegments);
      }
    },
    [
      onChangeContent,
      onChangeImages,
      onChangeState,
      onChangeTextSegments,
    ],
  );

  return {
    applyAudiosChange,
    applyContentChange,
    applyImageInsertionState,
    applyImagesChange,
    applyStateChange,
    applyTextSegmentsChange,
    audios,
    content,
    images,
  };
};
