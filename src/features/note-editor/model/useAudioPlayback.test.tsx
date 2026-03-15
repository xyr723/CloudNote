import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {useAudioPlayback} from './useAudioPlayback';

type AudioPlayback = ReturnType<typeof useAudioPlayback>;
type PlaybackListener = (event: {
  currentPosition: number;
  duration: number;
}) => void;
type RecorderInstance = {
  addPlayBackListener: jest.Mock;
  startPlayer: jest.Mock;
  stopPlayer: jest.Mock;
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

const renderAudioPlayback = (audios: string[]) => {
  let latestPlayback: AudioPlayback | null = null;

  const Probe = () => {
    latestPlayback = useAudioPlayback({audios});
    return null;
  };

  ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Probe />);
  });

  return {
    getPlayback: () => {
      if (!latestPlayback) {
        throw new Error('播放 hook 尚未初始化');
      }

      return latestPlayback;
    },
  };
};

describe('useAudioPlayback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('starts playback and tracks the active audio index', async () => {
    const {getPlayback} = renderAudioPlayback([
      'file:///audio-0.mp3',
      'file:///audio-1.mp3',
    ]);

    await ReactTestRenderer.act(async () => {
      await getPlayback().handlePlayAudio(1);
    });

    const recorder = getRecorderInstance();

    expect(recorder.startPlayer).toHaveBeenCalledWith('file:///audio-1.mp3');
    expect(recorder.addPlayBackListener).toHaveBeenCalledTimes(1);
    expect(getPlayback().isPlaying).toBe(true);
    expect(getPlayback().currentAudioIndex).toBe(1);
  });

  test('stops playback when toggling the same audio', async () => {
    const {getPlayback} = renderAudioPlayback(['file:///audio-0.mp3']);

    await ReactTestRenderer.act(async () => {
      await getPlayback().handlePlayAudio(0);
    });

    await ReactTestRenderer.act(async () => {
      await getPlayback().handlePlayAudio(0);
    });

    const recorder = getRecorderInstance();

    expect(recorder.startPlayer).toHaveBeenCalledTimes(1);
    expect(recorder.stopPlayer).toHaveBeenCalledTimes(1);
    expect(getPlayback().isPlaying).toBe(false);
    expect(getPlayback().currentAudioIndex).toBe(-1);
  });

  test('stops current playback before switching to another audio', async () => {
    const {getPlayback} = renderAudioPlayback([
      'file:///audio-0.mp3',
      'file:///audio-1.mp3',
    ]);

    await ReactTestRenderer.act(async () => {
      await getPlayback().handlePlayAudio(0);
    });

    await ReactTestRenderer.act(async () => {
      await getPlayback().handlePlayAudio(1);
    });

    const recorder = getRecorderInstance();

    expect(recorder.stopPlayer).toHaveBeenCalledTimes(1);
    expect(recorder.startPlayer).toHaveBeenNthCalledWith(1, 'file:///audio-0.mp3');
    expect(recorder.startPlayer).toHaveBeenNthCalledWith(2, 'file:///audio-1.mp3');
    expect(getPlayback().isPlaying).toBe(true);
    expect(getPlayback().currentAudioIndex).toBe(1);
  });

  test('clears playback state when playback listener reaches the end', async () => {
    const {getPlayback} = renderAudioPlayback(['file:///audio-0.mp3']);

    await ReactTestRenderer.act(async () => {
      await getPlayback().handlePlayAudio(0);
    });

    const recorder = getRecorderInstance();
    const listener = recorder.addPlayBackListener.mock.calls[0][0] as PlaybackListener;

    await ReactTestRenderer.act(async () => {
      listener({currentPosition: 1200, duration: 1200});
    });

    expect(getPlayback().isPlaying).toBe(false);
    expect(getPlayback().currentAudioIndex).toBe(-1);
  });
});
