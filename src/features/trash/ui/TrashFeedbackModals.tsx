import React from 'react';
import {Modal, Text, TouchableOpacity, View} from 'react-native';
import type {Note} from '../../../entities/note/types';
import {generateThemeColors} from '../../../shared/theme/colors';
import {trashStyles} from './trashStyles';

type TrashAction = 'restore' | 'delete' | null;
type TrashSuccessFeedback = 'restore' | 'delete' | null;

type TrashFeedbackModalsProps = {
  activeAction: TrashAction;
  selectedNote: Note | null;
  successFeedback: TrashSuccessFeedback;
  onCloseAction: () => void;
  onCloseSuccessFeedback: () => void;
  onConfirmAction: () => void | Promise<void>;
  theme: ReturnType<typeof generateThemeColors>;
};

const getActionConfig = (action: Exclude<TrashAction, null>) => {
  if (action === 'restore') {
    return {
      icon: '↩️',
      title: '恢复笔记',
      message: '确定要恢复这条笔记吗？',
      subMessage: '恢复后笔记将回到笔记列表中 (◕‿◕✿)',
      confirmLabel: '恢复',
      confirmColorKey: 'primary' as const,
    };
  }

  return {
    icon: '🗑️',
    title: '彻底删除',
    message: '确定要彻底删除这条笔记吗？',
    subMessage: '彻底删除后将无法恢复 (｡•́︿•̀｡)',
    confirmLabel: '删除',
    confirmColorKey: 'error' as const,
  };
};

const getSuccessConfig = (feedback: Exclude<TrashSuccessFeedback, null>) => {
  if (feedback === 'restore') {
    return {
      title: '恢复成功',
      message: '笔记已恢复到笔记列表中',
      subMessage: '可以在笔记列表中查看 (◕‿◕✿)',
    };
  }

  return {
    title: '删除成功',
    message: '笔记已彻底删除',
    subMessage: '笔记已从回收站中移除 (◕‿◕✿)',
  };
};

export const TrashFeedbackModals: React.FC<TrashFeedbackModalsProps> = ({
  activeAction,
  selectedNote,
  successFeedback,
  onCloseAction,
  onCloseSuccessFeedback,
  onConfirmAction,
  theme,
}) => {
  const actionConfig = activeAction ? getActionConfig(activeAction) : null;
  const successConfig = successFeedback
    ? getSuccessConfig(successFeedback)
    : null;

  return (
    <>
      <Modal
        visible={Boolean(activeAction && selectedNote)}
        transparent
        animationType="fade"
        onRequestClose={onCloseAction}>
        <View
          style={[
            trashStyles.modalOverlay,
            {backgroundColor: theme.primaryTransparent},
          ]}>
          <View
            style={[
              trashStyles.modalContent,
              {backgroundColor: theme.surface},
            ]}>
            <View
              style={[
                trashStyles.modalIconContainer,
                {backgroundColor: theme.primaryLight},
              ]}>
              <Text style={trashStyles.modalIcon}>{actionConfig?.icon}</Text>
            </View>
            <Text style={[trashStyles.modalTitle, {color: theme.primaryDark}]}>
              {actionConfig?.title}
            </Text>
            <Text style={[trashStyles.modalMessage, {color: theme.text}]}>
              {actionConfig?.message}
            </Text>
            <Text style={[trashStyles.modalSubMessage, {color: theme.accent}]}>
              {actionConfig?.subMessage}
            </Text>
            <View style={trashStyles.modalButtons}>
              <TouchableOpacity
                style={[
                  trashStyles.modalButton,
                  trashStyles.cancelButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.primary,
                  },
                ]}
                onPress={onCloseAction}>
                <Text
                  style={[
                    trashStyles.cancelButtonText,
                    {color: theme.primary},
                  ]}>
                  取消
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  trashStyles.modalButton,
                  trashStyles.confirmButton,
                  {backgroundColor: actionConfig ? theme[actionConfig.confirmColorKey] : theme.primary},
                ]}
                onPress={onConfirmAction}>
                <Text
                  style={[
                    trashStyles.confirmButtonText,
                    {color: theme.surface},
                  ]}>
                  {actionConfig?.confirmLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(successFeedback)}
        transparent
        animationType="fade"
        onRequestClose={onCloseSuccessFeedback}>
        <View
          style={[
            trashStyles.modalOverlay,
            {backgroundColor: theme.primaryTransparent},
          ]}>
          <View
            style={[
              trashStyles.modalContent,
              {backgroundColor: theme.surface},
            ]}>
            <View
              style={[
                trashStyles.modalIconContainer,
                {backgroundColor: theme.primaryLight},
              ]}>
              <Text style={trashStyles.modalIcon}>✅</Text>
            </View>
            <Text style={[trashStyles.modalTitle, {color: theme.primaryDark}]}>
              {successConfig?.title}
            </Text>
            <Text style={[trashStyles.modalMessage, {color: theme.text}]}>
              {successConfig?.message}
            </Text>
            <Text style={[trashStyles.modalSubMessage, {color: theme.accent}]}>
              {successConfig?.subMessage}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
};
