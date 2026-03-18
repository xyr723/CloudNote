import {useCallback, useEffect, useState} from 'react';
import type {NoteDraft} from '../../../entities/note/draft';
import type {EditableTextSegment} from '../ui/types';

type ApplyImageInsertionState = {
  content: string;
  images: string[];
  textSegments?: EditableTextSegment[];
};

type UseNoteMediaStateInput = {
  externalContent: string;
  note: Pick<NoteDraft, 'audios' | 'images'>;
  onChangeAudios?: (audios: string[]) => void;
  onChangeContent: (content: string) => void;
  onChangeImages?: (images: string[]) => void;
  onChangeTextSegments?: (segments: EditableTextSegment[]) => void;
};

const resolveMediaItems = (items?: string[]): string[] => {
  return items ?? [];
};

export const useNoteMediaState = ({
  externalContent,
  note,
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

  const applyContentChange = useCallback(
    (nextContent: string) => {
      setContent(nextContent);
      onChangeContent(nextContent);
    },
    [onChangeContent],
  );

  const applyImagesChange = useCallback(
    (nextImages: string[]) => {
      setImages(nextImages);
      onChangeImages?.(nextImages);
    },
    [onChangeImages],
  );

  const applyAudiosChange = useCallback(
    (nextAudios: string[]) => {
      setAudios(nextAudios);
      onChangeAudios?.(nextAudios);
    },
    [onChangeAudios],
  );

  const applyTextSegmentsChange = useCallback(
    (nextTextSegments: EditableTextSegment[]) => {
      onChangeTextSegments?.(nextTextSegments);
    },
    [onChangeTextSegments],
  );

  const applyImageInsertionState = useCallback(
    (nextState: ApplyImageInsertionState) => {
      applyImagesChange(nextState.images);
      applyContentChange(nextState.content);

      if (nextState.textSegments) {
        applyTextSegmentsChange(nextState.textSegments);
      }
    },
    [applyContentChange, applyImagesChange, applyTextSegmentsChange],
  );

  return {
    applyAudiosChange,
    applyContentChange,
    applyImageInsertionState,
    applyImagesChange,
    applyTextSegmentsChange,
    audios,
    content,
    images,
  };
};
