import React, {useCallback, useMemo, useState} from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {updateUserPassword} from '../../../shared/account/accountCommands';
import {TrashModal} from '../../trash/ui/TrashModal';
import type {AuthTheme} from '../../auth/ui/types';
import {AvatarUpdateFlow} from './AvatarUpdateFlow';
import {ChangePasswordScreen} from './ChangePasswordScreen';
import {ProfileMenuSection} from './ProfileMenuSection';
import {profileModalStyles} from './profileModalStyles';
import {profileScaffoldStyles} from './profileScaffoldStyles';
import {ProfileSummaryCard} from './ProfileSummaryCard';

type ProfileModalProps = {
  avatar?: string;
  notesCount: number;
  onClose: () => void;
  onLogout: () => Promise<void>;
  onOpenSettings: () => void;
  onUpdateAvatar: (avatarUri: string) => void;
  theme: AuthTheme;
  username: string;
  visible: boolean;
};

export const ProfileModal: React.FC<ProfileModalProps> = React.memo(
  ({
    avatar,
    notesCount,
    onClose,
    onLogout,
    onOpenSettings,
    onUpdateAvatar,
    theme,
    username,
    visible,
  }) => {
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showTrash, setShowTrash] = useState(false);

    const handleLogout = useCallback(async () => {
      try {
        await onLogout();
      } catch (error) {
        console.error('登出失败:', error);
        Alert.alert('错误', '登出时发生错误，请重试');
      }
    }, [onLogout]);

    const handleChangePassword = useCallback(
      async (
        targetUsername: string,
        currentPassword: string,
        newPassword: string,
      ) => {
        await updateUserPassword({
          currentPassword,
          newPassword,
          username: targetUsername,
        });
      },
      [],
    );

    const avatarSource = useMemo(() => {
      if (!avatar) {
        return undefined;
      }

      if (/^https?:\/\//.test(avatar)) {
        const separator = avatar.includes('?') ? '&' : '?';
        return {uri: `${avatar}${separator}timestamp=${Date.now()}`};
      }

      return {uri: avatar};
    }, [avatar]);

    return (
      <>
        <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
          <SafeAreaView
            style={[
              profileScaffoldStyles.container,
              {backgroundColor: theme.background},
            ]}>
            <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
            <View
              style={[
                profileScaffoldStyles.header,
                {backgroundColor: theme.primary},
              ]}>
              <TouchableOpacity
                onPress={onClose}
                style={profileScaffoldStyles.closeButton}>
                <Text
                  style={[
                    profileScaffoldStyles.closeButtonText,
                    {color: theme.surface},
                  ]}>
                  ×
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  profileScaffoldStyles.headerTitle,
                  {color: theme.surface},
                ]}>
                个人中心
              </Text>
              <View style={profileScaffoldStyles.placeholder} />
            </View>

            <ScrollView style={profileModalStyles.content}>
              <AvatarUpdateFlow
                onUpdateAvatar={onUpdateAvatar}
                theme={theme}
                username={username}>
                {openAvatarPicker => (
                  <ProfileSummaryCard
                    avatar={avatar}
                    avatarSource={avatarSource}
                    notesCount={notesCount}
                    onPressAvatar={openAvatarPicker}
                    theme={theme}
                    username={username}
                  />
                )}
              </AvatarUpdateFlow>

              <ProfileMenuSection
                onOpenChangePassword={() => setShowChangePassword(true)}
                onOpenSettings={onOpenSettings}
                onOpenTrash={() => setShowTrash(true)}
                theme={theme}
              />

              <TouchableOpacity
                onPress={handleLogout}
                style={[
                  profileModalStyles.logoutButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.error,
                  },
                ]}>
                <Text
                  style={[
                    profileModalStyles.logoutButtonText,
                    {color: theme.error},
                  ]}>
                  退出登录
                </Text>
              </TouchableOpacity>

              <Text style={[profileModalStyles.version, {color: theme.textLight}]}>
                版本 1.0.0
              </Text>
            </ScrollView>
          </SafeAreaView>

          <Modal
            animationType="slide"
            onRequestClose={() => setShowChangePassword(false)}
            visible={showChangePassword}>
            <ChangePasswordScreen
              onBack={() => setShowChangePassword(false)}
              onChangePassword={handleChangePassword}
              theme={theme}
              username={username}
            />
          </Modal>
        </Modal>

        <Modal
          animationType="slide"
          onRequestClose={() => setShowTrash(false)}
          visible={showTrash}>
          <TrashModal onClose={() => setShowTrash(false)} theme={theme} username={username} />
        </Modal>
      </>
    );
  },
);

export default ProfileModal;
