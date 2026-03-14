import React from 'react';
import {Modal, Text, TouchableOpacity, View} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {homeFeedbackStyles} from './homeFeedbackStyles';

type HomeOverlayModalsProps = {
  confirmDelete: () => Promise<void>;
  deleteModalVisible: boolean;
  deleteSuccessModalVisible: boolean;
  onCloseDeleteModal: () => void;
  onCloseDeleteSuccessModal: () => void;
  onCloseLogoutConfirm: () => void;
  onCloseSaveError: () => void;
  onCloseSaveSuccess: () => void;
  onCloseSyncError: () => void;
  onConfirmLogout: () => Promise<void>;
  showLogoutConfirm: boolean;
  showSaveErrorModal: boolean;
  showSaveSuccessModal: boolean;
  showSyncErrorModal: boolean;
  theme: ReturnType<typeof generateThemeColors>;
};

export const HomeOverlayModals: React.FC<HomeOverlayModalsProps> = ({
  confirmDelete,
  deleteModalVisible,
  deleteSuccessModalVisible,
  onCloseDeleteModal,
  onCloseDeleteSuccessModal,
  onCloseLogoutConfirm,
  onCloseSaveError,
  onCloseSaveSuccess,
  onCloseSyncError,
  onConfirmLogout,
  showLogoutConfirm,
  showSaveErrorModal,
  showSaveSuccessModal,
  showSyncErrorModal,
  theme,
}) => {
  return (
    <>
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={onCloseDeleteModal}>
        <View
          style={[
            homeFeedbackStyles.deleteModalContainer,
            {backgroundColor: theme.primaryTransparent},
          ]}>
          <View
            style={[
              homeFeedbackStyles.deleteModalContent,
              {backgroundColor: theme.surface},
            ]}>
            <View
              style={[
                homeFeedbackStyles.deleteIconContainer,
                {backgroundColor: theme.primaryLight},
              ]}>
              <Text style={homeFeedbackStyles.deleteIcon}>🗑️</Text>
            </View>
            <Text
              style={[homeFeedbackStyles.deleteTitle, {color: theme.primaryDark}]}>
              删除笔记
            </Text>
            <Text
              style={[homeFeedbackStyles.deleteMessage, {color: theme.text}]}>
              确定要删除这条笔记吗？
            </Text>
            <Text
              style={[
                homeFeedbackStyles.deleteSubMessage,
                {color: theme.accent},
              ]}>
              删除后将无法恢复哦 (｡•́︿•̀｡)
            </Text>
            <View style={homeFeedbackStyles.deleteButtons}>
              <TouchableOpacity
                style={[
                  homeFeedbackStyles.deleteButton,
                  homeFeedbackStyles.cancelDeleteButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.primary,
                  },
                ]}
                onPress={onCloseDeleteModal}>
                <Text
                  style={[
                    homeFeedbackStyles.cancelDeleteButtonText,
                    {color: theme.primary},
                  ]}>
                  再想想
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  homeFeedbackStyles.deleteButton,
                  homeFeedbackStyles.confirmDeleteButton,
                  {backgroundColor: theme.error},
                ]}
                onPress={confirmDelete}>
                <Text
                  style={[
                    homeFeedbackStyles.confirmDeleteButtonText,
                    {color: theme.surface},
                  ]}>
                  删除
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteSuccessModalVisible}
        transparent
        animationType="fade"
        onRequestClose={onCloseDeleteSuccessModal}>
        <View
          style={[
            homeFeedbackStyles.deleteModalContainer,
            {backgroundColor: theme.primaryTransparent},
          ]}>
          <View
            style={[
              homeFeedbackStyles.deleteModalContent,
              {backgroundColor: theme.surface},
            ]}>
            <View
              style={[
                homeFeedbackStyles.deleteIconContainer,
                {backgroundColor: theme.primaryLight},
              ]}>
              <Text style={homeFeedbackStyles.deleteIcon}>✅</Text>
            </View>
            <Text
              style={[homeFeedbackStyles.deleteTitle, {color: theme.primaryDark}]}>
              删除成功
            </Text>
            <Text
              style={[homeFeedbackStyles.deleteMessage, {color: theme.text}]}>
              笔记已放入回收站
            </Text>
            <Text
              style={[
                homeFeedbackStyles.deleteSubMessage,
                {color: theme.accent},
              ]}>
              可以在回收站中查看或恢复 (◕‿◕✿)
            </Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={onCloseLogoutConfirm}>
        <View
          style={[
            homeFeedbackStyles.deleteModalContainer,
            {backgroundColor: theme.primaryTransparent},
          ]}>
          <View
            style={[
              homeFeedbackStyles.deleteModalContent,
              {backgroundColor: theme.surface},
            ]}>
            <Text
              style={[homeFeedbackStyles.deleteTitle, {color: theme.primaryDark}]}>
              退出登录
            </Text>
            <Text
              style={[homeFeedbackStyles.deleteMessage, {color: theme.text}]}>
              确定要退出登录吗？
            </Text>
            <Text
              style={[
                homeFeedbackStyles.deleteSubMessage,
                {color: theme.accent},
              ]}>
              退出后将无法查看笔记哦 (｡•́︿•̀｡)
            </Text>
            <View style={homeFeedbackStyles.deleteButtons}>
              <TouchableOpacity
                style={[
                  homeFeedbackStyles.deleteButton,
                  homeFeedbackStyles.cancelDeleteButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.primary,
                  },
                ]}
                onPress={onCloseLogoutConfirm}>
                <Text
                  style={[
                    homeFeedbackStyles.cancelDeleteButtonText,
                    {color: theme.primary},
                  ]}>
                  再想想
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  homeFeedbackStyles.deleteButton,
                  homeFeedbackStyles.confirmDeleteButton,
                  {backgroundColor: theme.error},
                ]}
                onPress={onConfirmLogout}>
                <Text
                  style={[
                    homeFeedbackStyles.confirmDeleteButtonText,
                    {color: theme.surface},
                  ]}>
                  退出
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSaveSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={onCloseSaveSuccess}>
        <View style={homeFeedbackStyles.saveToastContainer}>
          <View
            style={[
              homeFeedbackStyles.saveToastContent,
              {backgroundColor: theme.surface},
            ]}>
            <Text style={[homeFeedbackStyles.saveToastText, {color: theme.text}]}>
              保存成功
            </Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSaveErrorModal}
        transparent
        animationType="fade"
        onRequestClose={onCloseSaveError}>
        <View style={homeFeedbackStyles.saveToastContainer}>
          <View
            style={[
              homeFeedbackStyles.saveToastContent,
              {backgroundColor: theme.error},
            ]}>
            <Text
              style={[homeFeedbackStyles.saveToastText, {color: theme.surface}]}>
              保存失败
            </Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSyncErrorModal}
        transparent
        animationType="fade"
        onRequestClose={onCloseSyncError}>
        <View style={homeFeedbackStyles.saveToastContainer}>
          <View
            style={[
              homeFeedbackStyles.saveToastContent,
              {backgroundColor: theme.error},
            ]}>
            <Text
              style={[homeFeedbackStyles.saveToastText, {color: theme.surface}]}>
              已保存到本地，云端同步失败
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
};
