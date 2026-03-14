import {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import type {NoteDraft} from '../../../entities/note/draft';
import {providerRegistry} from '../../../providers/providerRegistry';
import {
  insertMarkerAtCursor,
  insertMarkerIntoTextSegments,
  removeAudioMarkerFromTextSegments,
  removeAudioMarker,
  removeImageMarkerFromTextSegments,
  removeImageMarker,
  syncImageMarkersInTextSegments,
  syncImageMarkers,
} from './noteEditorMediaUtils';
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
  const [showImageModal, setShowImageModal] = useState(false);
  const [isUserDelete, setIsUserDelete] = useState(false);
  const attachmentProvider = useMemo(
    () => providerRegistry.getAttachmentProvider(),
    [],
  );

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

  const storeAttachment = useCallback(
    async (
      uri: string,
      noteId: string | undefined,
      index: number,
      kind: 'image' | 'audio',
      preferredExtension?: string,
    ): Promise<string> => {
      const effectiveNoteId = noteId || tempNoteId;

      return attachmentProvider.saveAttachment({
        uri,
        noteId: effectiveNoteId,
        kind,
        index,
        preferredExtension,
      });
    },
    [attachmentProvider, tempNoteId],
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

  const handleImagePicker = useCallback(() => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        selectionLimit: 0,
      },
      async response => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('错误', '选择图片时发生错误');
          return;
        }
        if (!response.assets || response.assets.length === 0) {
          return;
        }

        try {
          const nextImages = [...images];
          let nextContent = content;
          let nextTextSegments = textSegments;
          let nextCursorPosition = cursorPosition;

          for (const asset of response.assets) {
            if (!asset.uri) {
              continue;
            }

            const imageUrl = await storeAttachment(
              asset.uri,
              note.id,
              nextImages.length,
              'image',
            );
            const marker = `[图片${nextImages.length}]`;
            const previousContent = nextContent;
            nextImages.push(imageUrl);
            nextContent = insertMarkerAtCursor(
              previousContent,
              nextCursorPosition,
              marker,
            );
            nextTextSegments = insertMarkerIntoTextSegments({
              content: previousContent,
              cursorPosition: nextCursorPosition,
              fontSize,
              marker,
              textSegments: nextTextSegments,
            });
            nextCursorPosition += marker.length;
          }

          applyImagesChange(nextImages);
          applyContentChange(nextContent);
          if (nextTextSegments) {
            applyTextSegmentsChange(nextTextSegments);
          }
        } catch (error) {
          console.error('处理图片失败:', error);
          Alert.alert('错误', '保存图片时发生错误');
        }
      },
    );
  }, [
    applyContentChange,
    applyImagesChange,
    content,
    cursorPosition,
    fontSize,
    images,
    note.id,
    applyTextSegmentsChange,
    storeAttachment,
    textSegments,
  ]);

  const handleCamera = useCallback(() => {
    ImagePicker.launchCamera(
      {
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      },
      async response => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('错误', '拍照时发生错误');
          return;
        }
        if (!response.assets?.[0]?.uri) {
          return;
        }

        try {
          const imageUrl = await storeAttachment(
            response.assets[0].uri,
            note.id,
            images.length,
            'image',
          );
          const nextImages = [...images, imageUrl];
          const nextContent = insertMarkerAtCursor(
            content,
            cursorPosition,
            `[图片${nextImages.length - 1}]`,
          );
          const nextTextSegments = insertMarkerIntoTextSegments({
            content,
            cursorPosition,
            fontSize,
            marker: `[图片${nextImages.length - 1}]`,
            textSegments,
          });

          applyImagesChange(nextImages);
          applyContentChange(nextContent);
          applyTextSegmentsChange(nextTextSegments);
        } catch (error) {
          console.error('处理图片失败:', error);
          Alert.alert('错误', '保存图片时发生错误');
        }
      },
    );
  }, [
    applyContentChange,
    applyImagesChange,
    content,
    cursorPosition,
    fontSize,
    images,
    note.id,
    applyTextSegmentsChange,
    storeAttachment,
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
    setShowImageModal,
    showImageModal,
    storeAttachment,
  };
};
