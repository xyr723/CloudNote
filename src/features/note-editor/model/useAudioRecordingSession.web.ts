import {useCallback, useEffect, useRef, useState} from 'react';
import {Alert} from 'react-native';

type UseAudioRecordingSessionInput = {
  audioCount: number;
  noteId?: string;
  tempNoteId: string;
};

type BrowserMediaStreamTrack = {
  stop: () => void;
};

type BrowserMediaStream = {
  getTracks: () => BrowserMediaStreamTrack[];
};

type BrowserMediaRecorderEvent = {
  data: Blob;
};

type BrowserMediaRecorder = {
  state: string;
  ondataavailable: null | ((event: BrowserMediaRecorderEvent) => void);
  onstop: null | (() => void);
  start: () => void;
  stop: () => void;
};

type BrowserGlobals = {
  MediaRecorder?: new (stream: BrowserMediaStream) => BrowserMediaRecorder;
  navigator?: {
    mediaDevices?: {
      getUserMedia: (constraints: {audio: true}) => Promise<BrowserMediaStream>;
    };
  };
  URL?: {
    createObjectURL?: (blob: Blob) => string;
  };
};

const browserGlobals = globalThis as unknown as BrowserGlobals;

const stopStreamTracks = (stream: BrowserMediaStream | null) => {
  stream?.getTracks().forEach(track => {
    track.stop();
  });
};

const isRecordingSupported = (): boolean => {
  return Boolean(
    browserGlobals.MediaRecorder &&
      browserGlobals.navigator?.mediaDevices?.getUserMedia &&
      browserGlobals.URL?.createObjectURL,
  );
};

export const useAudioRecordingSession = ({
  audioCount,
  noteId,
  tempNoteId,
}: UseAudioRecordingSessionInput) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentAudioPath, setCurrentAudioPath] = useState<string | null>(null);
  const mediaRecorderRef = useRef<BrowserMediaRecorder | null>(null);
  const mediaStreamRef = useRef<BrowserMediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);

  const buildRecordingPath = useCallback((): string => {
    const noteKey = noteId ?? tempNoteId;

    return `recording:${noteKey}_${Date.now()}_${audioCount}`;
  }, [audioCount, noteId, tempNoteId]);

  const resetRecordingState = useCallback(() => {
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    recordedChunksRef.current = [];
    setIsRecording(false);
    setCurrentAudioPath(null);
  }, []);

  const handleStartRecording = useCallback(async (): Promise<void> => {
    if (isRecording) {
      return;
    }

    if (!isRecordingSupported()) {
      Alert.alert('暂不支持', '当前浏览器暂不支持录音功能');
      return;
    }

    try {
      const stream = await browserGlobals.navigator!.mediaDevices!.getUserMedia({
        audio: true,
      });
      const MediaRecorderConstructor = browserGlobals.MediaRecorder!;
      const mediaRecorder = new MediaRecorderConstructor(stream);

      recordedChunksRef.current = [];
      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setCurrentAudioPath(buildRecordingPath());
      setIsRecording(true);
    } catch (error) {
      console.error('开始录音失败:', error);
      stopStreamTracks(mediaStreamRef.current);
      resetRecordingState();
      Alert.alert('错误', '开始录音失败');
    }
  }, [buildRecordingPath, isRecording, resetRecordingState]);

  const handleStopRecording = useCallback(async (): Promise<string | null> => {
    const mediaRecorder = mediaRecorderRef.current;

    if (!isRecording || !currentAudioPath || !mediaRecorder) {
      return null;
    }

    try {
      const recordedPath = await new Promise<string | null>(resolve => {
        mediaRecorder.onstop = () => {
          const recordedBlob = new Blob(recordedChunksRef.current);
          const nextAudioPath =
            recordedBlob.size > 0
              ? browserGlobals.URL?.createObjectURL?.(recordedBlob) ?? null
              : null;

          stopStreamTracks(mediaStreamRef.current);
          resetRecordingState();
          resolve(nextAudioPath);
        };
        mediaRecorder.stop();
      });

      return recordedPath;
    } catch (error) {
      console.error('停止录音失败:', error);
      stopStreamTracks(mediaStreamRef.current);
      resetRecordingState();
      Alert.alert('错误', '停止录音失败');
      return null;
    }
  }, [currentAudioPath, isRecording, resetRecordingState]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (!isRecordingRef.current) {
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;

      if (mediaRecorder) {
        mediaRecorder.ondataavailable = null;
        mediaRecorder.onstop = null;

        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }

      stopStreamTracks(mediaStreamRef.current);
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
      recordedChunksRef.current = [];
    };
  }, []);

  return {
    currentAudioPath,
    handleStartRecording,
    handleStopRecording,
    isRecording,
  };
};
