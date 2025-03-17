import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
  Platform,
  Modal,
} from 'react-native';

interface ProfilePageProps {
  username: string;
  notesCount: number;
  onLogout: () => void;
  onClose: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: (value: boolean) => void;
  visible: boolean;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  username,
  notesCount,
  onLogout,
  onClose,
  isDarkMode = false,
  onToggleDarkMode,
  visible,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#C5A3E6" barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>个人中心</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{username[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.username}>{username}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{notesCount}</Text>
                <Text style={styles.statLabel}>笔记数量</Text>
              </View>
            </View>
          </View>

          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>🔒</Text>
              <Text style={styles.menuText}>修改密码</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.menuItem}>
              <Text style={styles.menuIcon}>🌙</Text>
              <Text style={styles.menuText}>深色模式</Text>
              <Switch
                value={isDarkMode}
                onValueChange={onToggleDarkMode}
                trackColor={{false: '#E0D1F0', true: '#C5A3E6'}}
                thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuIcon}>ℹ️</Text>
              <Text style={styles.menuText}>关于云笔记</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutButtonText}>退出登录</Text>
          </TouchableOpacity>

          <Text style={styles.version}>版本 1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFAFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE6F7',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 28,
    color: '#A98DB8',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A98DB8',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE6F7',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C5A3E6',
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
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 16,
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
    color: '#A98DB8',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#B088C9',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EFE6F7',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE6F7',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#666666',
  },
  menuArrow: {
    fontSize: 20,
    color: '#B088C9',
  },
  logoutButton: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5A4C4',
  },
  logoutButtonText: {
    color: '#E5A4C4',
    fontSize: 16,
    fontWeight: '500',
  },
  version: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
    color: '#B088C9',
    fontSize: 12,
  },
});

export default ProfilePage; 