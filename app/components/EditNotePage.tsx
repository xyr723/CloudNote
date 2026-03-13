import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import { generateThemeColors } from '../theme/colors';
import * as ImagePicker from 'react-native-image-picker';
import RNFetchBlob from 'react-native-blob-util';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { completeTextWithLLM } from '../utils/chatComplete';
import { providerRegistry } from '../../src/providers/providerRegistry';

interface EditNotePageProps {
  visible: boolean;
  isEditing: boolean;
  note: {
    id?: string;
    title: string;
    content: string;
    images?: string[];
    audios?: string[];
    fontSize?: number;
    textSegments?: { text: string; fontSize: number; isBold?: boolean }[];
  };
  onSave: () => Promise<void>;
  onClose: () => void;
  onChangeTitle: (text: string) => void;
  onChangeContent: (text: string) => void;
  onChangeImages?: (images: string[]) => void;
  onChangeAudios?: (audios: string[]) => void;
  onChangeFontSize?: (size: number) => void;
  onChangeTextSegments?: (segments: { text: string; fontSize: number; isBold?: boolean }[]) => void;
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
  onChangeAudios,
  onChangeFontSize,
  onChangeTextSegments: _onChangeTextSegments,
  visible,
  theme,
}) => {
  const [fontSize, setFontSize] = useState(note.fontSize || 16);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [images, setImages] = useState<string[]>(note.images || []);
  const [audios, setAudios] = useState<string[]>(note.audios || []);
  const [content, setContent] = useState(note.content);
  const [showImageModal, setShowImageModal] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(-1);
  const [currentAudioPath, setCurrentAudioPath] = useState<string | null>(null);
  const [tempNoteId] = useState(() => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showAiThinkingModal, setShowAiThinkingModal] = useState(false);
  const [isUserDelete, setIsUserDelete] = useState(false);
  const [textSegments, setTextSegments] = useState<{ text: string; fontSize: number; isBold?: boolean }[]>(
    note.textSegments || [{ text: note.content, fontSize: note.fontSize || 16, isBold: false }]
  );
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [showSaveErrorModal, setShowSaveErrorModal] = useState(false);

  const audioRecorderPlayer = useMemo(() => new AudioRecorderPlayer(), []);
  const attachmentProvider = useMemo(() => providerRegistry.getAttachmentProvider(), []);

  const storeAudioAttachment = useCallback(async (
    audioUri: string,
    noteId: string | undefined,
    audioIndex: number,
  ): Promise<string> => {
    const effectiveNoteId = noteId || tempNoteId;

    return attachmentProvider.saveAttachment({
      uri: audioUri,
      noteId: effectiveNoteId,
      kind: 'audio',
      index: audioIndex,
      preferredExtension: 'mp3',
    });
  }, [attachmentProvider, tempNoteId]);

  // const doChatComplete = useCallback(async);

  // 当note改变时更新状态
  useEffect(() => {
    setImages(note.images || []);
    setAudios(note.audios || []);
    setContent(note.content);
    setFontSize(note.fontSize || 16);
    setTextSegments(
      note.textSegments || [{ text: note.content, fontSize: note.fontSize || 16, isBold: false }]
    );
  }, [note.audios, note.content, note.fontSize, note.images, note.textSegments]);

  const syncImagesAndContent = useCallback(() => {
    console.log("Current images:", images);
    // 从内容中提取所有图片标记
    const imageMarkers = content.match(/\[图片\d+\]/g) || [];
    console.log("Found image markers:", imageMarkers);
    
    // 检查是否有引用了不存在的图片的标记
    const invalidMarkers = imageMarkers.filter(marker => {
      const index = parseInt(marker.match(/\d+/)?.[0] || '0');
      // 只有当索引超出数组范围时才视为无效
      return index >= images.length;
    });

    // 如果有无效标记，从内容中移除它们
    if (invalidMarkers.length > 0) {
      console.log("Removing invalid markers:", invalidMarkers);
      let newContent = content;
      invalidMarkers.forEach(marker => {
        newContent = newContent.replace(marker, '');
      });
      // 清理多余的空行
      newContent = newContent.replace(/\n\s*\n/g, '\n').trim();
      // 只有在内容确实发生变化时才更新
      if (newContent !== content) {
        setContent(newContent);
      }
    }

    // 检查是否有图片没有对应的标记，但只在添加新图片时执行
    // 注意：这里不处理用户主动删除的情况
    const existingIndices = new Set(
      imageMarkers.map(marker => parseInt(marker.match(/\d+/)?.[0] || '0'))
    );
    
    // 只有当图片数量大于标记数量时才添加新标记
    if (images.length > imageMarkers.length) {
      // 检查是否是用户主动删除操作
      // 如果是用户主动删除，不自动添加图片标记
      if (!isUserDelete) {
        let newContent = content;
        let contentChanged = false;
        
        // 为没有标记的图片添加标记
        images.forEach((_, index) => {
          if (!existingIndices.has(index)) {
            const marker = `[图片${index}]`;
            // 避免在内容末尾添加多余的换行符
            if (newContent.endsWith('\n')) {
              newContent += marker;
            } else if (newContent === '') {
              newContent = marker;
            } else {
              newContent += '\n' + marker;
            }
            contentChanged = true;
          }
        });
        
        if (contentChanged) {
          console.log("Adding missing image markers");
          setContent(newContent.trim());
        }
      } else {
        console.log("检测到用户主动删除操作，跳过自动添加图片标记");
      }
    }
  }, [content, images, setContent, isUserDelete]);

  // 在组件挂载和内容变化时同步图片数组和内容
  useEffect(() => {
    syncImagesAndContent();
  }, [syncImagesAndContent]);

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    onChangeFontSize?.(newSize);
  };

  const storeImageAttachment = useCallback(async (
    imageUri: string,
    noteId: string | undefined,
    imageIndex: number,
  ): Promise<string> => {
    const effectiveNoteId = noteId || tempNoteId;

    return attachmentProvider.saveAttachment({
      uri: imageUri,
      noteId: effectiveNoteId,
      kind: 'image',
      index: imageIndex,
    });
  }, [attachmentProvider, tempNoteId]);

  const handleImagePicker = () => {
    console.log("开始选择图片");
    ImagePicker.launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: 0, // 允许选择多张图片
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
      if (response.assets && response.assets.length > 0) {
        try {
          const newImages = [...images];
          let currentContent = content;
          
          for (const asset of response.assets) {
            if (asset.uri) {
              console.log("新图片路径:", asset.uri);
              
              const imageUrl = await storeImageAttachment(asset.uri, note.id, newImages.length);
              console.log("保存后的图片 URL:", imageUrl);
              
              newImages.push(imageUrl);
              
              // 在光标位置插入图片标记
              const imageMarker = `[图片${newImages.length - 1}]`;
              currentContent = currentContent.slice(0, cursorPosition) + imageMarker + currentContent.slice(cursorPosition);
            }
          }
          
          console.log("更新后的图片数组:", newImages);
          setImages(newImages);
          setContent(currentContent);
          onChangeContent(currentContent);
          
          // 立即更新父组件的状态，保存完整的图片路径
          if (onChangeImages) {
            console.log("调用onChangeImages更新图片数组");
            onChangeImages(newImages);
          } else {
            console.log("onChangeImages未定义");
          }
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
          
          const imageUrl = await storeImageAttachment(newImage, note.id, images.length);
          console.log("保存后的图片 URL:", imageUrl);
          
          const newImages = [...images, imageUrl];
          setImages(newImages);
          onChangeImages?.(newImages);
          console.log("图片", newImages);
          
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
      console.log(`开始删除图片，索引: ${imageIndex}`);
      console.log("当前图片数组:", images);
      console.log("当前内容:", content);
      
      // 设置用户删除标志
      setIsUserDelete(true);
      
      // 更新图片数组 - 移除指定索引的图片
      const newImages = [...images];
      newImages.splice(imageIndex, 1);
      console.log("更新后的图片数组:", newImages);
      
      // 更新内容中的图片标记
      let newContent = content;
      
      // 1. 删除当前图片的标记
      const imagePattern = new RegExp(`\\[图片${imageIndex}\\]`, 'g');
      newContent = newContent.replace(imagePattern, '');
      
      // 2. 重新编号所有大于当前索引的图片标记
      // 从大到小处理，避免替换过程中的索引冲突
      for (let i = images.length - 1; i > imageIndex; i--) {
        const oldPattern = new RegExp(`\\[图片${i}\\]`, 'g');
        newContent = newContent.replace(oldPattern, `[图片${i - 1}]`);
      }
      
      // 3. 清理多余的空行
      newContent = newContent.replace(/\n\s*\n/g, '\n').trim();
      
      console.log("更新后的内容:", newContent);
      
      // 5. 先更新内容，再更新图片数组，避免触发syncImagesAndContent的自动添加
      setContent(newContent);
      onChangeContent(newContent);
      
      // 6. 延迟更新图片数组，确保内容已更新
      setTimeout(() => {
        setImages(newImages);
        if (onChangeImages) {
          onChangeImages(newImages);
        }
        
        // 重置用户删除标志
        setTimeout(() => {
          setIsUserDelete(false);
        }, 100);
      }, 50);
      
    } catch (error) {
      console.error('删除图片失败:', error);
      Alert.alert('错误', '删除图片时发生错误');
      // 确保在出错时也重置用户删除标志
      setIsUserDelete(false);
    }
  };

  const requestAudioPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: '录音权限',
            message: '需要访问麦克风以录制音频',
            buttonNeutral: '稍后询问',
            buttonNegative: '取消',
            buttonPositive: '确定',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else {
          Alert.alert('权限被拒绝', '需要录音权限才能使用录音功能');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const getAudioPath = useCallback((audioIndex: number): string => {
    const timestamp = Date.now();
    const basePath = `${RNFetchBlob.fs.dirs.DocumentDir}/audios`;
    const fileName = `${note.id}_${timestamp}_${audioIndex}.mp3`;
    return `${basePath}/${fileName}`;
  }, [note.id]);

  const handleStartRecording = async () => {
    try {
      if (isRecording) {
        return;
      }

      const hasPermission = await requestAudioPermission();
      if (!hasPermission) {
        return;
      }

      // 确保音频目录存在
      const audioDir = `${RNFetchBlob.fs.dirs.DocumentDir}/audios`;
      try {
        await RNFetchBlob.fs.mkdir(audioDir);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '';
        if (!message.includes('already exists')) {
          throw error;
        }
      }

      const audioPath = getAudioPath(audios.length);
      console.log('开始录音，文件路径:', audioPath);
      
      // 确保文件不存在
      const exists = await RNFetchBlob.fs.exists(audioPath);
      if (exists) {
        await RNFetchBlob.fs.unlink(audioPath);
      }

      await audioRecorderPlayer.startRecorder(audioPath);
      audioRecorderPlayer.addRecordBackListener((e: { currentPosition: number }) => {
        console.log('录音时间:', e.currentPosition);
      });
      setIsRecording(true);
      setCurrentAudioPath(audioPath);
    } catch (error) {
      console.error('开始录音失败:', error);
      Alert.alert('错误', '开始录音失败');
    }
  };

  const handleStopRecording = useCallback(async () => {
    try {
      if (!isRecording || !currentAudioPath) {
        return;
      }

      console.log('停止录音');
      console.log('录音文件路径:', currentAudioPath);
      
      // 检查文件是否存在
      const exists = await RNFetchBlob.fs.exists(currentAudioPath);
      if (!exists) {
        throw new Error('录音文件不存在');
      }

      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      
      if (!result) {
        throw new Error('录音文件不存在');
      }

      const audioUrl = await storeAudioAttachment(currentAudioPath, note.id, audios.length);
      console.log('保存后的音频 URL:', audioUrl);
      
      const newAudios = [...audios, audioUrl];
      setAudios(newAudios);
      onChangeAudios?.(newAudios);
      
      // 在光标位置插入音频标记
      const audioMarker = `[音频${newAudios.length - 1}]`;
      const newContent = content.slice(0, cursorPosition) + audioMarker + content.slice(cursorPosition);
      setContent(newContent);
      onChangeContent(newContent);
      
      // 重置当前录音路径
      setCurrentAudioPath(null);
    } catch (error) {
      console.error('停止录音失败:', error);
      // 即使停止录音失败，也要重置状态
      setIsRecording(false);
      setCurrentAudioPath(null);
      Alert.alert('错误', '停止录音失败');
    }
  }, [isRecording, note.id, audios, cursorPosition, content, onChangeAudios, onChangeContent, audioRecorderPlayer, currentAudioPath, storeAudioAttachment]);

  // 组件卸载时停止录音
  useEffect(() => {
    return () => {
      if (isRecording) {
        handleStopRecording().catch(console.error);
      }
    };
  }, [isRecording, handleStopRecording]);

  const handlePlayAudio = async (audioIndex: number) => {
    try {
      if (isPlaying && currentAudioIndex === audioIndex) {
        await audioRecorderPlayer.stopPlayer();
        setIsPlaying(false);
        setCurrentAudioIndex(-1);
      } else {
        if (isPlaying) {
          await audioRecorderPlayer.stopPlayer();
        }
        await audioRecorderPlayer.startPlayer(audios[audioIndex]);
        audioRecorderPlayer.addPlayBackListener((e: { currentPosition: number; duration: number }) => {
          if (e.currentPosition === e.duration) {
            setIsPlaying(false);
            setCurrentAudioIndex(-1);
          }
        });
        setIsPlaying(true);
        setCurrentAudioIndex(audioIndex);
      }
    } catch (error) {
      console.error('播放音频失败:', error);
      Alert.alert('错误', '播放音频失败');
    }
  };

  const handleDeleteAudio = async (audioIndex: number) => {
    try {
      // 更新音频数组
      const newAudios = audios.filter((_, i) => i !== audioIndex);
      setAudios(newAudios);
      
      // 更新父组件的状态
      if (onChangeAudios) {
        onChangeAudios(newAudios);
      }
      
      // 更新内容中的音频标记
      let newContent = content;
      const audioPattern = new RegExp(`\\[音频${audioIndex}\\]`, 'g');
      newContent = newContent.replace(audioPattern, '');
      
      // 重新编号剩余的音频标记
      for (let i = audioIndex + 1; i < audios.length; i++) {
        const oldPattern = new RegExp(`\\[音频${i}\\]`, 'g');
        newContent = newContent.replace(oldPattern, `[音频${i - 1}]`);
      }
      
      setContent(newContent);
      onChangeContent(newContent);
    } catch (error) {
      console.error('删除音频失败:', error);
      Alert.alert('错误', '删除音频失败');
    }
  };

  const handleBoldToggle = () => {
    if (selection.start !== selection.end) {
      // 有选中文本时，只对选中部分应用加粗
      const newTextSegments = [...textSegments];
      const startSegment = newTextSegments.findIndex(segment => {
        const segmentStart = newTextSegments
          .slice(0, newTextSegments.indexOf(segment))
          .reduce((acc, seg) => acc + seg.text.length, 0);
        return selection.start >= segmentStart && selection.start < segmentStart + segment.text.length;
      });
      
      if (startSegment !== -1) {
        const segment = newTextSegments[startSegment];
        const segmentStart = newTextSegments
          .slice(0, startSegment)
          .reduce((acc, seg) => acc + seg.text.length, 0);
        
        const relativeStart = selection.start - segmentStart;
        const relativeEnd = Math.min(selection.end - segmentStart, segment.text.length);
        
        // 分割文本段
        const beforeText = segment.text.slice(0, relativeStart);
        const selectedText = segment.text.slice(relativeStart, relativeEnd);
        const afterText = segment.text.slice(relativeEnd);
        
        // 创建新的文本段
        const newSegments = [];
        if (beforeText) {
          newSegments.push({ ...segment, text: beforeText });
        }
        newSegments.push({ ...segment, text: selectedText, isBold: !segment.isBold });
        if (afterText) {
          newSegments.push({ ...segment, text: afterText });
        }
        
        // 更新文本段数组
        newTextSegments.splice(startSegment, 1, ...newSegments);
        setTextSegments(newTextSegments);
        
        // 更新内容
        const newContent = newTextSegments.map(segment => segment.text).join('');
        setContent(newContent);
        onChangeContent(newContent);
        if (_onChangeTextSegments) {
          _onChangeTextSegments(newTextSegments);
        }
      }
    } else {
      // 没有选中文本时，切换全局加粗状态
      setIsBold(!isBold);
      const newTextSegments = textSegments.map(segment => ({
        ...segment,
        isBold: !isBold
      }));
      setTextSegments(newTextSegments);
      if (_onChangeTextSegments) {
        _onChangeTextSegments(newTextSegments);
      }
    }
  };

  const renderContent = () => {
    const parts = content.split(/(\[图片\d+\]|\[音频\d+\])/g);
    console.log("渲染内容 - 图片数组:", images);
    console.log("渲染内容 - 音频数组:", audios);
    console.log("渲染内容 - 当前内容:", content);
    console.log("渲染内容 - 分割后的部分:", parts);

    // 如果内容为空且没有图片和音频，添加一个空的 TextInput 来显示提示
    if (content.trim() === '' && images.length === 0 && audios.length === 0) {
      return (
        <View style={styles.contentWrapper}>
          <TextInput
            style={[styles.textContent, {
              fontSize: fontSize,
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              color: theme.text,
              padding: 8,
              margin: 0,
              textAlignVertical: 'top',
            }]}
            placeholder="点击此处开始编辑笔记..."
            placeholderTextColor={theme.textLight}
            onChangeText={(text) => {
              setContent(text);
              onChangeContent(text);
            }}
            onSelectionChange={(event) => {
              setSelection(event.nativeEvent.selection);
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
            const imageIndex = parseInt(imageMatch[1]);
            console.log("渲染图片 - 找到图片标记，索引:", imageIndex);
            console.log("渲染图片 - 对应的图片路径:", images[imageIndex]);
            if (images[imageIndex]) {
              return (
                <View key={`image-${imageIndex}-${index}`} style={styles.imageContainer}>
                  <Image
                    source={{ uri: images[imageIndex] }}
                    style={[styles.noteImage, { backgroundColor: '#f0f0f0' }]}
                    resizeMode="contain"
                    onError={(error) => {
                      console.log("图片加载错误:", error.nativeEvent.error);
                      console.log("图片URL:", images[imageIndex]);
                    }}
                    onLoadStart={() => console.log("开始加载图片:", images[imageIndex])}
                    onLoad={() => console.log("图片加载成功:", images[imageIndex])}
                    onLoadEnd={() => console.log("图片加载结束:", images[imageIndex])}
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
              return null;
            }
          } else if (audioMatch) {
            const audioIndex = parseInt(audioMatch[1]);
            if (audios[audioIndex]) {
              return (
                <View key={`audio-${audioIndex}-${index}`} style={styles.audioContainer}>
                  <TouchableOpacity
                    style={[styles.playButton, { backgroundColor: theme.primary }]}
                    onPress={() => handlePlayAudio(audioIndex)}
                  >
                    <Text style={[styles.playButtonText, { color: theme.surface }]}>
                      {isPlaying && currentAudioIndex === audioIndex ? '暂停' : '播放'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteAudioButton, { backgroundColor: theme.error }]}
                    onPress={() => handleDeleteAudio(audioIndex)}
                  >
                    <Text style={styles.deleteAudioText}>×</Text>
                  </TouchableOpacity>
                </View>
              );
            }
          }
          
          // 找到对应的文本段
          const segment = textSegments.find(seg => seg.text === part);
          
          return (
            <TextInput
              key={`text-${index}`}
              style={[styles.textContent, {
                fontSize: segment?.fontSize || fontSize,
                fontWeight: segment?.isBold ? 'bold' : 'normal',
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
                setSelection(sel);
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

  const handleSaveWithValidation = async () => {
    if (!note.title.trim()) {
      setValidationMessage('标题不能为空');
      setShowValidationModal(true);
      return;
    }
    if (!content.trim() && images.length === 0 && audios.length === 0) {
      setValidationMessage('内容不能为空');
      setShowValidationModal(true);
      return;
    }
    
    try {
      setIsSaving(true);
      await onSave();
      setShowSaveSuccessModal(true);
      setTimeout(() => {
        setShowSaveSuccessModal(false);
        onClose(); // 保存成功后关闭编辑页面
      }, 3000);
    } catch (error) {
      console.error('保存笔记失败:', error);
      setShowSaveErrorModal(true);
    } finally {
      setIsSaving(false);
    }
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
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveWithValidation}>
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
                    style={[styles.toolbarButton, (isBold || (selection.start !== selection.end && textSegments.some(seg => seg.isBold))) && styles.toolbarButtonActive]}
                    onPress={handleBoldToggle}
                  >
                    <Text style={[styles.toolbarButtonText, { 
                      color: (isBold || (selection.start !== selection.end && textSegments.some(seg => seg.isBold))) ? theme.primary : theme.text,
                      fontWeight: 'bold'
                    }]}>𝐁</Text>
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
                  <TouchableOpacity 
                    style={[styles.toolbarButton, isRecording && styles.recordingButton]}
                    onPress={isRecording ? handleStopRecording : handleStartRecording}
                  >
                    <Text style={[styles.toolbarButtonText, { color: isRecording ? theme.error : theme.text }]}>
                      {isRecording ? '停止' : '🎙️'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.toolbarButton]}
                    onPress={async () => {
                      try {
                        setIsAiThinking(true); // 设置AI思考状态为true
                        setShowAiThinkingModal(true); // 显示AI思考中的模态框
                        const existsText = content || "不存在正整数x,y,z,n，当>3时，满足x^n+y^n=z^n"; // 使用当前内容或默认内容
                        const userPrompt = "请帮我讲述一下这个命题中一些有趣的故事，不少于500字"; // 弹个对话框提示用户输入一些提示词
                        const completedText = await completeTextWithLLM(existsText, userPrompt); // 调用LLM接口
                        console.log("LLM返回的文本:", completedText); // 打印返回的文本
                        const newContent = content + completedText; // 将返回的文本添加到当前内容
                        console.log("更新后的内容:", newContent); // 打印更新后的内容
                        setContent(newContent); // 更新内容状态
                        onChangeContent(newContent); // 通知父组件内容已更新
                      } catch (error) {
                        console.error("AI补全文本失败:", error);
                        Alert.alert("错误", "AI补全文本失败，请稍后再试");
                      } finally {
                        setIsAiThinking(false); // 无论成功还是失败，都将AI思考状态设置为false
                        setShowAiThinkingModal(false); // 隐藏AI思考中的模态框
                      }
                    }}
                    disabled={isAiThinking} // 在AI思考时禁用按钮
                  >
                    {isAiThinking ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <Text style={[styles.toolbarButtonText, { color: theme.text }]}>
                        {'🤖️'}
                      </Text>
                    )}
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

      {/* AI思考中的模态框 */}
      <Modal
        visible={showAiThinkingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAiThinkingModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.primaryTransparent }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: theme.primaryLight }]}>
              <Text style={styles.modalIcon}>🤖️</Text>
            </View>
            <Text style={[styles.modalTitle, { color: theme.primaryDark }]}>AI思考中</Text>
            <Text style={[styles.modalMessage, { color: theme.text }]}>
              正在为您生成内容，请稍候...
            </Text>
            <Text style={[styles.modalSubMessage, { color: theme.accent }]}>
              这可能需要几秒钟时间 (◕‿◕✿)
            </Text>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          </View>
        </View>
      </Modal>

      {/* 验证提示模态框 */}
      <Modal
        visible={showValidationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowValidationModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.primaryTransparent }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: theme.primary }]}>
              <Text style={styles.modalIcon}>⚠️</Text>
            </View>
            <Text style={[styles.modalTitle, { color: theme.error }]}>提示</Text>
            <Text style={[styles.modalMessage, { color: theme.text }]}>
              {validationMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowValidationModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: theme.surface }]}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 保存中提示框 */}
      <Modal
        visible={isSaving}
        transparent
        animationType="fade"
        onRequestClose={() => {}}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.primaryTransparent }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: theme.primaryLight }]}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.primaryDark }]}>保存中</Text>
            <Text style={[styles.modalMessage, { color: theme.text }]}>
              正在保存笔记，请稍候...
            </Text>
          </View>
        </View>
      </Modal>

      {/* 保存成功提示框 */}
      <Modal
        visible={showSaveSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveSuccessModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.primaryTransparent }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: theme.primaryLight }]}>
              <Text style={styles.modalIcon}>✅</Text>
            </View>
            <Text style={[styles.modalTitle, { color: theme.primaryDark }]}>保存成功</Text>
            <Text style={[styles.modalMessage, { color: theme.text }]}>
              笔记已成功保存
            </Text>
            <Text style={[styles.modalSubMessage, { color: theme.accent }]}>
              可以在笔记列表中查看 (◕‿◕✿)
            </Text>
          </View>
        </View>
      </Modal>

      {/* 保存失败提示框 */}
      <Modal
        visible={showSaveErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveErrorModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.primaryTransparent }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: theme.primaryLight }]}>
              <Text style={styles.modalIcon}>❌</Text>
            </View>
            <Text style={[styles.modalTitle, { color: theme.error }]}>保存失败</Text>
            <Text style={[styles.modalMessage, { color: theme.text }]}>
              保存笔记时发生错误
            </Text>
            <Text style={[styles.modalSubMessage, { color: theme.accent }]}>
              请稍后重试 (｡•́︿•̀｡)
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowSaveErrorModal(false)}>
              <Text style={[styles.modalButtonText, { color: theme.surface }]}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    //flex: 1,
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
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 0,
    marginTop: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  playButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteAudioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAudioText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordingButton: {
    backgroundColor: 'rgba(255,0,0,0.1)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIcon: {
    fontSize: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubMessage: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 10,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EditNotePage; 
