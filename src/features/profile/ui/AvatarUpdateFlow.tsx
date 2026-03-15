import React, {useCallback, useState} from 'react';
import {Alert, Modal, Text, TouchableOpacity, View} from 'react-native';
import {saveUserAvatar} from '../../../shared/account/accountCommands';
import {pickSingleImageFromLibrary} from '../../../shared/media/imagePicker';
import type {AuthTheme} from '../../auth/ui/types';
import {profileModalStyles} from './profileModalStyles';

type AvatarUpdateFlowProps = {
  children: (openAvatarPicker: () => void) => React.ReactNode;
  onUpdateAvatar: (avatarUri: string) => void;
  theme: AuthTheme;
  username: string;
};

export const AvatarUpdateFlow: React.FC<AvatarUpdateFlowProps> = ({
  children,
  onUpdateAvatar,
  theme,
  username,
}) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const openAvatarPicker = useCallback(() => {
    setShowAvatarPicker(true);
  }, []);

  const closeAvatarPicker = useCallback(() => {
    setShowAvatarPicker(false);
  }, []);

  const handleConfirmImagePicker = useCallback(async () => {
    setShowAvatarPicker(false);

    try {
      const image = await pickSingleImageFromLibrary();

      if (!image?.uri) {
        return;
      }

      const avatarUrl = await saveUserAvatar(username, image.uri);
      onUpdateAvatar(avatarUrl);
    } catch (error) {
      console.error('上传头像失败:', error);
      const message =
        error instanceof Error && error.message === '选择图片时发生错误'
          ? error.message
          : '上传头像失败，请重试';

      Alert.alert('错误', message);
    }
  }, [onUpdateAvatar, username]);

  return (
    <>
      {children(openAvatarPicker)}

      <Modal
        animationType="fade"
        onRequestClose={closeAvatarPicker}
        transparent
        visible={showAvatarPicker}>
        <View style={profileModalStyles.modalOverlay}>
          <View
            style={[
              profileModalStyles.modalContent,
              {backgroundColor: theme.surface},
            ]}>
            <Text style={[profileModalStyles.modalTitle, {color: theme.text}]}>
              选择头像
            </Text>
            <Text style={[profileModalStyles.modalMessage, {color: theme.text}]}>
              请从相册中选择一张图片作为头像
            </Text>
            <View style={profileModalStyles.modalButtons}>
              <TouchableOpacity
                onPress={handleConfirmImagePicker}
                style={[
                  profileModalStyles.modalButton,
                  {backgroundColor: theme.primary},
                ]}>
                <Text
                  style={[
                    profileModalStyles.modalButtonText,
                    {color: theme.surface},
                  ]}>
                  选择图片
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={closeAvatarPicker}
                style={[
                  profileModalStyles.modalButton,
                  {backgroundColor: theme.surface},
                ]}>
                <Text
                  style={[
                    profileModalStyles.modalButtonText,
                    {color: theme.text},
                  ]}>
                  取消
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
