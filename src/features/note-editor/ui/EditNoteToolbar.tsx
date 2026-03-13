import React from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import {styles} from './styles';
import type {
  EditableTextSegment,
  EditorSelection,
  NoteEditorTheme,
} from './types';

type EditNoteToolbarProps = {
  isAiThinking: boolean;
  isBold: boolean;
  isItalic: boolean;
  isRecording: boolean;
  onAiComplete: () => Promise<void>;
  onBoldToggle: () => void;
  onDecreaseFontSize: () => void;
  onIncreaseFontSize: () => void;
  onRecordingToggle: () => void;
  onShowImageOptions: () => void;
  onToggleItalic: () => void;
  selection: EditorSelection;
  textSegments: EditableTextSegment[];
  theme: NoteEditorTheme;
};

export const EditNoteToolbar: React.FC<EditNoteToolbarProps> = ({
  isAiThinking,
  isBold,
  isItalic,
  isRecording,
  onAiComplete,
  onBoldToggle,
  onDecreaseFontSize,
  onIncreaseFontSize,
  onRecordingToggle,
  onShowImageOptions,
  onToggleItalic,
  selection,
  textSegments,
  theme,
}) => {
  const hasBoldSelection =
    isBold ||
    (selection.start !== selection.end &&
      textSegments.some(segment => segment.isBold));

  return (
    <View style={[styles.toolbar, {backgroundColor: theme.surface}]}>
      <View style={styles.toolbarRow}>
        <TouchableOpacity
          style={[
            styles.toolbarButton,
            hasBoldSelection && styles.toolbarButtonActive,
          ]}
          onPress={onBoldToggle}>
          <Text
            style={[
              styles.toolbarButtonText,
              {
                color: hasBoldSelection ? theme.primary : theme.text,
                fontWeight: 'bold',
              },
            ]}>
            𝐁
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toolbarButton,
            isItalic && styles.toolbarButtonActive,
          ]}
          onPress={onToggleItalic}>
          <Text
            style={[
              styles.toolbarButtonText,
              {color: isItalic ? theme.primary : theme.text},
            ]}>
            𝐼
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={onIncreaseFontSize}>
          <Text style={[styles.toolbarButtonText, {color: theme.text}]}>
            𝐀+
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={onDecreaseFontSize}>
          <Text style={[styles.toolbarButtonText, {color: theme.text}]}>
            𝐀-
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolbarButton, styles.cameraButton]}
          onPress={onShowImageOptions}>
          <View style={styles.cameraIconContainer}>
            <View
              style={[styles.cameraLens, {backgroundColor: theme.text}]}
            />
            <View
              style={[styles.cameraFlash, {backgroundColor: theme.text}]}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolbarButton, isRecording && styles.recordingButton]}
          onPress={onRecordingToggle}>
          <Text
            style={[
              styles.toolbarButtonText,
              {color: isRecording ? theme.error : theme.text},
            ]}>
            {isRecording ? '停止' : '🎙️'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => {
            void onAiComplete();
          }}
          disabled={isAiThinking}>
          {isAiThinking ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Text style={[styles.toolbarButtonText, {color: theme.text}]}>
              {'🤖️'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
