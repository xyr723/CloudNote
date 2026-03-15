import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFetchBlob from 'react-native-blob-util';

const AUDIO_DIR = `${RNFetchBlob.fs.dirs.DocumentDir}/audios`;

type UseAudioRecordingSessionInput = {
  audioCount: number;
  noteId?: string;
  tempNoteId: string;
};

const requestAudioPermission = async (): Promise<boolean> => {
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
};

const ensureAudioDirectory = async (): Promise<void> => {
  try {
    await RNFetchBlob.fs.mkdir(AUDIO_DIR);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (!message.includes('already exists')) {
      throw error;
    }
  }
};

export const useAudioRecordingSession = ({
  audioCount,
  noteId,
  tempNoteId,
}: UseAudioRecordingSessionInput) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentAudioPath, setCurrentAudioPath] = useState<string | null>(null);
  const audioRecorderPlayer = useMemo(() => new AudioRecorderPlayer(), []);
  const isRecordingRef = useRef(isRecording);

  const buildAudioPath = useCallback((): string => {
    const noteKey = noteId ?? tempNoteId;
    return `${AUDIO_DIR}/${noteKey}_${Date.now()}_${audioCount}.mp3`;
  }, [audioCount, noteId, tempNoteId]);

  const handleStartRecording = useCallback(async (): Promise<void> => {
    try {
      if (isRecording) {
        return;
      }

      const hasPermission = await requestAudioPermission();
      if (!hasPermission) {
        return;
      }

      await ensureAudioDirectory();

      const audioPath = buildAudioPath();
      const exists = await RNFetchBlob.fs.exists(audioPath);
      if (exists) {
        await RNFetchBlob.fs.unlink(audioPath);
      }

      await audioRecorderPlayer.startRecorder(audioPath);
      audioRecorderPlayer.addRecordBackListener(
        (_event: {currentPosition: number}) => {},
      );
      setCurrentAudioPath(audioPath);
      setIsRecording(true);
    } catch (error) {
      console.error('开始录音失败:', error);
      Alert.alert('错误', '开始录音失败');
    }
  }, [audioRecorderPlayer, buildAudioPath, isRecording]);

  const handleStopRecording = useCallback(async (): Promise<string | null> => {
    try {
      if (!isRecording || !currentAudioPath) {
        return null;
      }

      const recordedPath = currentAudioPath;
      const exists = await RNFetchBlob.fs.exists(recordedPath);
      if (!exists) {
        throw new Error('录音文件不存在');
      }

      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      setCurrentAudioPath(null);

      if (!result) {
        throw new Error('录音文件不存在');
      }

      return recordedPath;
    } catch (error) {
      console.error('停止录音失败:', error);
      setIsRecording(false);
      setCurrentAudioPath(null);
      Alert.alert('错误', '停止录音失败');
      return null;
    }
  }, [audioRecorderPlayer, currentAudioPath, isRecording]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (!isRecordingRef.current) {
        return;
      }

      audioRecorderPlayer.removeRecordBackListener();
      audioRecorderPlayer.stopRecorder().catch(() => undefined);
    };
  }, [audioRecorderPlayer]);

  return {
    currentAudioPath,
    handleStartRecording,
    handleStopRecording,
    isRecording,
  };
};
