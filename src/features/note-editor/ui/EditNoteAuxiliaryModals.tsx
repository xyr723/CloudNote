import React from 'react';
import {ActivityIndicator, Modal, Text, TouchableOpacity, View} from 'react-native';
import {styles} from './styles';
import type {NoteEditorTheme} from './types';

type EditNoteAuxiliaryModalsProps = {
  isSaving: boolean;
  onCloseImageOptions: () => void;
  onCloseValidation: () => void;
  onOpenCamera: () => void;
  onOpenImagePicker: () => void;
  showAiThinkingModal: boolean;
  showImageModal: boolean;
  showValidationModal: boolean;
  theme: NoteEditorTheme;
  validationMessage: string;
};

export const EditNoteAuxiliaryModals: React.FC<EditNoteAuxiliaryModalsProps> = ({
  isSaving,
  onCloseImageOptions,
  onCloseValidation,
  onOpenCamera,
  onOpenImagePicker,
  showAiThinkingModal,
  showImageModal,
  showValidationModal,
  theme,
  validationMessage,
}) => {
  return (
    <>
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={onCloseImageOptions}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onCloseImageOptions}>
          <View style={[styles.imageOptionsModal, {backgroundColor: theme.surface}]}>
            <View
              style={[
                styles.imageOptionsHeader,
                {borderBottomColor: theme.border},
              ]}>
              <Text style={[styles.imageOptionsTitle, {color: theme.text}]}>
                添加图片
              </Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={onCloseImageOptions}>
                <Text style={[styles.closeModalText, {color: theme.text}]}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.imageOptionsContent}>
              <TouchableOpacity
                style={[styles.imageOptionButton, {backgroundColor: theme.primary}]}
                onPress={onOpenImagePicker}>
                <View
                  style={[styles.imageOptionIcon, {backgroundColor: theme.surface}]}>
                  <View
                    style={[styles.galleryIcon, {backgroundColor: theme.primary}]}>
                    <View
                      style={[
                        styles.galleryIconInner,
                        {backgroundColor: theme.primary},
                      ]}
                    />
                    <View
                      style={[
                        styles.galleryIconInner,
                        {backgroundColor: theme.primary},
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.imageOptionText, {color: theme.surface}]}>
                  从相册选择
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.imageOptionButton, {backgroundColor: theme.primary}]}
                onPress={onOpenCamera}>
                <View
                  style={[styles.imageOptionIcon, {backgroundColor: theme.surface}]}>
                  <View
                    style={[styles.cameraIcon, {borderColor: theme.primary}]}>
                    <View
                      style={[
                        styles.cameraLensIcon,
                        {backgroundColor: theme.primary},
                      ]}
                    />
                    <View
                      style={[
                        styles.cameraFlashIcon,
                        {backgroundColor: theme.primary},
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.imageOptionText, {color: theme.surface}]}>
                  拍照
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
