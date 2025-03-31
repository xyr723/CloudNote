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
import ImagePicker from 'react-native-image-picker';
import { generateThemeColors } from '../theme/colors';

interface EditNotePageProps {
  visible: boolean;
  isEditing: boolean;
  note: {
    id?: string;
    title: string;
    content: string;
    images?: string[];
    fontSize?: number;
  };
  onSave: () => void;
  onClose: () => void;
  onChangeTitle: (text: string) => void;
  onChangeContent: (text: string) => void;
  onChangeImages: (images: string[]) => void;
  onChangeFontSize: (size: number) => void;
  theme: ReturnType<typeof generateThemeColors>;
}

const EditNotePage: React.FC<EditNotePageProps> = ({
  visible,
  isEditing,
  note,
  onSave,
  onClose,
  onChangeTitle,
  onChangeContent,
  onChangeImages,
  onChangeFontSize,
  theme,
}) => {
  const [content, setContent] = useState(note.content || '');
  const [images, setImages] = useState<string[]>(note.images || []);
  const [fontSize, setFontSize] = useState(note.fontSize || 16);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFontSizeModal, setShowFontSizeModal] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    setContent(note.content);
    setFontSize(note.fontSize || 16);
  }, [note]);

  const handleDeleteImage = (imageIndex: number) => {
    const newImages = images.filter((_, index) => index !== imageIndex);
    setImages(newImages);
    onChangeImages(newImages);
  };

  const handleImagePicker = (_source: 'camera' | 'gallery') => {
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
        onChangeImages(newImages);
        // 在光标位置插入图片
        const newContent = content.slice(0, cursorPosition) + `\n[图片${newImages.length - 1}]\n` + content.slice(cursorPosition);
        setContent(newContent);
        onChangeContent(newContent);
      }
    });
  };

  const renderContent = () => {
    return (
      <TextInput
        style={[styles.textContent, { 
          color: theme.text,
          fontSize: fontSize
        }]}
        multiline
        value={content}
        onChangeText={(text) => {
          setContent(text);
          onChangeContent(text);
        }}
        onSelectionChange={(event) => {
          setCursorPosition(event.nativeEvent.selection.start);
        }}
        placeholder="开始记录你的想法..."
        placeholderTextColor={theme.textLight}
      />
    );
  };

  const renderImages = () => {
    return images.map((image, index) => (
      <View key={index} style={styles.imageContainer}>
        <Image
          source={{ uri: image }}
          style={styles.image}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={[styles.deleteImageButton, { backgroundColor: theme.error }]}
          onPress={() => handleDeleteImage(index)}>
          <Text style={styles.deleteImageText}>×</Text>
        </TouchableOpacity>
      </View>
    ));
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
                    {renderImages()}
                  </View>
                </View>
              </ScrollView>

              <View style={[styles.toolbar, { 
                backgroundColor: theme.surface,
                borderColor: theme.border 
              }]}>
                <TouchableOpacity 
                  style={[styles.toolbarButton, { borderColor: theme.border }]}
                  onPress={() => setShowImageModal(true)}>
                  <Text style={[styles.toolbarButtonText, { color: theme.text }]}>添加图片</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toolbarButton, { borderColor: theme.border }]}
                  onPress={() => setShowFontSizeModal(true)}>
                  <Text style={[styles.toolbarButtonText, { color: theme.text }]}>调整字体</Text>
                </TouchableOpacity>
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
                style={[styles.imageOption, { borderColor: theme.border }]}
                onPress={() => {
                  setShowImageModal(false);
                  handleImagePicker('camera');
                }}>
                <Text style={[styles.imageOptionText, { color: theme.text }]}>拍照</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.imageOption, { borderColor: theme.border }]}
                onPress={() => {
                  setShowImageModal(false);
                  handleImagePicker('gallery');
                }}>
                <Text style={[styles.imageOptionText, { color: theme.text }]}>从相册选择</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showFontSizeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFontSizeModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowFontSizeModal(false)}
        >
          <View style={[styles.fontSizeModal, { backgroundColor: theme.surface }]}>
            <View style={[styles.fontSizeHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.fontSizeTitle, { color: theme.text }]}>调整字体大小</Text>
              <TouchableOpacity 
                style={styles.closeModalButton}
                onPress={() => setShowFontSizeModal(false)}
              >
                <Text style={[styles.closeModalText, { color: theme.text }]}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fontSizeContent}>
              <TouchableOpacity 
                style={[styles.fontSizeOption, { borderColor: theme.border }]}
                onPress={() => {
                  onChangeFontSize(16);
                  setShowFontSizeModal(false);
                }}>
                <Text style={[styles.fontSizeOptionText, { color: theme.text }]}>小</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.fontSizeOption, { borderColor: theme.border }]}
                onPress={() => {
                  onChangeFontSize(18);
                  setShowFontSizeModal(false);
                }}>
                <Text style={[styles.fontSizeOptionText, { color: theme.text }]}>中</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.fontSizeOption, { borderColor: theme.border }]}
                onPress={() => {
                  onChangeFontSize(20);
                  setShowFontSizeModal(false);
                }}>
                <Text style={[styles.fontSizeOptionText, { color: theme.text }]}>大</Text>
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
    padding: 8,
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
    padding: 8,
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
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    marginBottom: 16,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  contentWrapper: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderTopWidth: 1,
    marginTop: 16,
  },
  toolbarButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  toolbarButtonText: {
    fontSize: 14,
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
    padding: 8,
  },
  closeModalText: {
    fontSize: 24,
    fontWeight: '300',
  },
  imageOptionsContent: {
    padding: 16,
  },
  imageOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  imageOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  fontSizeModal: {
    width: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  fontSizeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  fontSizeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  fontSizeContent: {
    padding: 16,
  },
  fontSizeOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  fontSizeOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginVertical: 8,
    zIndex: 2,
  },
  image: {
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
  textContent: {
    fontSize: 16,
    padding: 0,
    margin: 0,
    textAlignVertical: 'top',
    flex: 1,
  },
});

export default EditNotePage; 