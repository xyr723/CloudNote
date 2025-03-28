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
  Modal,
} from 'react-native';
import { generateThemeColors } from '../theme/colors';

interface SettingsPageProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: (value: boolean) => void;
  themeColor: string;
  onThemeColorChange: (color: string) => void;
  theme: ReturnType<typeof generateThemeColors>;
}

const themeColors = [
  { name: '葡萄冰萃', value: '#DCC6EA', textColor: '#6A4C93' },
  { name: '清冽冰川', value: '#B7CCDF', textColor: '#4B6CB7' },
  { name: '流金岁月', value: '#938368', textColor: '#E5D6A4' },
  { name: '薄荷生巧', value: '#BBE1E4', textColor: '#4A7B4A' },
  { name: '桃桃乌龙', value: '#FBD7D7', textColor: '#B76E79' },
];

const SettingsPage: React.FC<SettingsPageProps> = ({
  visible,
  onClose,
  isDarkMode,
  onToggleDarkMode,
  themeColor,
  onThemeColorChange,
  theme,
}) => {
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
          <Text style={[styles.headerTitle, { color: theme.surface }]}>设置</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>外观设置</Text>
            
            <View style={[styles.menuItem, { borderBottomColor: theme.border }]}>
              <Text style={styles.menuIcon}>🌙</Text>
              <Text style={[styles.menuText, { color: theme.text }]}>深色模式</Text>
              <Switch
                value={isDarkMode}
                onValueChange={onToggleDarkMode}
                trackColor={{false: theme.border, true: theme.primary}}
                thumbColor={isDarkMode ? theme.surface : theme.surface}
              />
            </View>

            <View style={styles.colorSection}>
              <Text style={[styles.colorTitle, { color: theme.text }]}>主题颜色</Text>
              <View style={styles.colorGrid}>
                {themeColors.map((color) => (
                  <TouchableOpacity
                    key={color.value}
                    style={[
                      styles.colorOption,
                      themeColor === color.value && styles.selectedColor,
                    ]}
                    onPress={() => onThemeColorChange(color.value)}>
                    <View style={[styles.colorBackground, { backgroundColor: color.value }]} />
                    <Text style={[styles.colorName, { color: color.textColor }]}>{color.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>其他设置</Text>
            
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]}>
              <Text style={styles.menuIcon}>🔔</Text>
              <Text style={[styles.menuText, { color: theme.text }]}>通知设置</Text>
              <Text style={[styles.menuArrow, { color: theme.primary }]}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]}>
              <Text style={styles.menuIcon}>💾</Text>
              <Text style={[styles.menuText, { color: theme.text }]}>数据备份</Text>
              <Text style={[styles.menuArrow, { color: theme.primary }]}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]}>
              <Text style={styles.menuIcon}>🔒</Text>
              <Text style={[styles.menuText, { color: theme.text }]}>隐私设置</Text>
              <Text style={[styles.menuArrow, { color: theme.primary }]}>›</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  section: {
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
  colorSection: {
    marginTop: 16,
  },
  colorTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: '48%',
    height: 80,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    overflow: 'hidden',
  },
  colorBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  colorName: {
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default SettingsPage; 