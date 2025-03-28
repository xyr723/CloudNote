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
  Image,
  Alert,
} from 'react-native';
import { generateThemeColors } from '../theme/colors';
import * as ImagePicker from 'react-native-image-picker';

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

const ProfilePage: React.FC<ProfilePageProps> = ({
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

  const handleImagePicker = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmImagePicker = () => {
    setShowConfirmModal(false);
    ImagePicker.launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
    }, (response) => {
      if (response.didCancel) {
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
        onUpdateAvatar(response.assets[0].uri);
      }
    });
  };

  return (
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
                  source={{ uri: avatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={[styles.avatarText, { color: theme.surface }]}>
                  {username[0].toUpperCase()}
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

            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]}>
              <Text style={styles.menuIcon}>🔒</Text>
              <Text style={[styles.menuText, { color: theme.text }]}>修改密码</Text>
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
            onPress={onLogout}>
            <Text style={[styles.logoutButtonText, { color: theme.error }]}>退出登录</Text>
          </TouchableOpacity>

          <Text style={[styles.version, { color: theme.textLight }]}>版本 1.0.0</Text>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}>
        <View style={[styles.deleteModalContainer, { backgroundColor: theme.primaryTransparent }]}>
          <View style={[styles.deleteModalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.deleteTitle, { color: theme.primaryDark }]}>选择头像</Text>
            <Text style={[styles.deleteMessage, { color: theme.text }]}>即将打开相册选择图片，是否继续？</Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity
                style={[styles.deleteButton, styles.cancelDeleteButton, { 
                  backgroundColor: theme.surface,
                  borderColor: theme.primary 
                }]}
                onPress={() => setShowConfirmModal(false)}>
                <Text style={[styles.cancelDeleteButtonText, { color: theme.primary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, styles.confirmDeleteButton, { backgroundColor: theme.primary }]}
                onPress={handleConfirmImagePicker}>
                <Text style={[styles.confirmDeleteButtonText, { color: theme.surface }]}>确定</Text>
              </TouchableOpacity>
            </View>
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
  deleteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '80%',
    elevation: 5,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  deleteMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  deleteButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  deleteButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelDeleteButton: {
    borderWidth: 1,
  },
  confirmDeleteButton: {
    backgroundColor: '#E5A4C4',
  },
  cancelDeleteButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  confirmDeleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default ProfilePage; 