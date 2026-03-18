import type {EditableTextSegment} from '../ui/types';
import {
  removeAudioMarker,
  removeImageMarker,
  syncImageMarkers,
} from './noteEditorMediaContentMarkers';
import {
  removeAudioMarkerFromTextSegments,
  removeImageMarkerFromTextSegments,
  syncImageMarkersInTextSegments,
} from './noteEditorMediaTextSegments';

type MediaStateChange = {
  content: string;
  textSegments: EditableTextSegment[];
};

export const syncImageMediaState = ({
  content,
  fontSize,
  imageCount,
  isUserDelete,
  textSegments,
}: {
  content: string;
  fontSize: number;
  imageCount: number;
  isUserDelete: boolean;
  textSegments?: EditableTextSegment[];
}): MediaStateChange | null => {
  const nextContent = syncImageMarkers({
    content,
    imageCount,
    isUserDelete,
  });

  if (nextContent === content) {
    return null;
  }

  return {
    content: nextContent,
    textSegments: syncImageMarkersInTextSegments({
      content,
      fontSize,
      imageCount,
      isUserDelete,
      textSegments,
    }),
  };
};

export const createImageDeletionState = ({
  content,
  fontSize,
  imageIndex,
  textSegments,
  totalImages,
}: {
  content: string;
  fontSize: number;
  imageIndex: number;
  textSegments?: EditableTextSegment[];
  totalImages: number;
}): MediaStateChange => {
  return {
    content: removeImageMarker(content, imageIndex, totalImages),
    textSegments: removeImageMarkerFromTextSegments({
      content,
      fontSize,
      imageIndex,
      textSegments,
      totalImages,
    }),
  };
};

export const createAudioDeletionState = ({
  audioIndex,
  content,
  fontSize,
  textSegments,
  totalAudios,
}: {
  audioIndex: number;
  content: string;
  fontSize: number;
  textSegments?: EditableTextSegment[];
  totalAudios: number;
}): MediaStateChange => {
  return {
    content: removeAudioMarker(content, audioIndex, totalAudios),
    textSegments: removeAudioMarkerFromTextSegments({
      audioIndex,
      content,
      fontSize,
      textSegments,
      totalAudios,
    }),
  };
};
