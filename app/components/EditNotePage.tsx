import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { generateThemeColors } from '../theme/colors';
import * as ImagePicker from 'react-native-image-picker';

interface EditNotePageProps {
  visible: boolean;
  isEditing: boolean;
  note: {
    id?: string;
    title: string;
    content: string;
    images?: string[];
  };
  onSave: () => void;
  onClose: () => void;
  onChangeTitle: (text: string) => void;
  onChangeContent: (text: string) => void;
  theme: ReturnType<typeof generateThemeColors>;
}

const EditNotePage: React.FC<EditNotePageProps> = ({
  isEditing,
  note,
  onSave,
  onClose,
  onChangeTitle,
  onChangeContent,
  visible,
  theme,
}) => {
  const [fontSize, setFontSize] = useState(16);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [images, setImages] = useState<string[]>(note.images || []);
  const [content, setContent] = useState(note.content);

  const handleImagePicker = () => {
    ImagePicker.launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
    }, (response) => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Alert.alert('错误', '选择图片时发生错误');
        return;
      }
      if (response.assets && response.assets[0].uri) {
        const newImage = response.assets[0].uri;
        setImages([...images, newImage]);
        // 在光标位置插入图片标记
        const cursorPosition = content.length;
        const newContent = content.slice(0, cursorPosition) + `[图片${images.length + 1}]` + content.slice(cursorPosition);
        setContent(newContent);
        onChangeContent(newContent);
      }
    });
  };

  const handleCamera = () => {
    ImagePicker.launchCamera({
      mediaType: 'photo',
      includeBase64: true,
    }, (response) => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Alert.alert('错误', '拍照时发生错误');
        return;
      }
      if (response.assets && response.assets[0].uri) {
        const newImage = response.assets[0].uri;
        setImages([...images, newImage]);
        // 在光标位置插入图片标记
        const cursorPosition = content.length;
        const newContent = content.slice(0, cursorPosition) + `[图片${images.length + 1}]` + content.slice(cursorPosition);
        setContent(newContent);
        onChangeContent(newContent);
      }
    });
  };

  const showImageOptions = () => {
    Alert.alert(
      '添加图片',
      '请选择图片来源',
      [
        {
          text: '从相册选择',
          onPress: handleImagePicker,
        },
        {
          text: '拍照',
          onPress: handleCamera,
        },
        {
          text: '取消',
          style: 'cancel',
        },
      ]
    );
  };

  const renderContent = () => {
    const parts = content.split(/(\[图片\d+\])/);
    return parts.map((part, index) => {
      const imageMatch = part.match(/\[图片(\d+)\]/);
      if (imageMatch) {
        const imageIndex = parseInt(imageMatch[1]) - 1;
        if (images[imageIndex]) {
          return (
            <View key={index} style={styles.imageContainer}>
              <Image
                source={{ uri: images[imageIndex] }}
                style={styles.noteImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.deleteImageButton}
                onPress={() => {
                  const newImages = images.filter((_, i) => i !== imageIndex);
                  setImages(newImages);
                  const newContent = content.replace(part, '');
                  setContent(newContent);
                  onChangeContent(newContent);
                }}
              >
                <Text style={styles.deleteImageText}>×</Text>
              </TouchableOpacity>
            </View>
          );
        }
      }
      return <Text key={index} style={[styles.textContent, {
        fontSize,
        fontWeight: isBold ? 'bold' : 'normal',
        fontStyle: isItalic ? 'italic' : 'normal',
        color: theme.text,
      }]}>{part}</Text>;
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={[styles.header, { backgroundColor: theme.primary }]}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={[styles.closeButtonText, { color: theme.surface }]}>取消</Text>
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.surface }]}>
                {isEditing ? '编辑笔记' : '新建笔记'}
              </Text>
              <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                <Text style={[styles.saveButtonText, { color: theme.surface }]}>保存</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <TextInput
                style={[styles.titleInput, { 
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.surface
                }]}
                placeholder="标题"
                placeholderTextColor={theme.textLight}
                value={note.title}
                onChangeText={onChangeTitle}
              />

              <ScrollView style={styles.contentScroll}>
                <View style={[styles.contentContainer, { 
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }]}>
                  <TextInput
                    style={[styles.contentInput, { 
                      color: theme.text,
                      fontSize,
                      fontWeight: isBold ? 'bold' : 'normal',
                      fontStyle: isItalic ? 'italic' : 'normal',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      opacity: 0,
                      zIndex: 1,
                    }]}
                    placeholder="开始输入内容..."
                    placeholderTextColor={theme.textLight}
                    value={content}
                    onChangeText={(text) => {
                      setContent(text);
                      onChangeContent(text);
                    }}
                    multiline
                  />
                  <View style={styles.contentDisplay}>
                    {renderContent()}
                  </View>
                </View>
              </ScrollView>

              <View style={[styles.toolbar, { backgroundColor: theme.surface }]}>
                <View style={styles.toolbarRow}>
                  <TouchableOpacity 
                    style={[styles.toolbarButton, isBold && styles.toolbarButtonActive]}
                    onPress={() => setIsBold(!isBold)}
                  >
                    <Text style={[styles.toolbarButtonText, { color: isBold ? theme.primary : theme.text }]}>𝐁</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.toolbarButton, isItalic && styles.toolbarButtonActive]}
                    onPress={() => setIsItalic(!isItalic)}
                  >
                    <Text style={[styles.toolbarButtonText, { color: isItalic ? theme.primary : theme.text }]}>𝐼</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.toolbarButton}
                    onPress={() => setFontSize(fontSize + 2)}
                  >
                    <Text style={[styles.toolbarButtonText, { color: theme.text }]}>𝐀+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.toolbarButton}
                    onPress={() => setFontSize(fontSize - 2)}
                  >
                    <Text style={[styles.toolbarButtonText, { color: theme.text }]}>𝐀-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.toolbarButton, styles.cameraButton]}
                    onPress={showImageOptions}
                  >
                    <View style={styles.cameraIconContainer}>
                      <View style={[styles.cameraLens, { backgroundColor: theme.text }]} />
                      <View style={[styles.cameraFlash, { backgroundColor: theme.text }]} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  contentScroll: {
    flex: 1,
    marginBottom: 16,
  },
  toolbar: {
    padding: 12,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  toolbarButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  toolbarButtonActive: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  toolbarButtonText: {
    fontSize: 20,
    fontWeight: '500',
  },
  cameraButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  cameraIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.3)',
    position: 'relative',
  },
  cameraLens: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -4 }, { translateY: -4 }],
  },
  cameraFlash: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    top: 2,
    right: 2,
  },
  contentContainer: {
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    padding: 16,
    textAlignVertical: 'top',
    minHeight: 200,
  },
  contentDisplay: {
    padding: 16,
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  imageContainer: {
    position: 'relative',
    marginVertical: 8,
  },
  noteImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  deleteImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteImageText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EditNotePage; 