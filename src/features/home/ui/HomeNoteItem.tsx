import React from 'react';
import {Image, Text, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../../app/theme/colors';
import type {Note} from '../../../entities/note/types';
import {homeScreenStyles} from './homeScreenStyles';

type HomeNoteItemProps = {
  note: Note;
  onLongPress: () => void;
  onPress: () => void;
  theme: ReturnType<typeof generateThemeColors>;
};

export const HomeNoteItem: React.FC<HomeNoteItemProps> = ({
  note,
  onLongPress,
  onPress,
  theme,
}) => {
  const firstImageMatch = note.content.match(/\[图片(\d+)\]/);
  const firstImageIndex = firstImageMatch
    ? parseInt(firstImageMatch[1], 10)
    : -1;
  const firstImage =
    firstImageIndex >= 0 && note.images ? note.images[firstImageIndex] : null;
  const displayContent = note.content.replace(/\[图片\d+\]/g, '').trim();

  return (
    <TouchableOpacity
      style={[homeScreenStyles.noteItem, {backgroundColor: theme.surface}]}
      onPress={onPress}
      onLongPress={onLongPress}>
      <Text style={[homeScreenStyles.noteTitle, {color: theme.primaryDark}]}>
        {note.title}
      </Text>
      {firstImage && (
        <Image
          source={{uri: firstImage}}
          style={homeScreenStyles.notePreviewImage}
          resizeMode="cover"
        />
      )}
      <Text
        style={[homeScreenStyles.noteContent, {color: theme.text}]}
        numberOfLines={2}>
        {displayContent}
      </Text>
      <Text style={[homeScreenStyles.noteTime, {color: theme.accent}]}>
        {note.timestamp.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}
      </Text>
    </TouchableOpacity>
  );
};
