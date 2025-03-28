import React, { useState, useEffect } from 'react';
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
  onChangeImages?: (images: string[]) => void;
  theme: ReturnType<typeof generateThemeColors>;
}

const EditNotePage: React.FC<EditNotePageProps> = ({
  isEditing,
  note,
  onSave,
  onClose,
  onChangeTitle,
  onChangeContent,
  onChangeImages,
  visible,
  theme,
}) => {
  const [fontSize, setFontSize] = useState(16);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [images, setImages] = useState<string[]>(note.images || []);
  const [content, setContent] = useState(note.content);
  const [showImageModal, setShowImageModal] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // 当note改变时更新状态
  useEffect(() => {
    setImages(note.images || []);
    setContent(note.content);
  }, [note]);

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
        const newImages = [...images, newImage];
        setImages(newImages);
        onChangeImages?.(newImages);
        // 在光标位置插入图片
        const newContent = content.slice(0, cursorPosition) + `\n[图片${newImages.length - 1}]\n` + content.slice(cursorPosition);
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
        const newImages = [...images, newImage];
        setImages(newImages);
        onChangeImages?.(newImages);
        // 在光标位置插入图片
        const newContent = content.slice(0, cursorPosition) + `\n[图片${newImages.length - 1}]\n` + content.slice(cursorPosition);
        setContent(newContent);
        onChangeContent(newContent);
      }
    });
  };

  const handleDeleteImage = (imageIndex: number) => {
    const newImages = images.filter((_, i) => i !== imageIndex);
    setImages(newImages);
    onChangeImages?.(newImages);
    
    // 更新内容中的图片标记
    let newContent = content;
    const imagePattern = new RegExp(`\\[图片${imageIndex}\\]`, 'g');
    newContent = newContent.replace(imagePattern, '');
    
    // 重新编号剩余的图片标记
    for (let i = imageIndex + 1; i < images.length; i++) {
      const oldPattern = new RegExp(`\\[图片${i}\\]`, 'g');
      newContent = newContent.replace(oldPattern, `[图片${i - 1}]`);
    }
    
    setContent(newContent);
    onChangeContent(newContent);
  };

  const renderContent = () => {
    const parts = content.split(/(\[图片\d+\])/);
    if (parts.length === 1 && !parts[0].trim()) {
      return (
        <TextInput
          style={[styles.textContent, {
            fontSize,
            fontWeight: isBold ? 'bold' : 'normal',
            fontStyle: isItalic ? 'italic' : 'normal',
            color: theme.textLight,
            padding: 0,
            margin: 0,
            flex: 1,
          }]}
          placeholder="开始记录你的想法..."
          placeholderTextColor={theme.textLight}
          value={content}
          onChangeText={(text) => {
            setContent(text);
            onChangeContent(text);
          }}
          onSelectionChange={(event) => {
            const { selection } = event.nativeEvent;
            setCursorPosition(selection.start);
          }}
          multiline
        />
      );
    }
    return parts.map((part, index) => {
      const imageMatch = part.match(/\[图片(\d+)\]/);
      if (imageMatch) {
        const imageIndex = parseInt(imageMatch[1]);
        if (images[imageIndex]) {
          return (
            <View key={index} style={styles.imageContainer}>
              <Image
                source={{ uri: images[imageIndex] }}
                style={styles.noteImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={[styles.deleteImageButton, { zIndex: 3 }]}
                onPress={() => handleDeleteImage(imageIndex)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.deleteImageText}>×</Text>
              </TouchableOpacity>
            </View>
          );
        }
      }
      return (
        <TextInput
          key={index}
          style={[styles.textContent, {
            fontSize,
            fontWeight: isBold ? 'bold' : 'normal',
            fontStyle: isItalic ? 'italic' : 'normal',
            color: theme.text,
            padding: 0,
            margin: 0,
            flex: 1,
          }]}
          value={part}
          onChangeText={(text) => {
            const newParts = [...parts];
            newParts[index] = text;
            const newContent = newParts.join('');
            setContent(newContent);
            onChangeContent(newContent);
          }}
          onSelectionChange={(event) => {
            const { selection } = event.nativeEvent;
            setCursorPosition(selection.start);
          }}
          multiline
        />
      );
    });
  };

  const showImageOptions = () => {
    setShowImageModal(true);
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
                  <View style={styles.contentWrapper}>
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

      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowImageModal(false)}
        >
          <View style={[styles.imageOptionsModal, { backgroundColor: theme.surface }]}>
            <View style={[styles.imageOptionsHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.imageOptionsTitle, { color: theme.text }]}>添加图片</Text>
              <TouchableOpacity 
                style={styles.closeModalButton}
                onPress={() => setShowImageModal(false)}
              >
                <Text style={[styles.closeModalText, { color: theme.text }]}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.imageOptionsContent}>
              <TouchableOpacity 
                style={[styles.imageOptionButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  setShowImageModal(false);
                  handleImagePicker();
                }}
              >
                <View style={[styles.imageOptionIcon, { backgroundColor: theme.surface }]}>
                  <View style={[styles.galleryIcon, { backgroundColor: theme.primary }]}>
                    <View style={[styles.galleryIconInner, { backgroundColor: theme.primary }]} />
                    <View style={[styles.galleryIconInner, { backgroundColor: theme.primary }]} />
                  </View>
                </View>
                <Text style={[styles.imageOptionText, { color: theme.surface }]}>从相册选择</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.imageOptionButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  setShowImageModal(false);
                  handleCamera();
                }}
              >
                <View style={[styles.imageOptionIcon, { backgroundColor: theme.surface }]}>
                  <View style={[styles.cameraIcon, { borderColor: theme.primary }]}>
                    <View style={[styles.cameraLensIcon, { backgroundColor: theme.primary }]} />
                    <View style={[styles.cameraFlashIcon, { backgroundColor: theme.primary }]} />
                  </View>
                </View>
                <Text style={[styles.imageOptionText, { color: theme.surface }]}>拍照</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    minHeight: 570,
    flex: 1,
  },
  contentWrapper: {
    padding: 16,
    flex: 1,
  },
  textContent: {
    fontSize: 16,
    padding: 0,
    margin: 0,
    textAlignVertical: 'top',
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    marginVertical: 8,
    zIndex: 2,
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
    zIndex: 3,
  },
  deleteImageText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOptionsModal: {
    width: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  imageOptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  imageOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeModalButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  imageOptionsContent: {
    padding: 16,
    gap: 12,
  },
  imageOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  imageOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  imageOptionIconText: {
    fontSize: 24,
  },
  imageOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  galleryIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  galleryIconInner: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  cameraIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    position: 'relative',
  },
  cameraLensIcon: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -4 }, { translateY: -4 }],
  },
  cameraFlashIcon: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    top: 2,
    right: 2,
  },
});

export default EditNotePage; 