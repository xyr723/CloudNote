import type {PickedImageAsset} from '../../../shared/media/imagePicker';
import {saveNoteAttachment} from '../../../shared/media/noteAttachmentStore';
import type {EditableTextSegment} from '../ui/types';
import {
  insertMarkerAtCursor,
  insertMarkerIntoTextSegments,
} from './noteEditorMediaUtils';

type AppendSelectedImagesInput = {
  content: string;
  cursorPosition: number;
  fontSize: number;
  images: string[];
  noteId?: string;
  tempNoteId: string;
  textSegments?: EditableTextSegment[];
  assets: PickedImageAsset[];
};

type AppendSelectedImagesResult = {
  content: string;
  images: string[];
  textSegments?: EditableTextSegment[];
};

export async function appendSelectedImages(
  input: AppendSelectedImagesInput,
): Promise<AppendSelectedImagesResult> {
  const nextImages = [...input.images];
  let nextContent = input.content;
  let nextTextSegments = input.textSegments;
  let nextCursorPosition = input.cursorPosition;

  for (const asset of input.assets) {
    const imageUrl = await saveNoteAttachment({
      index: nextImages.length,
      kind: 'image',
      noteId: input.noteId,
      tempNoteId: input.tempNoteId,
      uri: asset.uri,
    });
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
      fontSize: input.fontSize,
      marker,
      textSegments: nextTextSegments,
    });
    nextCursorPosition += marker.length;
  }

  return {
    content: nextContent,
    images: nextImages,
    textSegments: nextTextSegments,
  };
}
