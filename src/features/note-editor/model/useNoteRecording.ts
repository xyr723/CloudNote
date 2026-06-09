import {useCallback} from 'react';
import {Alert} from 'react-native';
import {saveNoteAttachment} from '../../../shared/media/noteAttachmentStore';
import type {
  EditableTextSegment,
  NoteEditorChangeState,
} from '../ui/types';
import {insertMarkerAtCursor} from './noteEditorMediaContentMarkers';
import {insertMarkerIntoTextSegments} from './noteEditorMediaTextSegments';
import {useAudioRecordingSession} from './useAudioRecordingSession';

type UseNoteRecordingInput = {
  applyAudiosChange: (audios: string[]) => void;
  applyContentChange: (content: string) => void;
  applyTextSegmentsChange?: (segments: EditableTextSegment[]) => void;
  audios: string[];
  content: string;
  cursorPosition: number;
  fontSize: number;
  noteId?: string;
  onChangeState?: (state: NoteEditorChangeState) => void;
  textSegments?: EditableTextSegment[];
  tempNoteId: string;
};

export const useNoteRecording = ({
  applyAudiosChange,
  applyContentChange,
  applyTextSegmentsChange,
  audios,
  content,
  cursorPosition,
  fontSize,
  noteId,
  onChangeState,
  textSegments,
  tempNoteId,
}: UseNoteRecordingInput) => {
  const recordingSession = useAudioRecordingSession({
    audioCount: audios.length,
    noteId,
    tempNoteId,
  });

  const storeAudioAttachment = useCallback(
    async (audioUri: string, audioIndex: number): Promise<string> => {
      return saveNoteAttachment({
        index: audioIndex,
        kind: 'audio',
        noteId,
        preferredExtension: 'mp3',
        tempNoteId,
        uri: audioUri,
      });
    },
    [noteId, tempNoteId],
  );

  const handleStartRecording = recordingSession.handleStartRecording;

  const handleStopRecording = useCallback(async () => {
    try {
      const recordedPath = await recordingSession.handleStopRecording();
      if (!recordedPath) {
        return;
      }

      const audioUrl = await storeAudioAttachment(recordedPath, audios.length);
      const nextAudios = [...audios, audioUrl];
      const marker = `[音频${nextAudios.length - 1}]`;
      const nextContent = insertMarkerAtCursor(
        content,
        cursorPosition,
        marker,
      );
      const nextTextSegments = insertMarkerIntoTextSegments({
        content,
        cursorPosition,
        fontSize,
        marker,
        textSegments,
      });

      if (onChangeState) {
        onChangeState({
          audios: nextAudios,
          content: nextContent,
          textSegments: nextTextSegments,
        });
        return;
      }

      applyAudiosChange(nextAudios);
      applyContentChange(nextContent);
      applyTextSegmentsChange?.(nextTextSegments);
    } catch (error) {
      console.error('停止录音失败:', error);
      Alert.alert('错误', '停止录音失败');
    }
  }, [
    applyAudiosChange,
    applyContentChange,
    applyTextSegmentsChange,
    audios,
    content,
    cursorPosition,
    fontSize,
    onChangeState,
    recordingSession,
    storeAudioAttachment,
    textSegments,
  ]);

  const handleRecordingToggle = useCallback(() => {
    if (recordingSession.isRecording) {
      handleStopRecording();
      return;
    }

    handleStartRecording();
  }, [handleStartRecording, handleStopRecording, recordingSession.isRecording]);

  return {
    handleRecordingToggle,
    handleStartRecording,
    handleStopRecording,
    isRecording: recordingSession.isRecording,
  };
};
