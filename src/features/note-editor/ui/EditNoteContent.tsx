import React from 'react';
import {Image, Text, TextInput, TouchableOpacity, View} from 'react-native';
import type {StyleProp, TextStyle} from 'react-native';
import {getTextSegmentsContent, hasSyncedTextSegments} from '../model/noteEditorTextSegments';
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
  onTextSegmentsChange?: (segments: EditableTextSegment[]) => void;
  textSegments: EditableTextSegment[];
  theme: NoteEditorTheme;
};

type TextToken = {
  type: 'text';
  segmentIndex: number;
  segmentTextEnd: number;
  segmentTextStart: number;
  text: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  color: string;
};

type MarkerToken =
  | {type: 'image'; imageIndex: number; marker: string}
  | {type: 'audio'; audioIndex: number; marker: string};

type ContentToken = TextToken | MarkerToken;

const markerPattern = /(\[图片\d+\]|\[音频\d+\])/g;

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
}): StyleProp<TextStyle> => {
  const fontWeight: TextStyle['fontWeight'] = isBold ? 'bold' : 'normal';
  const fontStyle: TextStyle['fontStyle'] = isItalic ? 'italic' : 'normal';

  return [
    styles.textContent,
    {
      fontSize,
      fontWeight,
      fontStyle,
      color: textColor,
      padding: 8,
      margin: 0,
      textAlignVertical: 'top' as const,
    },
  ];
};

const buildContentTokens = ({
  defaultFontSize,
  defaultIsBold,
  defaultIsItalic,
  defaultTextColor,
  segments,
}: {
  defaultFontSize: number;
  defaultIsBold: boolean;
  defaultIsItalic: boolean;
  defaultTextColor: string;
  segments: EditableTextSegment[];
}): ContentToken[] => {
  return segments.flatMap<ContentToken>((segment, segmentIndex) => {
    let segmentOffset = 0;

    return segment.text.split(markerPattern).flatMap<ContentToken>(part => {
      if (!part) {
        return [];
      }

      const segmentTextStart = segmentOffset;
      const segmentTextEnd = segmentTextStart + part.length;
      segmentOffset = segmentTextEnd;

      const imageMatch = part.match(/^\[图片(\d+)\]$/);
      if (imageMatch) {
        return [
          {
            type: 'image' as const,
            imageIndex: parseInt(imageMatch[1], 10),
            marker: part,
          },
        ];
      }

      const audioMatch = part.match(/^\[音频(\d+)\]$/);
      if (audioMatch) {
        return [
          {
            type: 'audio' as const,
            audioIndex: parseInt(audioMatch[1], 10),
            marker: part,
          },
        ];
      }

      return [
        {
          type: 'text' as const,
          segmentIndex,
          segmentTextStart,
          segmentTextEnd,
          text: part,
          fontSize: segment.fontSize ?? defaultFontSize,
          isBold: segment.isBold ?? defaultIsBold,
          isItalic: segment.isItalic ?? defaultIsItalic,
          color: segment.color ?? defaultTextColor,
        },
      ];
    });
  });
};

const getTokenLength = (token: ContentToken): number => {
  return token.type === 'text' ? token.text.length : token.marker.length;
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
  onTextSegmentsChange,
  textSegments,
  theme,
}) => {
  const resolvedTextSegments =
    hasSyncedTextSegments(textSegments, content)
      ? textSegments
      : [
          {
            text: content,
            fontSize,
            isBold,
            isItalic,
            color: theme.text,
          },
        ];
  const tokens = buildContentTokens({
    defaultFontSize: fontSize,
    defaultIsBold: isBold,
    defaultIsItalic: isItalic,
    defaultTextColor: theme.text,
    segments: resolvedTextSegments,
  });

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
      {tokens.map((token, index) => {
        if (token.type === 'image') {
          if (!images[token.imageIndex]) {
            return null;
          }

          return (
            <View
              key={`image-${token.imageIndex}-${index}`}
              style={styles.imageContainer}>
              <Image
                source={{uri: images[token.imageIndex]}}
                style={styles.noteImage}
                resizeMode="contain"
                onError={error => {
                  console.log('图片加载错误:', error.nativeEvent.error);
                  console.log('图片URL:', images[token.imageIndex]);
                }}
              />
              <TouchableOpacity
                style={styles.deleteImageButton}
                onPress={() => onDeleteImage(token.imageIndex)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Text style={styles.deleteImageText}>×</Text>
              </TouchableOpacity>
            </View>
          );
        }

        if (token.type === 'audio') {
          if (!audios[token.audioIndex]) {
            return null;
          }

          return (
            <View
              key={`audio-${token.audioIndex}-${index}`}
              style={styles.audioContainer}>
              <TouchableOpacity
                style={[styles.playButton, {backgroundColor: theme.primary}]}
                onPress={() => onPlayAudio(token.audioIndex)}>
                <Text style={[styles.playButtonText, {color: theme.surface}]}>
                  {isPlaying && currentAudioIndex === token.audioIndex
                    ? '暂停'
                    : '播放'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteAudioButton, {backgroundColor: theme.error}]}
                onPress={() => onDeleteAudio(token.audioIndex)}>
                <Text style={styles.deleteAudioText}>×</Text>
              </TouchableOpacity>
            </View>
          );
        }

        return (
          <TextInput
            key={`text-${index}`}
            style={createTextInputStyle({
              fontSize: token.fontSize,
              isBold: token.isBold,
              isItalic: token.isItalic,
              textColor: token.color,
            })}
            value={token.text}
            onChangeText={text => {
              const nextTextSegments = [...resolvedTextSegments];
              const currentSegment = nextTextSegments[token.segmentIndex];

              nextTextSegments[token.segmentIndex] = {
                ...currentSegment,
                text:
                  currentSegment.text.slice(0, token.segmentTextStart) +
                  text +
                  currentSegment.text.slice(token.segmentTextEnd),
              };

              onContentChange(
                getTextSegmentsContent(nextTextSegments),
              );
              onTextSegmentsChange?.(nextTextSegments);
            }}
            onSelectionChange={event => {
              const {selection} = event.nativeEvent;
              const position =
                selection.start +
                tokens
                  .slice(0, index)
                  .reduce(
                    (total, currentToken) => total + getTokenLength(currentToken),
                    0,
                  );

              onSelectionChange(selection, position);
            }}
            multiline
          />
        );
      })}
    </View>
  );
};
