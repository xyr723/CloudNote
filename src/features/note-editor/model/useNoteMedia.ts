import {useCallback, useEffect, useState} from 'react';
import {Alert} from 'react-native';
import type {NoteDraft} from '../../../entities/note/draft';
import {
  captureImage,
  pickImagesFromLibrary,
} from '../../../shared/media/imagePicker';
import {
  removeAudioMarkerFromTextSegments,
  removeAudioMarker,
  removeImageMarkerFromTextSegments,
  removeImageMarker,
  syncImageMarkers,
  syncImageMarkersInTextSegments,
} from './noteEditorMediaUtils';
import {appendSelectedImages} from './noteEditorImageInsertion';
import type {EditableTextSegment} from '../ui/types';

type UseNoteMediaInput = {
  content: string;
  cursorPosition: number;
  fontSize: number;
  note: NoteDraft;
  onChangeAudios?: (audios: string[]) => void;
  onChangeContent: (content: string) => void;
  onChangeImages?: (images: string[]) => void;
  onChangeTextSegments?: (segments: EditableTextSegment[]) => void;
  tempNoteId: string;
  textSegments?: EditableTextSegment[];
};

export const useNoteMedia = ({
  content: externalContent,
  cursorPosition,
  fontSize,
  note,
  onChangeAudios,
  onChangeContent,
  onChangeImages,
  onChangeTextSegments,
  tempNoteId,
  textSegments,
}: UseNoteMediaInput) => {
  const [images, setImages] = useState<string[]>(note.images || []);
  const [audios, setAudios] = useState<string[]>(note.audios || []);
  const [content, setContent] = useState(externalContent);
  const [isUserDelete, setIsUserDelete] = useState(false);

  useEffect(() => {
    setImages(note.images || []);
    setAudios(note.audios || []);
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

  useEffect(() => {
    const nextContent = syncImageMarkers({
      content,
      imageCount: images.length,
      isUserDelete,
    });

    if (nextContent !== content) {
      const nextTextSegments = syncImageMarkersInTextSegments({
        content,
        fontSize,
        imageCount: images.length,
        isUserDelete,
        textSegments,
      });

      applyContentChange(nextContent);
      applyTextSegmentsChange(nextTextSegments);
    }
  }, [
    applyContentChange,
    applyTextSegmentsChange,
    content,
    images.length,
    isUserDelete,
    fontSize,
    textSegments,
  ]);

  const handleImagePicker = useCallback(async () => {
    try {
      const selectedImages = await pickImagesFromLibrary();
      if (selectedImages.length === 0) {
        return;
      }

      const nextState = await appendSelectedImages({
        assets: selectedImages,
        content,
        cursorPosition,
        fontSize,
        images,
        noteId: note.id,
        tempNoteId,
        textSegments,
      });
      applyImagesChange(nextState.images);
      applyContentChange(nextState.content);
      if (nextState.textSegments) {
        applyTextSegmentsChange(nextState.textSegments);
      }
    } catch (error) {
      console.error('处理图片失败:', error);
      const message =
        error instanceof Error && error.message === '选择图片时发生错误'
          ? error.message
          : '保存图片时发生错误';
      Alert.alert('错误', message);
    }
  }, [
    applyContentChange,
    applyImagesChange,
    content,
    cursorPosition,
    fontSize,
    images,
    note.id,
    tempNoteId,
    applyTextSegmentsChange,
    textSegments,
  ]);

  const handleCamera = useCallback(async () => {
    try {
      const image = await captureImage();
      if (!image?.uri) {
        return;
      }

      const nextState = await appendSelectedImages({
        assets: [image],
        content,
        cursorPosition,
        fontSize,
        images,
        noteId: note.id,
        tempNoteId,
        textSegments,
      });
      applyImagesChange(nextState.images);
      applyContentChange(nextState.content);
      if (nextState.textSegments) {
        applyTextSegmentsChange(nextState.textSegments);
      }
    } catch (error) {
      console.error('处理图片失败:', error);
      const message =
        error instanceof Error && error.message === '拍照时发生错误'
          ? error.message
          : '保存图片时发生错误';
      Alert.alert('错误', message);
    }
  }, [
    applyContentChange,
    applyImagesChange,
    content,
    cursorPosition,
    fontSize,
    images,
    note.id,
    tempNoteId,
    applyTextSegmentsChange,
    textSegments,
  ]);

  const handleDeleteImage = useCallback(
    async (imageIndex: number) => {
      try {
        setIsUserDelete(true);
        const nextImages = [...images];
        nextImages.splice(imageIndex, 1);
        const nextContent = removeImageMarker(
          content,
          imageIndex,
          images.length,
        );
        const nextTextSegments = removeImageMarkerFromTextSegments({
          content,
          fontSize,
          imageIndex,
          textSegments,
          totalImages: images.length,
        });

        applyContentChange(nextContent);
        applyTextSegmentsChange(nextTextSegments);

        setTimeout(() => {
          applyImagesChange(nextImages);
          setTimeout(() => {
            setIsUserDelete(false);
          }, 100);
        }, 50);
      } catch (error) {
        console.error('删除图片失败:', error);
        Alert.alert('错误', '删除图片时发生错误');
        setIsUserDelete(false);
      }
    },
    [
      applyContentChange,
      applyImagesChange,
      applyTextSegmentsChange,
      content,
      fontSize,
      images,
      textSegments,
    ],
  );

  const handleDeleteAudio = useCallback(
    async (audioIndex: number) => {
      try {
        const nextAudios = audios.filter(
          (_audio, index) => index !== audioIndex,
        );
        const nextContent = removeAudioMarker(
          content,
          audioIndex,
          audios.length,
        );
        const nextTextSegments = removeAudioMarkerFromTextSegments({
          audioIndex,
          content,
          fontSize,
          textSegments,
          totalAudios: audios.length,
        });

        applyAudiosChange(nextAudios);
        applyContentChange(nextContent);
        applyTextSegmentsChange(nextTextSegments);
      } catch (error) {
        console.error('删除音频失败:', error);
        Alert.alert('错误', '删除音频失败');
      }
    },
    [
      applyAudiosChange,
      applyContentChange,
      applyTextSegmentsChange,
      audios,
      content,
      fontSize,
      textSegments,
    ],
  );

  return {
    applyAudiosChange,
    applyContentChange,
    audios,
    content,
    handleCamera,
    handleDeleteAudio,
    handleDeleteImage,
    handleImagePicker,
    images,
  };
};
