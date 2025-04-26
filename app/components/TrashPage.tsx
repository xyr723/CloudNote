import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import { generateThemeColors } from '../theme/colors';

interface TrashPageProps {
  onClose: () => void;
  theme: ReturnType<typeof generateThemeColors>;
}

// 示例笔记数据
const sampleNotes = [
  {
    id: '1',
    title: '购物清单',
    content: '1. 牛奶\n2. 面包\n3. 鸡蛋',
    deletedAt: '2024-04-25 14:30',
  },
  {
    id: '2',
    title: '会议记录',
    content: '讨论了新项目的时间线和资源分配，完善了UI设计以及计划书中的不足和问题，规划了接下来的工作内容，并分配了详细的个人任务',
    deletedAt: '2024-04-25 14:15',
  },
];

const TrashPage: React.FC<TrashPageProps> = React.memo(({
  onClose,
  theme,
}) => {
  // 状态管理
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<typeof sampleNotes[0] | null>(null);
  const [restoreSuccessModalVisible, setRestoreSuccessModalVisible] = useState(false);
  const [deleteSuccessModalVisible, setDeleteSuccessModalVisible] = useState(false);

  // 处理恢复笔记
  const handleRestore = (note: typeof sampleNotes[0]) => {
    setSelectedNote(note);
    setRestoreModalVisible(true);
  };

  // 处理彻底删除笔记
  const handleDelete = (note: typeof sampleNotes[0]) => {
    setSelectedNote(note);
    setDeleteModalVisible(true);
  };

  // 确认恢复笔记
  const confirmRestore = () => {
    setRestoreModalVisible(false);
    setRestoreSuccessModalVisible(true);
    
    // 3秒后自动关闭成功弹窗
    setTimeout(() => {
      setRestoreSuccessModalVisible(false);
    }, 1500);
  };

  // 确认彻底删除笔记
  const confirmDelete = () => {
    setDeleteModalVisible(false);
    setDeleteSuccessModalVisible(true);
    
    // 3秒后自动关闭成功弹窗
    setTimeout(() => {
      setDeleteSuccessModalVisible(false);
    }, 1500);
  };

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

      <ScrollView style={styles.content}>
        {sampleNotes.map((note) => (
          <View 
            key={note.id} 
            style={[styles.noteCard, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.noteTitle, { color: theme.text }]}>{note.title}</Text>
            <Text style={[styles.noteContent, { color: theme.textLight }]} numberOfLines={2}>
              {note.content}
            </Text>
            <Text style={[styles.deletedAt, { color: theme.textLight }]}>
              删除于: {note.deletedAt}
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
});

export default TrashPage; 