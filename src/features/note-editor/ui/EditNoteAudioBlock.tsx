import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {styles} from './styles';
import type {NoteEditorTheme} from './types';

type EditNoteAudioBlockProps = {
  audioIndex: number;
  isActive: boolean;
  onDelete: (audioIndex: number) => void;
  onPlay: (audioIndex: number) => void;
  theme: NoteEditorTheme;
};

export const EditNoteAudioBlock: React.FC<EditNoteAudioBlockProps> = ({
  audioIndex,
  isActive,
  onDelete,
  onPlay,
  theme,
}) => {
  return (
    <View style={styles.audioContainer}>
      <TouchableOpacity
        style={[styles.playButton, {backgroundColor: theme.primary}]}
        onPress={() => onPlay(audioIndex)}>
        <Text style={[styles.playButtonText, {color: theme.surface}]}>
          {isActive ? '暂停' : '播放'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.deleteAudioButton, {backgroundColor: theme.error}]}
        onPress={() => onDelete(audioIndex)}>
        <Text style={styles.deleteAudioText}>×</Text>
      </TouchableOpacity>
    </View>
  );
};
