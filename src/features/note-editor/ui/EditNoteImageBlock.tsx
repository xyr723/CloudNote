import React from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import {styles} from './styles';

type EditNoteImageBlockProps = {
  imageIndex: number;
  imageUri: string;
  onDelete: (imageIndex: number) => void;
};

export const EditNoteImageBlock: React.FC<EditNoteImageBlockProps> = ({
  imageIndex,
  imageUri,
  onDelete,
}) => {
  return (
    <View style={styles.imageContainer}>
      <Image
        source={{uri: imageUri}}
        style={styles.noteImage}
        resizeMode="contain"
        onError={error => {
          console.log('图片加载错误:', error.nativeEvent.error);
          console.log('图片URL:', imageUri);
        }}
      />
      <TouchableOpacity
        style={styles.deleteImageButton}
        onPress={() => onDelete(imageIndex)}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <Text style={styles.deleteImageText}>×</Text>
      </TouchableOpacity>
    </View>
  );
};
