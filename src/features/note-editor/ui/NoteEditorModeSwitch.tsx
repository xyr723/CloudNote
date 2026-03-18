import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {styles} from './styles';

export type NoteEditorMode = 'native' | 'h5' | 'preview';

const MODE_OPTIONS: Array<{label: string; mode: NoteEditorMode}> = [
  {
    label: '原生',
    mode: 'native',
  },
  {
    label: 'H5',
    mode: 'h5',
  },
  {
    label: '预览',
    mode: 'preview',
  },
];

type NoteEditorModeSwitchProps = {
  editorMode: NoteEditorMode;
  onChangeMode: (mode: NoteEditorMode) => void;
  theme: ReturnType<typeof generateThemeColors>;
};

export const NoteEditorModeSwitch: React.FC<NoteEditorModeSwitchProps> = ({
  editorMode,
  onChangeMode,
  theme,
}) => {
  return (
    <View
      style={[
        styles.modeSwitch,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      {MODE_OPTIONS.map(option => {
        const isActive = editorMode === option.mode;

        return (
          <TouchableOpacity
            key={option.mode}
            style={[
              styles.modeSwitchButton,
              isActive && {
                backgroundColor: theme.primary,
              },
            ]}
            onPress={() => onChangeMode(option.mode)}>
            <Text
              style={[
                styles.modeSwitchButtonText,
                {
                  color: isActive ? theme.surface : theme.text,
                },
              ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
