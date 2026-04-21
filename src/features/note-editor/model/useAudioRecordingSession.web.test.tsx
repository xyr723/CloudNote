import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Alert} from 'react-native';
import {useAudioRecordingSession} from './useAudioRecordingSession.web';

type RecordingSession = ReturnType<typeof useAudioRecordingSession>;
type AudioConstraints = {
  audio: boolean;
};

type MockTrack = {
  stop: jest.Mock<void, []>;
};

type MockStream = {
  getTracks: jest.Mock<MockTrack[], []>;
};

class MockMediaRecorder {
  static instances: MockMediaRecorder[] = [];

  addEventListener = jest.fn((type: string, listener: (event?: unknown) => void) => {
    this.listeners.set(type, listener);
  });

  ondataavailable: null | ((event: {data: Blob}) => void) = null;

  onstop: null | (() => void) = null;

  removeEventListener = jest.fn((type: string, listener: (event?: unknown) => void) => {
    if (this.listeners.get(type) === listener) {
      this.listeners.delete(type);
    }
  });

  start = jest.fn(() => {
    this.state = 'recording';
  });

  state = 'inactive';

  stop = jest.fn(() => {
    this.state = 'inactive';
    const event = {
      data: new Blob(['web-audio']),
    };

    this.ondataavailable?.(event);
    this.listeners.get('dataavailable')?.(event);
    this.onstop?.();
    this.listeners.get('stop')?.();
  });

  private listeners = new Map<string, (event?: unknown) => void>();

  constructor(public stream: MockStream) {
    MockMediaRecorder.instances.push(this);
  }
}

const globalObject = globalThis as unknown as {
  MediaRecorder?: unknown;
  navigator?: {
    mediaDevices?: {
      getUserMedia: jest.Mock<Promise<MockStream>, [AudioConstraints]>;
    };
  };
};
const globalUrl = globalThis as unknown as {
  URL: {
    createObjectURL?: (blob: Blob) => string;
  };
};

const originalMediaRecorder = globalObject.MediaRecorder;
const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(
  globalObject,
  'navigator',
);
const originalCreateObjectUrl = globalUrl.URL.createObjectURL;

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

describe('useAudioRecordingSession.web', () => {
  let mockStream: MockStream;
  let mockTrack: MockTrack;
  let getUserMedia: jest.Mock<Promise<MockStream>, [AudioConstraints]>;

  beforeEach(() => {
    jest.clearAllMocks();
    MockMediaRecorder.instances = [];
    mockTrack = {
      stop: jest.fn(),
    };
    mockStream = {
      getTracks: jest.fn(() => [mockTrack]),
    };
    getUserMedia = jest.fn<Promise<MockStream>, [AudioConstraints]>(
      async () => mockStream,
    );

    Object.defineProperty(globalObject, 'navigator', {
      configurable: true,
      value: {
        mediaDevices: {
          getUserMedia,
        },
      },
    });
    globalObject.MediaRecorder =
      MockMediaRecorder as unknown;
    Object.defineProperty(globalUrl.URL, 'createObjectURL', {
      configurable: true,
      value: jest.fn(() => 'blob:recorded-audio'),
    });
  });

  afterAll(() => {
    globalObject.MediaRecorder = originalMediaRecorder;

    if (originalNavigatorDescriptor) {
      Object.defineProperty(globalObject, 'navigator', originalNavigatorDescriptor);
    }

    Object.defineProperty(globalUrl.URL, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectUrl,
    });
  });

  test('starts recording after browser media access is granted', async () => {
    const {getSession} = renderRecordingSession({
      audioCount: 2,
      noteId: 'note-1',
    });

    await ReactTestRenderer.act(async () => {
      await getSession().handleStartRecording();
    });

    const mediaRecorder = MockMediaRecorder.instances[0];

    expect(getUserMedia).toHaveBeenCalledWith({audio: true});
    expect(mediaRecorder.start).toHaveBeenCalledTimes(1);
    expect(getSession().isRecording).toBe(true);
    expect(getSession().currentAudioPath).toMatch(/^recording:note-1_\d+_2$/);
  });

  test('stops recording into a blob url and clears session state', async () => {
    const {getSession} = renderRecordingSession({
      audioCount: 0,
      noteId: 'note-1',
    });

    await ReactTestRenderer.act(async () => {
      await getSession().handleStartRecording();
    });

    let recordedPath: string | null = null;

    await ReactTestRenderer.act(async () => {
      recordedPath = await getSession().handleStopRecording();
    });

    const mediaRecorder = MockMediaRecorder.instances[0];

    expect(mediaRecorder.stop).toHaveBeenCalledTimes(1);
    expect(globalUrl.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(recordedPath).toBe('blob:recorded-audio');
    expect(mockTrack.stop).toHaveBeenCalledTimes(1);
    expect(getSession().isRecording).toBe(false);
    expect(getSession().currentAudioPath).toBeNull();
  });

  test('alerts and stays idle when the browser does not support recording', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    globalObject.MediaRecorder = undefined;
    const {getSession} = renderRecordingSession({
      audioCount: 1,
      noteId: 'note-1',
    });

    try {
      await ReactTestRenderer.act(async () => {
        await getSession().handleStartRecording();
      });

      expect(alertSpy).toHaveBeenCalledWith(
        '暂不支持',
        '当前浏览器暂不支持录音功能',
      );
      expect(getSession().isRecording).toBe(false);
      expect(getSession().currentAudioPath).toBeNull();
    } finally {
      alertSpy.mockRestore();
    }
  });
});
