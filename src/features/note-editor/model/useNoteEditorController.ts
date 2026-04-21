import {useCallback, useEffect, useState} from 'react';
import type {RichDocument} from '../../../entities/document/types';
import type {NoteDraft} from '../../../entities/note/draft';
import {hasWidgetBlocks} from '../../../entities/note/document';
import type {TextSegment} from '../../../entities/note/types';
import type {WidgetSchema} from '../../../entities/widget/types';
import {
  type H5TextEditorFormatCommand,
  type H5TextEditorMediaInsertRequestEvent,
} from '../../h5-editor/model/h5TextEditorBridge';
import {useAudioPlayback} from './useAudioPlayback';
import {useNoteEditorActions} from './useNoteEditorActions';
import {useNoteFormatting} from './useNoteFormatting';
import {useNoteMedia} from './useNoteMedia';
import {useNoteRecording} from './useNoteRecording';
import {getTextSegmentsContent} from './noteEditorTextSegments';

type UseNoteEditorControllerInput = {
  visible: boolean;
  note: NoteDraft;
  draftDocument: RichDocument;
  onSave: () => Promise<void>;
  onChangeContent: (text: string) => void;
  onChangeImages?: (images: string[]) => void;
  onChangeAudios?: (audios: string[]) => void;
  onChangeFontSize?: (size: number) => void;
  onChangeTextSegments?: (segments: TextSegment[]) => void;
  handleAppendWidgets: (widgets: WidgetSchema[]) => void;
  handleMirrorContentChange: (
    nextContent: string,
    applyContentChange: (content: string) => void,
  ) => void;
};

export const useNoteEditorController = ({
  visible,
  note,
  draftDocument,
  onSave,
  onChangeContent,
  onChangeImages,
  onChangeAudios,
  onChangeFontSize,
  onChangeTextSegments,
  handleAppendWidgets,
  handleMirrorContentChange,
}: UseNoteEditorControllerInput) => {
  const [tempNoteId] = useState(
    () => `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
  );
  const [h5FormatCommand, setH5FormatCommand] =
    useState<H5TextEditorFormatCommand | null>(null);

  useEffect(() => {
    if (!visible) {
      setH5FormatCommand(null);
    }
  }, [visible]);

  const handleQueueH5FormatCommand = useCallback(
    (type: H5TextEditorFormatCommand['type']) => {
      setH5FormatCommand(currentCommand => ({
        id: (currentCommand?.id ?? 0) + 1,
        type,
      }));
    },
    [],
  );
  const handleNoopAsync = useCallback(async () => {}, []);

  const formatting = useNoteFormatting({
    note,
    onChangeContent: nextContent => {
      handleMirrorContentChange(nextContent, onChangeContent);
    },
    onChangeFontSize,
    onChangeTextSegments,
  });
  const editorContent = getTextSegmentsContent(formatting.textSegments);

  const media = useNoteMedia({
    content: editorContent,
    cursorPosition: formatting.cursorPosition,
    fontSize: formatting.fontSize,
    note,
    onChangeAudios,
    onChangeContent: nextContent => {
      handleMirrorContentChange(nextContent, onChangeContent);
    },
    onChangeImages,
    onChangeTextSegments: formatting.applyTextSegmentsChange,
    tempNoteId,
    textSegments: formatting.textSegments,
  });
  const recording = useNoteRecording({
    applyAudiosChange: media.applyAudiosChange,
    applyContentChange: media.applyContentChange,
    applyTextSegmentsChange: formatting.applyTextSegmentsChange,
    audios: media.audios,
    content: editorContent,
    cursorPosition: formatting.cursorPosition,
    fontSize: formatting.fontSize,
    noteId: note.id,
    textSegments: formatting.textSegments,
    tempNoteId,
  });
  const playback = useAudioPlayback({
    audios: media.audios,
  });
  const actions = useNoteEditorActions({
    audiosCount: media.audios.length,
    content: editorContent,
    hasWidgets: hasWidgetBlocks(draftDocument),
    imagesCount: media.images.length,
    onAppendText: formatting.handleAppendText,
    onAppendWidgets: handleAppendWidgets,
    onSave,
    title: note.title,
  });
  const handleH5MediaInsertRequest = useCallback(
    (event: H5TextEditorMediaInsertRequestEvent) => {
      if (event.action === 'insert-image-assets') {
        void media.handleInlineImageAssets(event.assets);
        return;
      }

      if (event.action === 'pick-image') {
        void media.handleImagePicker();
        return;
      }

      if (event.action === 'capture-image') {
        void media.handleCamera();
        return;
      }

      recording.handleRecordingToggle();
    },
    [
      media.handleCamera,
      media.handleImagePicker,
      media.handleInlineImageAssets,
      recording.handleRecordingToggle,
    ],
  );

  return {
    actions,
    editorContent,
    formatting,
    h5FormatCommand,
    handleH5MediaInsertRequest,
    handleNoopAsync,
    handleQueueH5FormatCommand,
    media,
    playback,
    recording,
  };
};

export type NoteEditorController = ReturnType<typeof useNoteEditorController>;
