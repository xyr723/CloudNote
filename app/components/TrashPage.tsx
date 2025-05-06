import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { generateThemeColors } from '../theme/colors';
import { OSSClient } from '../utils/ossUpload';
import RNFetchBlob from 'react-native-blob-util';
import { Platform } from 'react-native';
import { NoteStorage } from '../utils/storage';

interface TrashPageProps {
  onClose: () => void;
  theme: ReturnType<typeof generateThemeColors>;
}

interface Note {
  id: string;
  title: string;
  content: string;
  deletedAt: string;
  images?: string[];
  audios?: string[];
  fontSize?: number;
  textSegments?: { text: string; fontSize: number; isBold?: boolean }[];
}

const TrashPage: React.FC<TrashPageProps> = React.memo(({
  onClose,
  theme,
}) => {
  // 状态管理
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [restoreSuccessModalVisible, setRestoreSuccessModalVisible] = useState(false);
  const [deleteSuccessModalVisible, setDeleteSuccessModalVisible] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string>('');

  // 初始化OSS客户端
  const ossClient = new OSSClient({
    accessKeyId: 'LTAI5tP7uEC3XekfkG4nRp5x',
    accessKeySecret: 'yLvMJLA9MrfJy4nA0oXwuZSXKBaX2o',
    bucket: 'native-123',
    region: 'cn-beijing',
  });

  // 获取当前登录用户
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        console.log('[回收站] 开始获取当前登录用户');
        const loginState = await NoteStorage.getLoginState();
        if (loginState && loginState.username) {
          console.log(`[回收站] 获取到当前用户: ${loginState.username}`);
          setUsername(loginState.username);
        } else {
          console.error('[回收站] 未找到登录用户信息');
          Alert.alert('错误', '未找到登录用户信息');
          onClose();
        }
      } catch (error) {
        console.error('[回收站] 获取用户信息失败:', error);
        Alert.alert('错误', '获取用户信息失败');
        onClose();
      }
    };
    getCurrentUser();
  }, [onClose]);

  // 加载回收站笔记
  const loadRecycleBinNotes = useCallback(async () => {
    if (!username) {
      console.log('[回收站] 用户名未设置，跳过加载笔记');
      return;
    }

    try {
      console.log(`[回收站] 开始加载用户 ${username} 的回收站笔记`);
      setIsLoading(true);
      const objectKey = `recycle-bin/${username}.json`;
      const url = `https://native-123.oss-cn-beijing.aliyuncs.com/${objectKey}`;
      
      console.log(`[回收站] 请求URL: ${url}`);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log(`[回收站] 成功加载笔记，数量: ${data.length}`);
        setNotes(data);
      } else {
        console.log(`[回收站] 未找到回收站笔记，状态码: ${response.status}`);
        setNotes([]);
      }
    } catch (error) {
      console.error('[回收站] 加载笔记失败:', error);
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  // 处理恢复笔记
  const handleRestore = (note: Note) => {
    console.log(`[回收站] 准备恢复笔记: ${note.title} (ID: ${note.id})`);
    setSelectedNote(note);
    setRestoreModalVisible(true);
  };

  // 处理彻底删除笔记
  const handleDelete = (note: Note) => {
    console.log(`[回收站] 准备彻底删除笔记: ${note.title} (ID: ${note.id})`);
    setSelectedNote(note);
    setDeleteModalVisible(true);
  };

  // 确认恢复笔记
  const confirmRestore = async () => {
    if (!selectedNote) return;
    
    try {
      console.log(`[回收站] 开始恢复笔记: ${selectedNote.title} (ID: ${selectedNote.id})`);
      
      // 1. 从回收站中移除笔记
      const updatedNotes = notes.filter(note => note.id !== selectedNote.id);
      console.log(`[回收站] 从回收站移除笔记，剩余笔记数: ${updatedNotes.length}`);
      
      // 2. 更新回收站文件
      const recycleBinObjectKey = `recycle-bin/${username}.json`;
      const recycleBinLocalPath = `${RNFetchBlob.fs.dirs.DocumentDir}/${username}_recycle_bin.json`;
      console.log(`[回收站] 更新回收站文件: ${recycleBinObjectKey}`);
      await RNFetchBlob.fs.writeFile(recycleBinLocalPath, JSON.stringify(updatedNotes), 'utf8');
      const recycleBinFilePath = Platform.OS === 'android' ? `file://${recycleBinLocalPath}` : recycleBinLocalPath;
      await ossClient.put(recycleBinObjectKey, recycleBinFilePath);
      
      // 3. 将笔记添加回user-notes
      const sourceObjectKey = `user-notes/${username}.json`;
      const sourceUrl = `https://native-123.oss-cn-beijing.aliyuncs.com/${sourceObjectKey}`;
      console.log(`[回收站] 读取源笔记文件: ${sourceObjectKey}`);
      const response = await fetch(sourceUrl);
      
      let allNotes: Note[] = [];
      if (response.ok) {
        allNotes = await response.json();
        console.log(`[回收站] 读取到源笔记数量: ${allNotes.length}`);
      }
      
      // 创建要恢复的笔记对象，不包含deletedAt字段
      const noteToRestore: Omit<Note, 'deletedAt'> = {
        id: selectedNote.id,
        title: selectedNote.title,
        content: selectedNote.content,
        images: selectedNote.images,
        audios: selectedNote.audios,
        fontSize: selectedNote.fontSize,
        textSegments: selectedNote.textSegments,
      };
      
      allNotes.push(noteToRestore as Note);
      console.log(`[回收站] 添加笔记到源文件，更新后笔记数量: ${allNotes.length}`);
      
      // 更新源文件
      const localPath = `${RNFetchBlob.fs.dirs.DocumentDir}/${username}_notes.json`;
      await RNFetchBlob.fs.writeFile(localPath, JSON.stringify(allNotes), 'utf8');
      const filePath = Platform.OS === 'android' ? `file://${localPath}` : localPath;
      await ossClient.put(sourceObjectKey, filePath);
      console.log(`[回收站] 笔记恢复完成: ${selectedNote.title}`);
      
      // 更新本地状态
      setNotes(updatedNotes);
      setRestoreModalVisible(false);
      setRestoreSuccessModalVisible(true);
      
      setTimeout(() => {
        setRestoreSuccessModalVisible(false);
      }, 1500);
    } catch (error) {
      console.error('[回收站] 恢复笔记失败:', error);
      Alert.alert('错误', '恢复笔记失败');
    }
  };

  // 确认彻底删除笔记
  const confirmDelete = async () => {
    if (!selectedNote) return;
    
    try {
      console.log(`[回收站] 开始彻底删除笔记: ${selectedNote.title} (ID: ${selectedNote.id})`);
      
      // 从回收站中移除笔记
      const updatedNotes = notes.filter(note => note.id !== selectedNote.id);
      console.log(`[回收站] 从回收站移除笔记，剩余笔记数: ${updatedNotes.length}`);
      
      // 更新回收站文件
      const recycleBinObjectKey = `recycle-bin/${username}.json`;
      const recycleBinLocalPath = `${RNFetchBlob.fs.dirs.DocumentDir}/${username}_recycle_bin.json`;
      console.log(`[回收站] 更新回收站文件: ${recycleBinObjectKey}`);
      await RNFetchBlob.fs.writeFile(recycleBinLocalPath, JSON.stringify(updatedNotes), 'utf8');
      const recycleBinFilePath = Platform.OS === 'android' ? `file://${recycleBinLocalPath}` : recycleBinLocalPath;
      await ossClient.put(recycleBinObjectKey, recycleBinFilePath);
      console.log(`[回收站] 笔记彻底删除完成: ${selectedNote.title}`);
      
      // 更新本地状态
      setNotes(updatedNotes);
      setDeleteModalVisible(false);
      setDeleteSuccessModalVisible(true);
      
      setTimeout(() => {
        setDeleteSuccessModalVisible(false);
      }, 1500);
    } catch (error) {
      console.error('[回收站] 彻底删除笔记失败:', error);
      Alert.alert('错误', '彻底删除笔记失败');
    }
  };

  // 组件加载时获取回收站笔记
  useEffect(() => {
    if (username) {
      console.log(`[回收站] 组件加载，用户: ${username}`);
      loadRecycleBinNotes();
    }
  }, [loadRecycleBinNotes, username]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={[styles.closeButtonText, { color: theme.surface }]}>×</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.surface }]}>回收站</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {notes.map((note) => (
            <View 
              key={note.id} 
              style={[styles.noteCard, { backgroundColor: theme.surface }]}
            >
              <Text style={[styles.noteTitle, { color: theme.text }]}>{note.title}</Text>
              <Text style={[styles.noteContent, { color: theme.textLight }]} numberOfLines={2}>
                {note.content}
              </Text>
              <Text style={[styles.deletedAt, { color: theme.textLight }]}>
                删除于: {new Date(note.deletedAt).toLocaleString()}
              </Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  onPress={() => handleRestore(note)}
                >
                  <Text style={[styles.actionButtonText, { color: theme.surface }]}>恢复</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: theme.error }]}
                  onPress={() => handleDelete(note)}
                >
                  <Text style={[styles.actionButtonText, { color: theme.surface }]}>彻底删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* 恢复确认弹窗 */}
      <Modal
        visible={restoreModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRestoreModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.primaryTransparent }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: theme.primaryLight }]}>
              <Text style={styles.modalIcon}>↩️</Text>
            </View>
            <Text style={[styles.modalTitle, { color: theme.primaryDark }]}>恢复笔记</Text>
            <Text style={[styles.modalMessage, { color: theme.text }]}>
              确定要恢复这条笔记吗？
            </Text>
            <Text style={[styles.modalSubMessage, { color: theme.accent }]}>
              恢复后笔记将回到笔记列表中 (◕‿◕✿)
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { 
                  backgroundColor: theme.surface,
                  borderColor: theme.primary 
                }]}
                onPress={() => setRestoreModalVisible(false)}>
                <Text style={[styles.cancelButtonText, { color: theme.primary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: theme.primary }]}
                onPress={confirmRestore}>
                <Text style={[styles.confirmButtonText, { color: theme.surface }]}>恢复</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 彻底删除确认弹窗 */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.primaryTransparent }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: theme.primaryLight }]}>
              <Text style={styles.modalIcon}>🗑️</Text>
            </View>
            <Text style={[styles.modalTitle, { color: theme.primaryDark }]}>彻底删除</Text>
            <Text style={[styles.modalMessage, { color: theme.text }]}>
              确定要彻底删除这条笔记吗？
            </Text>
            <Text style={[styles.modalSubMessage, { color: theme.accent }]}>
              彻底删除后将无法恢复 (｡•́︿•̀｡)
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { 
                  backgroundColor: theme.surface,
                  borderColor: theme.primary 
                }]}
                onPress={() => setDeleteModalVisible(false)}>
                <Text style={[styles.cancelButtonText, { color: theme.primary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: theme.error }]}
                onPress={confirmDelete}>
                <Text style={[styles.confirmButtonText, { color: theme.surface }]}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 恢复成功弹窗 */}
      <Modal
        visible={restoreSuccessModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRestoreSuccessModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.primaryTransparent }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: theme.primaryLight }]}>
              <Text style={styles.modalIcon}>✅</Text>
            </View>
            <Text style={[styles.modalTitle, { color: theme.primaryDark }]}>恢复成功</Text>
            <Text style={[styles.modalMessage, { color: theme.text }]}>
              笔记已恢复到笔记列表中
            </Text>
            <Text style={[styles.modalSubMessage, { color: theme.accent }]}>
              可以在笔记列表中查看 (◕‿◕✿)
            </Text>
          </View>
        </View>
      </Modal>

      {/* 彻底删除成功弹窗 */}
      <Modal
        visible={deleteSuccessModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteSuccessModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.primaryTransparent }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: theme.primaryLight }]}>
              <Text style={styles.modalIcon}>✅</Text>
            </View>
            <Text style={[styles.modalTitle, { color: theme.primaryDark }]}>删除成功</Text>
            <Text style={[styles.modalMessage, { color: theme.text }]}>
              笔记已彻底删除
            </Text>
            <Text style={[styles.modalSubMessage, { color: theme.accent }]}>
              笔记已从回收站中移除 (◕‿◕✿)
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
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
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingTop: 12,
  },
  noteCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    marginBottom: 8,
  },
  deletedAt: {
    fontSize: 12,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // 弹窗样式
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    borderWidth: 0,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TrashPage; 