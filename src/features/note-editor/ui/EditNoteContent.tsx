import React from 'react';
import {Image, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {styles} from './styles';
import type {
  EditableTextSegment,
  EditorSelection,
  NoteEditorTheme,
} from './types';

type EditNoteContentProps = {
  audios: string[];
  content: string;
  currentAudioIndex: number;
  fontSize: number;
  images: string[];
  isBold: boolean;
  isItalic: boolean;
  isPlaying: boolean;
  onContentChange: (content: string) => void;
  onDeleteAudio: (audioIndex: number) => void;
  onDeleteImage: (imageIndex: number) => void;
  onPlayAudio: (audioIndex: number) => void;
  onSelectionChange: (
    selection: EditorSelection,
    cursorPosition: number,
  ) => void;
  textSegments: EditableTextSegment[];
  theme: NoteEditorTheme;
};

const createTextInputStyle = ({
  fontSize,
  isBold,
  isItalic,
  textColor,
}: {
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  textColor: string;
}) => {
  return [
    styles.textContent,
    {
      fontSize,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      color: textColor,
      padding: 8,
      margin: 0,
      textAlignVertical: 'top' as const,
    },
  ];
};

export const EditNoteContent: React.FC<EditNoteContentProps> = ({
  audios,
  content,
  currentAudioIndex,
  fontSize,
  images,
  isBold,
  isItalic,
  isPlaying,
  onContentChange,
  onDeleteAudio,
  onDeleteImage,
  onPlayAudio,
  onSelectionChange,
  textSegments,
  theme,
}) => {
  const parts = content.split(/(\[图片\d+\]|\[音频\d+\])/g);

  if (content.trim() === '' && images.length === 0 && audios.length === 0) {
    return (
      <View style={styles.contentWrapper}>
        <TextInput
          style={createTextInputStyle({
            fontSize,
            isBold,
            isItalic,
            textColor: theme.text,
          })}
          placeholder="点击此处开始编辑笔记..."
          placeholderTextColor={theme.textLight}
          onChangeText={onContentChange}
          onSelectionChange={event => {
            onSelectionChange(event.nativeEvent.selection, event.nativeEvent.selection.start);
          }}
          multiline
        />
      </View>
    );
  }

  return (
    <View style={styles.contentWrapper}>
      {parts.map((part, index) => {
        const imageMatch = part.match(/\[图片(\d+)\]/);
        const audioMatch = part.match(/\[音频(\d+)\]/);

        if (imageMatch) {
          const imageIndex = parseInt(imageMatch[1], 10);

          if (!images[imageIndex]) {
            return null;
          }

          return (
            <View key={`image-${imageIndex}-${index}`} style={styles.imageContainer}>
              <Image
                source={{uri: images[imageIndex]}}
                style={[styles.noteImage, {backgroundColor: '#f0f0f0'}]}
                resizeMode="contain"
                onError={error => {
                  console.log('图片加载错误:', error.nativeEvent.error);
                  console.log('图片URL:', images[imageIndex]);
                }}
              />
              <TouchableOpacity
                style={[styles.deleteImageButton, {zIndex: 3}]}
                onPress={() => onDeleteImage(imageIndex)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Text style={styles.deleteImageText}>×</Text>
              </TouchableOpacity>
            </View>
          );
        }

        if (audioMatch) {
          const audioIndex = parseInt(audioMatch[1], 10);

          if (!audios[audioIndex]) {
            return null;
          }

          return (
            <View key={`audio-${audioIndex}-${index}`} style={styles.audioContainer}>
              <TouchableOpacity
                style={[styles.playButton, {backgroundColor: theme.primary}]}
                onPress={() => onPlayAudio(audioIndex)}>
                <Text style={[styles.playButtonText, {color: theme.surface}]}>
                  {isPlaying && currentAudioIndex === audioIndex ? '暂停' : '播放'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteAudioButton, {backgroundColor: theme.error}]}
                onPress={() => onDeleteAudio(audioIndex)}>
                <Text style={styles.deleteAudioText}>×</Text>
              </TouchableOpacity>
            </View>
          );
        }

        const segment = textSegments.find(item => item.text === part);

        return (
          <TextInput
            key={`text-${index}`}
            style={createTextInputStyle({
              fontSize: segment?.fontSize || fontSize,
              isBold: segment?.isBold || false,
              isItalic,
              textColor: theme.text,
            })}
            value={part}
            onChangeText={text => {
              const newParts = [...parts];
              newParts[index] = text;
              onContentChange(newParts.join(''));
            }}
            onSelectionChange={event => {
              const {selection} = event.nativeEvent;
              let position = selection.start;

              for (let cursorIndex = 0; cursorIndex < index; cursorIndex += 1) {
                position += parts[cursorIndex].length;
              }

              onSelectionChange(selection, position);
            }}
            multiline
          />
        );
      })}
    </View>
  );
};
