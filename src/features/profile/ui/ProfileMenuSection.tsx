import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import type {AuthTheme} from '../../auth/ui/types';
import {profileModalStyles} from './profileModalStyles';
import {profileScaffoldStyles} from './profileScaffoldStyles';

type ProfileMenuSectionProps = {
  onOpenChangePassword: () => void;
  onOpenSettings: () => void;
  onOpenTrash: () => void;
  theme: AuthTheme;
};

export const ProfileMenuSection: React.FC<ProfileMenuSectionProps> = ({
  onOpenChangePassword,
  onOpenSettings,
  onOpenTrash,
  theme,
}) => {
  return (
    <View
      style={[
        profileScaffoldStyles.sectionCard,
        profileModalStyles.menuSection,
        {backgroundColor: theme.surface},
      ]}>
      {[
        {icon: '⚙️', label: '设置', onPress: onOpenSettings},
        {icon: '🔒', label: '修改密码', onPress: onOpenChangePassword},
        {icon: '🗑️', label: '回收站', onPress: onOpenTrash},
        {icon: 'ℹ️', label: '关于云笔记', onPress: () => {}},
      ].map(item => (
        <TouchableOpacity
          key={item.label}
          onPress={item.onPress}
          style={[
            profileModalStyles.menuItem,
            {borderBottomColor: theme.border},
          ]}>
          <Text style={profileModalStyles.menuIcon}>{item.icon}</Text>
          <Text style={[profileModalStyles.menuText, {color: theme.text}]}>
            {item.label}
          </Text>
          <Text style={[profileModalStyles.menuArrow, {color: theme.primary}]}>
            ›
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
