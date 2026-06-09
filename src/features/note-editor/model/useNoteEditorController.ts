import {useCallback, useEffect, useRef, useState} from 'react';
import type {RichDocument} from '../../../entities/document/types';
import type {NoteDraft} from '../../../entities/note/draft';
import {
  appendWidgetSchemasToDocument,
  createLiveNoteDocument,
  hasWidgetBlocks,
} from '../../../entities/note/document';
import type {TextSegment} from '../../../entities/note/types';
import type {WidgetSchema} from '../../../entities/widget/types';
import type {AiCompletionResult} from '../../../providers/ai/aiProvider';
import {
  type H5TextEditorFormatCommand,
  type H5TextEditorMediaInsertRequestEvent,
  type H5TextEditorState,
} from '../../h5-editor/model/h5TextEditorBridge';
import {useAudioPlayback} from './useAudioPlayback';
import {useNoteEditorActions} from './useNoteEditorActions';
import {appendTextToTextSegments} from './noteEditorFormattingUtils';
import {useNoteFormatting} from './useNoteFormatting';
import {useNoteMedia} from './useNoteMedia';
import {useNoteRecording} from './useNoteRecording';
import {getTextSegmentsContent} from './noteEditorTextSegments';
import type {
  NoteEditorChangeState,
  NoteEditorTextChangeState,
} from '../ui/types';

type NoteEditorQueuedStatePatch = Partial<
  Omit<NoteEditorChangeState, 'content'>
> & {
  content?: string;
};

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
  handleApplyDocumentChange: (document: RichDocument) => void;
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
  handleApplyDocumentChange,
  handleAppendWidgets,
  handleMirrorContentChange,
}: UseNoteEditorControllerInput) => {
  const [tempNoteId] = useState(
    () => `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
  );
  const [h5FormatCommand, setH5FormatCommand] =
    useState<H5TextEditorFormatCommand | null>(null);
  const editorContentRef = useRef(note.content);
  const pendingStatePatchRef = useRef<NoteEditorQueuedStatePatch | null>(null);
  const isStatePatchFlushScheduledRef = useRef(false);

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

  const applyEditorChangeState = useCallback(
    (nextState: NoteEditorChangeState) => {
      if (nextState.document) {
        handleApplyDocumentChange(nextState.document);
      }

      if (nextState.document) {
        onChangeContent(nextState.content);
      } else {
        handleMirrorContentChange(nextState.content, onChangeContent);
      }

      if (typeof nextState.textSegments !== 'undefined') {
        onChangeTextSegments?.(nextState.textSegments);
      }

      if (typeof nextState.images !== 'undefined') {
        onChangeImages?.(nextState.images);
      }

      if (typeof nextState.audios !== 'undefined') {
        onChangeAudios?.(nextState.audios);
      }

      if (typeof nextState.fontSize === 'number') {
        onChangeFontSize?.(nextState.fontSize);
      }
    },
    [
      handleApplyDocumentChange,
      handleMirrorContentChange,
      onChangeAudios,
      onChangeContent,
      onChangeFontSize,
      onChangeImages,
      onChangeTextSegments,
    ],
  );

  const queueEditorStatePatch = useCallback(
    (nextPatch: NoteEditorQueuedStatePatch) => {
      pendingStatePatchRef.current = {
        ...pendingStatePatchRef.current,
        ...nextPatch,
      };

      if (isStatePatchFlushScheduledRef.current) {
        return;
      }

      isStatePatchFlushScheduledRef.current = true;
      Promise.resolve().then(() => {
        isStatePatchFlushScheduledRef.current = false;
        const queuedPatch = pendingStatePatchRef.current;
        pendingStatePatchRef.current = null;

        if (!queuedPatch) {
          return;
        }

        applyEditorChangeState({
          ...queuedPatch,
          content:
            queuedPatch.content ??
            (queuedPatch.textSegments
              ? getTextSegmentsContent(queuedPatch.textSegments)
              : editorContentRef.current),
        });
      });
    },
    [applyEditorChangeState],
  );

  const formatting = useNoteFormatting({
    note,
    onChangeContent: nextContent => {
      queueEditorStatePatch({
        content: nextContent,
      });
    },
    onChangeFontSize: nextFontSize => {
      queueEditorStatePatch({
        fontSize: nextFontSize,
      });
    },
    onChangeTextSegments: nextTextSegments => {
      queueEditorStatePatch({
        textSegments: nextTextSegments,
      });
    },
  });
  const editorContent = getTextSegmentsContent(formatting.textSegments);

  useEffect(() => {
    editorContentRef.current = editorContent;
  }, [editorContent]);

  const media = useNoteMedia({
    content: editorContent,
    cursorPosition: formatting.cursorPosition,
    fontSize: formatting.fontSize,
    note,
    onChangeAudios: nextAudios => {
      queueEditorStatePatch({
        audios: nextAudios,
      });
    },
    onChangeContent: nextContent => {
      queueEditorStatePatch({
        content: nextContent,
      });
    },
    onChangeImages: nextImages => {
      queueEditorStatePatch({
        images: nextImages,
      });
    },
    onChangeTextSegments: nextTextSegments => {
      queueEditorStatePatch({
        textSegments: nextTextSegments,
      });
    },
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
    onApplyAiCompletion: (completionResult: AiCompletionResult) => {
      const nextWidgets = completionResult.widgets ?? [];
      const hasText = completionResult.text.length > 0;
      const nextTextSegments = hasText
        ? appendTextToTextSegments(
            formatting.textSegments,
            completionResult.text,
            formatting.fontSize,
          )
        : formatting.textSegments;
      const nextContent = hasText
        ? getTextSegmentsContent(nextTextSegments)
        : editorContent;
      const nextDocument = createLiveNoteDocument({
        content: nextContent,
        document:
          nextWidgets.length > 0
            ? appendWidgetSchemasToDocument(draftDocument, nextWidgets)
            : draftDocument,
      });

      if (hasText) {
        formatting.applyExternalRichTextState({
          content: nextContent,
          textSegments: nextTextSegments,
        });
      }

      applyEditorChangeState({
        content: nextContent,
        document: nextDocument,
        textSegments: hasText ? nextTextSegments : undefined,
      });
    },
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
  const handleNativeChangeState = useCallback(
    (nextState: NoteEditorTextChangeState) => {
      formatting.applyExternalRichTextState({
        content: nextState.content,
        textSegments: nextState.textSegments,
      });
      applyEditorChangeState(nextState);
    },
    [applyEditorChangeState, formatting],
  );
  const handleH5ChangeState = useCallback(
    (nextState: H5TextEditorState) => {
      formatting.applyExternalRichTextState({
        content: nextState.content,
        textSegments: nextState.textSegments,
      });
      applyEditorChangeState(nextState);
    },
    [applyEditorChangeState, formatting],
  );

  return {
    actions,
    editorContent,
    formatting,
    h5FormatCommand,
    handleH5ChangeState,
    handleH5MediaInsertRequest,
    handleNativeChangeState,
    handleNoopAsync,
    handleQueueH5FormatCommand,
    media,
    playback,
    recording,
  };
};

export type NoteEditorController = ReturnType<typeof useNoteEditorController>;
