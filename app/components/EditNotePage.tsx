import React, { useState, useEffect, useCallback } from 'react';
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
import RNFetchBlob from 'react-native-blob-util';

interface EditNotePageProps {
  visible: boolean;
  isEditing: boolean;
  note: {
    id?: string;
    title: string;
    content: string;
    images?: string[];
    fontSize?: number;
    textSegments?: { text: string; fontSize: number }[];
  };
  onSave: () => void;
  onClose: () => void;
  onChangeTitle: (text: string) => void;
  onChangeContent: (text: string) => void;
  onChangeImages?: (images: string[]) => void;
  onChangeFontSize?: (size: number) => void;
  onChangeTextSegments?: (segments: { text: string; fontSize: number }[]) => void;
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
  onChangeFontSize,
  onChangeTextSegments: _onChangeTextSegments,
  visible,
  theme,
}) => {
  const [fontSize, setFontSize] = useState(note.fontSize || 16);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [images, setImages] = useState<string[]>(note.images || []);
  const [content, setContent] = useState(note.content);
  const [showImageModal, setShowImageModal] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // 当note改变时更新状态
  useEffect(() => {
    if (note.images) {
      setImages(note.images);
    }
    setContent(note.content);
    setFontSize(note.fontSize || 16);
  }, [note.content, note.images, note.fontSize]);

  const syncImagesAndContent = useCallback(() => {
    console.log("Current images:", images);
    // 从内容中提取所有图片标记
    const imageMarkers = content.match(/\[图片\d+\]/g) || [];
    console.log("Found image markers:", imageMarkers);
    
    // 检查是否有引用了不存在的图片的标记
    const invalidMarkers = imageMarkers.filter(marker => {
      const index = parseInt(marker.match(/\d+/)?.[0] || '0');
      const isValid = !images[index];
      return isValid;
    });

    // 如果有无效标记，从内容中移除它们
    if (invalidMarkers.length > 0) {
      console.log("Removing invalid markers:", invalidMarkers);
      let newContent = content;
      invalidMarkers.forEach(marker => {
        newContent = newContent.replace(marker, '');
      });
      setContent(newContent.trim());
    }
  }, [content, images, setContent]);

  // 在组件挂载和内容变化时同步图片数组和内容
  useEffect(() => {
    syncImagesAndContent();
  }, [syncImagesAndContent]);

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    onChangeFontSize?.(newSize);
  };

  const getImagePath = useCallback((imageIndex: number): string => {
    return `${RNFetchBlob.fs.dirs.DocumentDir}/images/${note.id}_${imageIndex}.jpg`;
  }, [note.id]);

  const saveImageToLocal = async (imageUri: string, imageIndex: number): Promise<string> => {
    try {
      const imagePath = getImagePath(imageIndex);
      
      // 确保目录存在，如果已存在则忽略错误
      const dir = `${RNFetchBlob.fs.dirs.DocumentDir}/images`;
      try {
        await RNFetchBlob.fs.mkdir(dir);
      } catch (error: any) {
        // 如果文件夹已存在，忽略错误
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
      
      // 复制图片到本地存储
      await RNFetchBlob.fs.cp(imageUri, imagePath);
      
      return Platform.OS === 'android' ? `file://${imagePath}` : imagePath;
    } catch (error) {
      console.error('保存图片到本地失败:', error);
      throw error;
    }
  };

  const loadImageFromLocal = useCallback(async (imageIndex: number): Promise<string | null> => {
    try {
      const imagePath = getImagePath(imageIndex);
      console.log("尝试加载图片:", imagePath);
      
      // 检查文件是否存在
      const exists = await RNFetchBlob.fs.exists(imagePath);
      console.log("图片是否存在:", exists);
      
      if (!exists) {
        console.log('图片不存在:', imagePath);
        return null;
      }
      
      const finalPath = Platform.OS === 'android' ? `file://${imagePath}` : imagePath;
      console.log("最终图片路径:", finalPath);
      return finalPath;
    } catch (error) {
      console.error('从本地加载图片失败:', error);
      return null;
    }
  }, [getImagePath]);

  // 在组件挂载时加载本地图片
  useEffect(() => {
    const loadLocalImages = async () => {
      console.log("开始加载本地图片");
      console.log("当前笔记ID:", note.id);
      console.log("当前图片数组:", note.images);
      
      // 如果note.images为空，尝试从本地加载所有可能的图片
      if (!note.images || note.images.length === 0) {
        console.log("尝试从本地加载所有可能的图片");
        let index = 0;
        const loadedImages: string[] = [];
        
        while (true) {
          const imagePath = getImagePath(index);
          const exists = await RNFetchBlob.fs.exists(imagePath);
          if (!exists) {
            break;
          }
          
          const finalPath = Platform.OS === 'android' ? `file://${imagePath}` : imagePath;
          loadedImages.push(finalPath);
          index++;
        }
        
        if (loadedImages.length > 0) {
          console.log("找到本地图片:", loadedImages);
          setImages(loadedImages);
          if (onChangeImages) {
            onChangeImages(loadedImages);
          }
        } else {
          console.log("未找到本地图片");
          setImages([]);
        }
      } else {
        console.log("有图片需要加载");
        const loadedImages = await Promise.all(
          note.images.map(async (imagePath, index) => {
            try {
              console.log(`加载图片 ${index}, 路径:`, imagePath);
              // 如果图片路径已经是本地路径，直接使用
              if (imagePath.startsWith('file://')) {
                console.log("使用已有的本地路径");
                // 检查文件是否存在
                const exists = await RNFetchBlob.fs.exists(imagePath.replace('file://', ''));
                if (!exists) {
                  console.log("本地文件不存在，尝试重新加载");
                  const localPath = await loadImageFromLocal(index);
                  return localPath;
                }
                return imagePath;
              }
              // 否则尝试从本地加载
              const localPath = await loadImageFromLocal(index);
              console.log("从本地加载的路径:", localPath);
              return localPath;
            } catch (error) {
              console.error(`加载图片 ${index} 失败:`, error);
              return null;
            }
          })
        );
        console.log("加载后的图片数组:", loadedImages);
        const validImages = loadedImages.filter((img): img is string => img !== null);
        console.log("有效的图片数组:", validImages);
        setImages(validImages);
      }
    };
    
    loadLocalImages();
  }, [note.images, loadImageFromLocal, note.id, getImagePath, onChangeImages]);

  const handleImagePicker = () => {
    console.log("开始选择图片");
    ImagePicker.launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    }, async (response) => {
      console.log("图片选择响应:", response);
      if (response.didCancel) {
        console.log("用户取消选择图片");
        return;
      }
      if (response.errorCode) {
        console.log("选择图片错误:", response.errorCode);
        Alert.alert('错误', '选择图片时发生错误');
        return;
      }
      if (response.assets && response.assets[0].uri) {
        try {
          const newImage = response.assets[0].uri;
          console.log("新图片路径:", newImage);
          
          // 保存图片到本地
          const savedImagePath = await saveImageToLocal(newImage, images.length);
          console.log("保存后的图片路径:", savedImagePath);
          
          const newImages = [...images, savedImagePath];
          console.log("更新后的图片数组:", newImages);
          setImages(newImages);
          
          // 立即更新父组件的状态，保存完整的图片路径
          if (onChangeImages) {
            console.log("调用onChangeImages更新图片数组");
            onChangeImages(newImages);
          } else {
            console.log("onChangeImages未定义");
          }
          
          const newContent = content.slice(0, cursorPosition) + `[图片${newImages.length - 1}]` + content.slice(cursorPosition);
          console.log("更新后的内容:", newContent);
          setContent(newContent);
          onChangeContent(newContent);
        } catch (error) {
          console.error('处理图片失败:', error);
          Alert.alert('错误', '保存图片时发生错误');
        }
      }
    });
  };

  const handleCamera = () => {
    ImagePicker.launchCamera({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    }, async (response) => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Alert.alert('错误', '拍照时发生错误');
        return;
      }
      if (response.assets && response.assets[0].uri) {
        try {
          const newImage = response.assets[0].uri;
          
          // 保存图片到本地
          const savedImagePath = await saveImageToLocal(newImage, images.length);
          
          const newImages = [...images, savedImagePath];
          setImages(newImages);
          onChangeImages?.(newImages);
          console.log("图片",newImages);
          
          // 在光标位置插入图片标记
          const newContent = content.slice(0, cursorPosition) + `[图片${newImages.length - 1}]` + content.slice(cursorPosition);
          setContent(newContent);
          onChangeContent(newContent);
        } catch (error) {
          console.error('处理图片失败:', error);
          Alert.alert('错误', '保存图片时发生错误');
        }
      }
    });
  };

  const handleDeleteImage = async (imageIndex: number) => {
    try {
      // 删除本地图片文件
      const imagePath = getImagePath(imageIndex);
      console.log("尝试删除图片，路径:", imagePath);
      
      // 检查文件是否存在
      const exists = await RNFetchBlob.fs.exists(imagePath);
      if (!exists) {
        console.log("图片文件不存在，跳过删除");
      } else {
        console.log("图片文件存在，开始删除");
        await RNFetchBlob.fs.unlink(imagePath);
        console.log("图片删除成功");
      }
      
      // 更新图片数组
      const newImages = images.filter((_, i) => i !== imageIndex);
      setImages(newImages);
      
      // 更新父组件的状态
      if (onChangeImages) {
        onChangeImages(newImages);
      }
      
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
    } catch (error) {
      console.error('删除图片失败:', error);
      Alert.alert('错误', '删除图片时发生错误');
    }
  };

  const renderContent = () => {
    const parts = content.split(/(\[图片\d+\])/g);
    console.log("渲染内容 - 图片数组:", images);
    console.log("渲染内容 - 当前内容:", content);
    console.log("渲染内容 - 分割后的部分:", parts);

    return (
      <View style={styles.contentWrapper}>
        {parts.map((part, index) => {
          const imageMatch = part.match(/\[图片(\d+)\]/);
          if (imageMatch) {
            const imageIndex = parseInt(imageMatch[1]);
            console.log("渲染图片 - 找到图片标记，索引:", imageIndex);
            console.log("渲染图片 - 对应的图片路径:", images[imageIndex]);
            if (images[imageIndex]) {
              return (
                <View key={index} style={styles.imageContainer}>
                  <Image
                    source={{ uri: images[imageIndex] }}
                    style={[styles.noteImage, { backgroundColor: '#f0f0f0' }]}
                    resizeMode="contain"
                    onError={(error) => console.log("图片加载错误:", error.nativeEvent.error)}
                    onLoad={() => console.log("图片加载成功:", images[imageIndex])}
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
            } else {
              console.log("渲染图片 - 图片不存在，索引:", imageIndex);
              return (
                <View key={index} style={[styles.imageContainer, styles.imagePlaceholder]}>
                  <Text style={styles.imagePlaceholderText}>图片不存在</Text>
                </View>
              );
            }
          }
          return (
            <TextInput
              key={index}
              style={[styles.textContent, {
                fontSize: fontSize,
                fontWeight: isBold ? 'bold' : 'normal',
                fontStyle: isItalic ? 'italic' : 'normal',
                color: theme.text,
                padding: 8,
                margin: 0,
                textAlignVertical: 'top',
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
                const { selection: sel } = event.nativeEvent;
                let position = sel.start;
                for (let i = 0; i < index; i++) {
                  position += parts[i].length;
                }
                setCursorPosition(position);
              }}
              multiline
            />
          );
        })}
      </View>
    );
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
                  {renderContent()}
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
                    onPress={() => handleFontSizeChange(fontSize + 2)}
                  >
                    <Text style={[styles.toolbarButtonText, { color: theme.text }]}>𝐀+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.toolbarButton}
                    onPress={() => handleFontSizeChange(fontSize - 2)}
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
    padding: 8,
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
  imagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
  },
  imagePlaceholderText: {
    color: '#999',
    fontSize: 14,
  },
});

export default EditNotePage; 