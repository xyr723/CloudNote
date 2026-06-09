import {useCallback, useEffect, useState} from 'react';
import {Alert} from 'react-native';
import type {NoteDraft} from '../../../entities/note/draft';
import {
  captureImage,
  type PickedImageAsset,
  pickImagesFromLibrary,
} from '../../../shared/media/imagePicker';
import {appendSelectedImages} from './noteEditorImageInsertion';
import {
  createAudioDeletionState,
  createImageDeletionState,
  syncImageMediaState,
} from './noteEditorMediaMutations';
import {useNoteMediaState} from './useNoteMediaState';
import type {
  EditableTextSegment,
  NoteEditorChangeState,
} from '../ui/types';

type UseNoteMediaInput = {
  content: string;
  cursorPosition: number;
  fontSize: number;
  note: NoteDraft;
  onChangeState?: (state: NoteEditorChangeState) => void;
  onChangeAudios?: (audios: string[]) => void;
  onChangeContent?: (content: string) => void;
  onChangeImages?: (images: string[]) => void;
  onChangeTextSegments?: (segments: EditableTextSegment[]) => void;
  tempNoteId: string;
  textSegments?: EditableTextSegment[];
};

const IMAGE_ERROR_FALLBACK_MESSAGE = '保存图片时发生错误';

export const useNoteMedia = ({
  content: externalContent,
  cursorPosition,
  fontSize,
  note,
  onChangeState,
  onChangeAudios,
  onChangeContent,
  onChangeImages,
  onChangeTextSegments,
  tempNoteId,
  textSegments,
}: UseNoteMediaInput) => {
  const [isUserDelete, setIsUserDelete] = useState(false);
  const {
    applyAudiosChange,
    applyContentChange,
    applyImageInsertionState,
    applyImagesChange,
    applyStateChange,
    applyTextSegmentsChange,
    audios,
    content,
    images,
  } = useNoteMediaState({
    externalContent,
    note,
    onChangeState,
    onChangeAudios,
    onChangeContent,
    onChangeImages,
    onChangeTextSegments,
  });

  useEffect(() => {
    const syncedState = syncImageMediaState({
      content,
      fontSize,
      imageCount: images.length,
      isUserDelete,
      textSegments,
    });

    if (!syncedState) {
      return;
    }

    if (onChangeState) {
      applyStateChange({
        content: syncedState.content,
        textSegments: syncedState.textSegments,
      });
      return;
    }

    applyContentChange(syncedState.content);
    applyTextSegmentsChange(syncedState.textSegments);
  }, [
    applyContentChange,
    applyStateChange,
    applyTextSegmentsChange,
    content,
    fontSize,
    images.length,
    isUserDelete,
    onChangeState,
    textSegments,
  ]);

  const appendImageAssets = useCallback(
    async (assets: PickedImageAsset[]) => {
      if (assets.length === 0) {
        return;
      }

      const nextState = await appendSelectedImages({
        assets,
        content,
        cursorPosition,
        fontSize,
        images,
        noteId: note.id,
        tempNoteId,
        textSegments,
      });

      applyImageInsertionState(nextState);
    },
    [
      applyImageInsertionState,
      content,
      cursorPosition,
      fontSize,
      images,
      note.id,
      tempNoteId,
      textSegments,
    ],
  );

  const handleImageAssetSelection = useCallback(
    async (
      loadAssets: () => Promise<PickedImageAsset[]>,
      expectedMessage: string,
    ) => {
      try {
        await appendImageAssets(await loadAssets());
      } catch (error) {
        console.error('处理图片失败:', error);
        const errorMessage =
          error instanceof Error && error.message === expectedMessage
            ? error.message
            : IMAGE_ERROR_FALLBACK_MESSAGE;

        Alert.alert('错误', errorMessage);
      }
    },
    [appendImageAssets],
  );

  const handleImagePicker = useCallback(async () => {
    await handleImageAssetSelection(
      pickImagesFromLibrary,
      '选择图片时发生错误',
    );
  }, [handleImageAssetSelection]);

  const handleCamera = useCallback(async () => {
    await handleImageAssetSelection(async () => {
      const image = await captureImage();

      return image?.uri ? [image] : [];
    }, '拍照时发生错误');
  }, [handleImageAssetSelection]);

  const handleInlineImageAssets = useCallback(
    async (assets: PickedImageAsset[]) => {
      await handleImageAssetSelection(async () => assets, IMAGE_ERROR_FALLBACK_MESSAGE);
    },
    [handleImageAssetSelection],
  );

  const handleDeleteImage = useCallback(
    async (imageIndex: number) => {
      try {
        setIsUserDelete(true);
        const nextImages = [...images];
        nextImages.splice(imageIndex, 1);
        const nextState = createImageDeletionState({
          content,
          fontSize,
          imageIndex,
          textSegments,
          totalImages: images.length,
        });

        if (onChangeState) {
          applyStateChange({
            content: nextState.content,
            images: nextImages,
            textSegments: nextState.textSegments,
          });
          setTimeout(() => {
            setIsUserDelete(false);
          }, 100);
          return;
        }

        applyContentChange(nextState.content);
        applyTextSegmentsChange(nextState.textSegments);
        applyImagesChange(nextImages);
        setTimeout(() => {
          setIsUserDelete(false);
        }, 100);
      } catch (error) {
        console.error('删除图片失败:', error);
        Alert.alert('错误', '删除图片时发生错误');
        setIsUserDelete(false);
      }
    },
    [
      applyContentChange,
      applyStateChange,
      applyTextSegmentsChange,
      content,
      fontSize,
      images,
      onChangeState,
      applyImagesChange,
      textSegments,
    ],
  );

  const handleDeleteAudio = useCallback(
    async (audioIndex: number) => {
      try {
        const nextAudios = audios.filter(
          (_audio, index) => index !== audioIndex,
        );
        const nextState = createAudioDeletionState({
          audioIndex,
          content,
          fontSize,
          textSegments,
          totalAudios: audios.length,
        });

        if (onChangeState) {
          applyStateChange({
            audios: nextAudios,
            content: nextState.content,
            textSegments: nextState.textSegments,
          });
          return;
        }

        applyAudiosChange(nextAudios);
        applyContentChange(nextState.content);
        applyTextSegmentsChange(nextState.textSegments);
      } catch (error) {
        console.error('删除音频失败:', error);
        Alert.alert('错误', '删除音频失败');
      }
    },
    [
      applyAudiosChange,
      applyContentChange,
      applyStateChange,
      applyTextSegmentsChange,
      audios,
      content,
      fontSize,
      onChangeState,
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
    handleInlineImageAssets,
    images,
  };
};
