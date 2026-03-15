import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Alert} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

type UseAudioPlaybackInput = {
  audios: string[];
};

export const useAudioPlayback = ({audios}: UseAudioPlaybackInput) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(-1);
  const audioRecorderPlayer = useMemo(() => new AudioRecorderPlayer(), []);
  const isPlayingRef = useRef(isPlaying);

  const resetPlaybackState = useCallback(() => {
    setIsPlaying(false);
    setCurrentAudioIndex(-1);
  }, []);

  const handlePlayAudio = useCallback(
    async (audioIndex: number): Promise<void> => {
      try {
        if (isPlaying && currentAudioIndex === audioIndex) {
          await audioRecorderPlayer.stopPlayer();
          resetPlaybackState();
          return;
        }

        if (isPlaying) {
          await audioRecorderPlayer.stopPlayer();
        }

        await audioRecorderPlayer.startPlayer(audios[audioIndex]);
        audioRecorderPlayer.addPlayBackListener(
          (event: {currentPosition: number; duration: number}) => {
            if (event.currentPosition === event.duration) {
              resetPlaybackState();
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
    [audioRecorderPlayer, audios, currentAudioIndex, isPlaying, resetPlaybackState],
  );

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (!isPlayingRef.current) {
        return;
      }

      audioRecorderPlayer.stopPlayer().catch(() => undefined);
    };
  }, [audioRecorderPlayer]);

  return {
    currentAudioIndex,
    handlePlayAudio,
    isPlaying,
  };
};
