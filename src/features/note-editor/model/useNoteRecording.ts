import {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFetchBlob from 'react-native-blob-util';
import {providerRegistry} from '../../../providers/providerRegistry';
import type {EditableTextSegment} from '../ui/types';
import {
  insertMarkerAtCursor,
  insertMarkerIntoTextSegments,
} from './noteEditorMediaUtils';

type UseNoteRecordingInput = {
  applyAudiosChange: (audios: string[]) => void;
  applyContentChange: (content: string) => void;
  applyTextSegmentsChange?: (segments: EditableTextSegment[]) => void;
  audios: string[];
  content: string;
  cursorPosition: number;
  fontSize: number;
  noteId?: string;
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
  textSegments,
  tempNoteId,
}: UseNoteRecordingInput) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(-1);
  const [currentAudioPath, setCurrentAudioPath] = useState<string | null>(null);
  const audioRecorderPlayer = useMemo(() => new AudioRecorderPlayer(), []);
  const attachmentProvider = useMemo(
    () => providerRegistry.getAttachmentProvider(),
    [],
  );

  const requestAudioPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: '录音权限',
          message: '需要访问麦克风以录制音频',
          buttonNeutral: '稍后询问',
          buttonNegative: '取消',
          buttonPositive: '确定',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      }

      Alert.alert('权限被拒绝', '需要录音权限才能使用录音功能');
      return false;
    } catch (error) {
      console.warn(error);
      return false;
    }
  }, []);

  const storeAudioAttachment = useCallback(
    async (audioUri: string, audioIndex: number): Promise<string> => {
      const effectiveNoteId = noteId || tempNoteId;

      return attachmentProvider.saveAttachment({
        uri: audioUri,
        noteId: effectiveNoteId,
        kind: 'audio',
        index: audioIndex,
        preferredExtension: 'mp3',
      });
    },
    [attachmentProvider, noteId, tempNoteId],
  );

  const getAudioPath = useCallback(
    (audioIndex: number): string => {
      const basePath = `${RNFetchBlob.fs.dirs.DocumentDir}/audios`;
      const fileName = `${noteId}_${Date.now()}_${audioIndex}.mp3`;
      return `${basePath}/${fileName}`;
    },
    [noteId],
  );

  const handleStartRecording = useCallback(async () => {
    try {
      if (isRecording) {
        return;
      }

      const hasPermission = await requestAudioPermission();
      if (!hasPermission) {
        return;
      }

      const audioDir = `${RNFetchBlob.fs.dirs.DocumentDir}/audios`;
      try {
        await RNFetchBlob.fs.mkdir(audioDir);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '';
        if (!message.includes('already exists')) {
          throw error;
        }
      }

      const audioPath = getAudioPath(audios.length);
      const exists = await RNFetchBlob.fs.exists(audioPath);
      if (exists) {
        await RNFetchBlob.fs.unlink(audioPath);
      }

      await audioRecorderPlayer.startRecorder(audioPath);
      audioRecorderPlayer.addRecordBackListener(
        (_event: {currentPosition: number}) => {},
      );
      setIsRecording(true);
      setCurrentAudioPath(audioPath);
    } catch (error) {
      console.error('开始录音失败:', error);
      Alert.alert('错误', '开始录音失败');
    }
  }, [
    audioRecorderPlayer,
    audios.length,
    getAudioPath,
    isRecording,
    requestAudioPermission,
  ]);

  const handleStopRecording = useCallback(async () => {
    try {
      if (!isRecording || !currentAudioPath) {
        return;
      }

      const exists = await RNFetchBlob.fs.exists(currentAudioPath);
      if (!exists) {
        throw new Error('录音文件不存在');
      }

      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);

      if (!result) {
        throw new Error('录音文件不存在');
      }

      const audioUrl = await storeAudioAttachment(currentAudioPath, audios.length);
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

      applyAudiosChange(nextAudios);
      applyContentChange(nextContent);
      applyTextSegmentsChange?.(nextTextSegments);
      setCurrentAudioPath(null);
    } catch (error) {
      console.error('停止录音失败:', error);
      setIsRecording(false);
      setCurrentAudioPath(null);
      Alert.alert('错误', '停止录音失败');
    }
  }, [
    applyAudiosChange,
    applyContentChange,
    applyTextSegmentsChange,
    audioRecorderPlayer,
    audios,
    content,
    cursorPosition,
    currentAudioPath,
    fontSize,
    isRecording,
    storeAudioAttachment,
    textSegments,
  ]);

  useEffect(() => {
    return () => {
      if (isRecording) {
        handleStopRecording();
      }
    };
  }, [handleStopRecording, isRecording]);

  const handlePlayAudio = useCallback(
    async (audioIndex: number) => {
      try {
        if (isPlaying && currentAudioIndex === audioIndex) {
          await audioRecorderPlayer.stopPlayer();
          setIsPlaying(false);
          setCurrentAudioIndex(-1);
          return;
        }

        if (isPlaying) {
          await audioRecorderPlayer.stopPlayer();
        }

        await audioRecorderPlayer.startPlayer(audios[audioIndex]);
        audioRecorderPlayer.addPlayBackListener(
          (event: {currentPosition: number; duration: number}) => {
            if (event.currentPosition === event.duration) {
              setIsPlaying(false);
              setCurrentAudioIndex(-1);
            }
          },
        );
        setIsPlaying(true);
        setCurrentAudioIndex(audioIndex);
      } catch (error) {
        console.error('播放音频失败:', error);
        Alert.alert('错误', '播放音频失败');
      }
    },
    [audioRecorderPlayer, audios, currentAudioIndex, isPlaying],
  );

  const handleRecordingToggle = useCallback(() => {
    if (isRecording) {
      handleStopRecording();
      return;
    }

    handleStartRecording();
  }, [handleStartRecording, handleStopRecording, isRecording]);

  return {
    currentAudioIndex,
    handlePlayAudio,
    handleRecordingToggle,
    handleStartRecording,
    handleStopRecording,
    isPlaying,
    isRecording,
  };
};
