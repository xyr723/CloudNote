import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { generateThemeColors } from '../theme/colors';
import * as ImagePicker from 'react-native-image-picker';
import ChangePasswordPage from './ChangePasswordPage';
import { NoteStorage } from '../utils/storage';
import TrashPage from './TrashPage';

interface ProfilePageProps {
  username: string;
  avatar?: string;
  notesCount: number;
  onLogout: () => void;
  onClose: () => void;
  onOpenSettings: () => void;
  onUpdateAvatar: (avatarUri: string) => void;
  visible: boolean;
  theme: ReturnType<typeof generateThemeColors>;
}
const ProfilePage: React.FC<ProfilePageProps> = React.memo(({
  username,
  avatar,
  notesCount,
  onLogout,
  onClose,
  onOpenSettings,
  onUpdateAvatar,
  visible,
  theme,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  const handleImagePicker = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  const handleConfirmImagePicker = useCallback(() => {
    setShowConfirmModal(false);
    ImagePicker.launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
    }, async (response) => {
      if (response.didCancel) {
        console.log('用户取消了图片选择');
        return;
      }
      if (response.errorCode) {
        Alert.alert(
          '错误',
          '选择图片时发生错误',
          [
            {
              text: '确定',
              style: 'default',
              onPress: () => {},
            },
          ],
          { cancelable: true }
        );
        return;
      }
      if (response.assets && response.assets[0].uri) {
        try {
          console.log('选择的图片 URI:', response.assets[0].uri);
          // 上传头像到云端
          const avatarUrl = await NoteStorage.saveAvatar(username, response.assets[0].uri);
          console.log('上传后的头像 URL:', avatarUrl);
          // 更新头像显示
          onUpdateAvatar(avatarUrl);
        } catch (error) {
          console.error('上传头像失败:', error);
          Alert.alert(
            '错误',
            '上传头像失败，请重试',
            [
              {
                text: '确定',
                style: 'default',
                onPress: () => {},
              },
            ],
            { cancelable: true }
          );
        }
      }
    });
  }, [username, onUpdateAvatar]);

  const handleLogout = useCallback(async () => {
    try {
      // 清除登录状态
      await NoteStorage.clearLoginState();
      // 调用父组件的登出处理函数
      onLogout();
    } catch (error) {
      console.error('登出失败:', error);
      Alert.alert('错误', '登出时发生错误，请重试');
    }
  }, [onLogout]);

  const handleOpenChangePassword = useCallback(() => {
    setShowChangePassword(true);
  }, []);

  const handleCloseChangePassword = useCallback(() => {
    setShowChangePassword(false);
  }, []);

  const handleCloseConfirmModal = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  const handleOpenTrash = useCallback(() => {
    setShowTrash(true);
  }, []);

  const handleCloseTrash = useCallback(() => {
    setShowTrash(false);
  }, []);

  const avatarSource = useMemo(() => {
    if (!avatar) return undefined;
    return { uri: avatar + '?timestamp=' + Date.now() };
  }, [avatar]);

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
          <View style={[styles.header, { backgroundColor: theme.primary }]}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={[styles.closeButtonText, { color: theme.surface }]}>×</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.surface }]}>个人中心</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content}>
            <View style={[styles.profileSection, { backgroundColor: theme.surface }]}>
              <TouchableOpacity 
                style={[styles.avatarContainer, { backgroundColor: theme.primary }]}
                onPress={handleImagePicker}
              >
                {avatar ? (
                  <Image
                    source={avatarSource}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={[styles.avatarText, { color: theme.surface }]}>
                    {username?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                )}
              </TouchableOpacity>
              <Text style={[styles.username, { color: theme.textDark }]}>{username}</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.primary }]}>{notesCount}</Text>
                  <Text style={[styles.statLabel, { color: theme.primaryLight }]}>笔记数量</Text>
                </View>
              </View>
            </View>

            <View style={[styles.menuSection, { backgroundColor: theme.surface }]}>
              <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={onOpenSettings}>
                <Text style={styles.menuIcon}>⚙️</Text>
                <Text style={[styles.menuText, { color: theme.text }]}>设置</Text>
                <Text style={[styles.menuArrow, { color: theme.primary }]}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuItem, { borderBottomColor: theme.border }]}
                onPress={handleOpenChangePassword}>
                <Text style={styles.menuIcon}>🔒</Text>
                <Text style={[styles.menuText, { color: theme.text }]}>修改密码</Text>
                <Text style={[styles.menuArrow, { color: theme.primary }]}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuItem, { borderBottomColor: theme.border }]}
                onPress={handleOpenTrash}>
                <Text style={styles.menuIcon}>🗑️</Text>
                <Text style={[styles.menuText, { color: theme.text }]}>回收站</Text>
                <Text style={[styles.menuArrow, { color: theme.primary }]}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]}>
                <Text style={styles.menuIcon}>ℹ️</Text>
                <Text style={[styles.menuText, { color: theme.text }]}>关于云笔记</Text>
                <Text style={[styles.menuArrow, { color: theme.primary }]}>›</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.logoutButton, { 
                backgroundColor: theme.surface,
                borderColor: theme.error 
              }]} 
              onPress={handleLogout}>
              <Text style={[styles.logoutButtonText, { color: theme.error }]}>退出登录</Text>
            </TouchableOpacity>

            <Text style={[styles.version, { color: theme.textLight }]}>版本 1.0.0</Text>
          </ScrollView>
        </SafeAreaView>

        <Modal
          visible={showChangePassword}
          animationType="slide"
          onRequestClose={handleCloseChangePassword}>
          <ChangePasswordPage
            username={username}
            theme={theme}
            onBack={handleCloseChangePassword}
          />
        </Modal>

        <Modal
          visible={showConfirmModal}
          transparent
          animationType="fade"
          onRequestClose={handleCloseConfirmModal}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>选择头像</Text>
              <Text style={[styles.modalMessage, { color: theme.text }]}>
                请从相册中选择一张图片作为头像
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.primary }]}
                  onPress={handleConfirmImagePicker}>
                  <Text style={[styles.modalButtonText, { color: theme.surface }]}>选择图片</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.surface }]}
                  onPress={handleCloseConfirmModal}>
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>取消</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Modal>

      <Modal
        visible={showTrash}
        animationType="slide"
        onRequestClose={handleCloseTrash}
        transparent={false}>
        <TrashPage
          onClose={handleCloseTrash}
          theme={theme}
        />
      </Modal>
    </>
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
  profileSection: {
    marginTop: 12,
    marginHorizontal: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  menuSection: {
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  menuArrow: {
    fontSize: 20,
  },
  logoutButton: {
    marginTop: 24,
    marginHorizontal: 20,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  version: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
    fontSize: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ProfilePage; 