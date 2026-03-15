import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFetchBlob from 'react-native-blob-util';
import {useAudioRecordingSession} from './useAudioRecordingSession';

type RecordingSession = ReturnType<typeof useAudioRecordingSession>;
type RecorderInstance = {
  addRecordBackListener: jest.Mock;
  removeRecordBackListener: jest.Mock;
  startRecorder: jest.Mock;
  stopRecorder: jest.Mock;
};

const originalPlatformDescriptor = Object.getOwnPropertyDescriptor(
  Platform,
  'OS',
);

const setPlatformOs = (value: string) => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value,
  });
};

const getRecorderInstance = (): RecorderInstance => {
  const MockedAudioRecorderPlayer = AudioRecorderPlayer as unknown as jest.Mock;
  const latestCall =
    MockedAudioRecorderPlayer.mock.results[
      MockedAudioRecorderPlayer.mock.results.length - 1
    ];

  if (!latestCall) {
    throw new Error('未找到 AudioRecorderPlayer mock 实例');
  }

  return latestCall.value as RecorderInstance;
};

const renderRecordingSession = (overrides?: {
  audioCount?: number;
  noteId?: string;
  tempNoteId?: string;
}) => {
  let latestSession: RecordingSession | null = null;

  const Probe = () => {
    latestSession = useAudioRecordingSession({
      audioCount: overrides?.audioCount ?? 0,
      noteId: overrides?.noteId,
      tempNoteId: overrides?.tempNoteId ?? 'temp-note-id',
    });

    return null;
  };

  let renderer: ReactTestRenderer.ReactTestRenderer;

  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Probe />);
  });

  return {
    getSession: () => {
      if (!latestSession) {
        throw new Error('录音 session 尚未初始化');
      }

      return latestSession;
    },
    renderer: renderer!,
  };
};

describe('useAudioRecordingSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setPlatformOs('android');
  });

  afterAll(() => {
    if (originalPlatformDescriptor) {
      Object.defineProperty(Platform, 'OS', originalPlatformDescriptor);
    }
  });

  test('starts recording after permission is granted and prepares audio path', async () => {
    const permissionSpy = jest
      .spyOn(PermissionsAndroid, 'request')
      .mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    const existsMock = RNFetchBlob.fs.exists as jest.MockedFunction<
      typeof RNFetchBlob.fs.exists
    >;
    existsMock.mockResolvedValue(false);
    const mkdirMock = RNFetchBlob.fs.mkdir as jest.MockedFunction<
      typeof RNFetchBlob.fs.mkdir
    >;
    const {getSession} = renderRecordingSession({
      audioCount: 2,
      noteId: 'note-1',
    });

    await ReactTestRenderer.act(async () => {
      await getSession().handleStartRecording();
    });

    const recorder = getRecorderInstance();
    const audioPath = recorder.startRecorder.mock.calls[0][0] as string;

    expect(permissionSpy).toHaveBeenCalledTimes(1);
    expect(mkdirMock).toHaveBeenCalledWith('/tmp/audios');
    expect(audioPath).toMatch(/^\/tmp\/audios\/note-1_\d+_2\.mp3$/);
    expect(recorder.addRecordBackListener).toHaveBeenCalledTimes(1);
    expect(getSession().isRecording).toBe(true);
    expect(getSession().currentAudioPath).toBe(audioPath);
  });

  test('stops recording and clears current audio path', async () => {
    jest
      .spyOn(PermissionsAndroid, 'request')
      .mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    const existsMock = RNFetchBlob.fs.exists as jest.MockedFunction<
      typeof RNFetchBlob.fs.exists
    >;
    existsMock.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const {getSession} = renderRecordingSession({
      audioCount: 0,
      noteId: 'note-1',
    });

    await ReactTestRenderer.act(async () => {
      await getSession().handleStartRecording();
    });

    const startedPath = getSession().currentAudioPath;

    await ReactTestRenderer.act(async () => {
      await getSession().handleStopRecording();
    });

    const recorder = getRecorderInstance();

    expect(recorder.stopRecorder).toHaveBeenCalledTimes(1);
    expect(recorder.removeRecordBackListener).toHaveBeenCalledTimes(1);
    expect(startedPath).toMatch(/^\/tmp\/audios\/note-1_\d+_0\.mp3$/);
    expect(getSession().isRecording).toBe(false);
    expect(getSession().currentAudioPath).toBeNull();
  });

  test('does not start recording when permission is denied', async () => {
    const permissionSpy = jest
      .spyOn(PermissionsAndroid, 'request')
      .mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const {getSession} = renderRecordingSession({
      audioCount: 1,
      noteId: 'note-1',
    });

    try {
      await ReactTestRenderer.act(async () => {
        await getSession().handleStartRecording();
      });

      const recorder = getRecorderInstance();

      expect(permissionSpy).toHaveBeenCalledTimes(1);
      expect(recorder.startRecorder).not.toHaveBeenCalled();
      expect(getSession().isRecording).toBe(false);
      expect(getSession().currentAudioPath).toBeNull();
      expect(alertSpy).toHaveBeenCalledWith(
        '权限被拒绝',
        '需要录音权限才能使用录音功能',
      );
    } finally {
      alertSpy.mockRestore();
    }
  });
});
