import React from 'react';
import {ActivityIndicator, Modal, Text, TouchableOpacity, View} from 'react-native';
import {styles} from './styles';
import type {NoteEditorTheme} from './types';

type EditNoteAuxiliaryModalsProps = {
  isSaving: boolean;
  onCloseValidation: () => void;
  showAiThinkingModal: boolean;
  showValidationModal: boolean;
  theme: NoteEditorTheme;
  validationMessage: string;
};

export const EditNoteAuxiliaryModals: React.FC<EditNoteAuxiliaryModalsProps> = ({
  isSaving,
  onCloseValidation,
  showAiThinkingModal,
  showValidationModal,
  theme,
  validationMessage,
}) => {
  return (
    <>
      <Modal
        visible={showAiThinkingModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}>
        <View style={[styles.modalOverlay, {backgroundColor: theme.primaryTransparent}]}>
          <View style={[styles.modalContent, {backgroundColor: theme.surface}]}>
            <View
              style={[
                styles.modalIconContainer,
                {backgroundColor: theme.primaryLight},
              ]}>
              <Text style={styles.modalIcon}>🤖️</Text>
            </View>
            <Text style={[styles.modalTitle, {color: theme.primaryDark}]}>
              AI思考中
            </Text>
            <Text style={[styles.modalMessage, {color: theme.text}]}>
              正在为您生成内容，请稍候...
            </Text>
            <Text style={[styles.modalSubMessage, {color: theme.accent}]}>
              这可能需要几秒钟时间 (◕‿◕✿)
            </Text>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showValidationModal}
        transparent
        animationType="fade"
        onRequestClose={onCloseValidation}>
        <View style={[styles.modalOverlay, {backgroundColor: theme.primaryTransparent}]}>
          <View style={[styles.modalContent, {backgroundColor: theme.surface}]}>
            <View style={[styles.modalIconContainer, {backgroundColor: theme.primary}]}>
              <Text style={styles.modalIcon}>⚠️</Text>
            </View>
            <Text style={[styles.modalTitle, {color: theme.error}]}>提示</Text>
            <Text style={[styles.modalMessage, {color: theme.text}]}>
              {validationMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, {backgroundColor: theme.primary}]}
              onPress={onCloseValidation}>
              <Text style={[styles.modalButtonText, {color: theme.surface}]}>
                确定
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isSaving}
        transparent
        animationType="fade"
        onRequestClose={() => {}}>
        <View style={[styles.modalOverlay, {backgroundColor: theme.primaryTransparent}]}>
          <View style={[styles.modalContent, {backgroundColor: theme.surface}]}>
            <View
              style={[
                styles.modalIconContainer,
                {backgroundColor: theme.primaryLight},
              ]}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
            <Text style={[styles.modalTitle, {color: theme.primaryDark}]}>
              保存中
            </Text>
            <Text style={[styles.modalMessage, {color: theme.text}]}>
              正在保存笔记，请稍候...
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
};
