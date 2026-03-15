import React from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {AuthTheme} from '../../auth/ui/types';
import {profileScaffoldStyles} from './profileScaffoldStyles';
import {profileThemeOptions} from './profileThemeOptions';

type SettingsModalProps = {
  isDarkMode: boolean;
  onClose: () => void;
  onThemeColorChange: (color: string) => void;
  onToggleDarkMode: (value: boolean) => void;
  theme: AuthTheme;
  themeColor: string;
  visible: boolean;
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isDarkMode,
  onClose,
  onThemeColorChange,
  onToggleDarkMode,
  theme,
  themeColor,
  visible,
}) => {
  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <SafeAreaView
        style={[
          profileScaffoldStyles.container,
          {backgroundColor: theme.background},
        ]}>
        <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
        <View style={[profileScaffoldStyles.header, {backgroundColor: theme.primary}]}>
          <TouchableOpacity onPress={onClose} style={profileScaffoldStyles.closeButton}>
            <Text
              style={[
                profileScaffoldStyles.closeButtonText,
                {color: theme.surface},
              ]}>
              ×
            </Text>
          </TouchableOpacity>
          <Text style={[profileScaffoldStyles.headerTitle, {color: theme.surface}]}>
            设置
          </Text>
          <View style={profileScaffoldStyles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <View
            style={[
              profileScaffoldStyles.sectionCard,
              styles.section,
              {backgroundColor: theme.surface},
            ]}>
            <Text style={[styles.sectionTitle, {color: theme.primary}]}>
              外观设置
            </Text>

            <View style={[styles.menuItem, {borderBottomColor: theme.border}]}>
              <Text style={styles.menuIcon}>🌙</Text>
              <Text style={[styles.menuText, {color: theme.text}]}>深色模式</Text>
              <Switch
                ios_backgroundColor={theme.border}
                onValueChange={onToggleDarkMode}
                thumbColor={theme.surface}
                trackColor={{false: theme.border, true: theme.primary}}
                value={isDarkMode}
              />
            </View>

            <View style={styles.colorSection}>
              <Text style={[styles.colorTitle, {color: theme.text}]}>主题颜色</Text>
              <View style={styles.colorGrid}>
                {profileThemeOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => onThemeColorChange(option.value)}
                    style={[
                      styles.colorOption,
                      themeColor === option.value ? styles.selectedColor : null,
                    ]}>
                    <View
                      style={[
                        styles.colorBackground,
                        {backgroundColor: option.value},
                      ]}
                    />
                    <Text style={[styles.colorName, {color: option.textColor}]}>
                      {option.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View
            style={[
              profileScaffoldStyles.sectionCard,
              styles.section,
              {backgroundColor: theme.surface},
            ]}>
            <Text style={[styles.sectionTitle, {color: theme.primary}]}>
              其他设置
            </Text>

            {[
              {icon: '🔔', label: '通知设置'},
              {icon: '💾', label: '数据备份'},
              {icon: '🔒', label: '隐私设置'},
            ].map(item => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, {borderBottomColor: theme.border}]}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={[styles.menuText, {color: theme.text}]}>
                  {item.label}
                </Text>
                <Text style={[styles.menuArrow, {color: theme.primary}]}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  colorBackground: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorName: {
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 1,
  },
  colorOption: {
    alignItems: 'center',
    borderRadius: 12,
    elevation: 2,
    height: 80,
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    width: '48%',
  },
  colorSection: {
    marginTop: 16,
  },
  colorTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  content: {
    flex: 1,
    paddingTop: 12,
  },
  menuArrow: {
    fontSize: 20,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuItem: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  selectedColor: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
});

export default SettingsModal;
