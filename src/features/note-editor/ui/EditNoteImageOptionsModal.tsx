import React from 'react';
import {Modal, Text, TouchableOpacity, View} from 'react-native';
import {styles} from './styles';
import type {NoteEditorTheme} from './types';

type EditNoteImageOptionsModalProps = {
  onClose: () => void;
  onOpenCamera: () => void;
  onOpenImagePicker: () => void;
  theme: NoteEditorTheme;
  visible: boolean;
};

export const EditNoteImageOptionsModal: React.FC<
  EditNoteImageOptionsModalProps
> = ({onClose, onOpenCamera, onOpenImagePicker, theme, visible}) => {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.modalOverlay}>
        <View style={[styles.imageOptionsModal, {backgroundColor: theme.surface}]}>
          <View
            style={[
              styles.imageOptionsHeader,
              {borderBottomColor: theme.border},
            ]}>
            <Text style={[styles.imageOptionsTitle, {color: theme.text}]}>
              添加图片
            </Text>
            <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
              <Text style={[styles.closeModalText, {color: theme.text}]}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.imageOptionsContent}>
            <TouchableOpacity
              onPress={onOpenImagePicker}
              style={[styles.imageOptionButton, {backgroundColor: theme.primary}]}>
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
              onPress={onOpenCamera}
              style={[styles.imageOptionButton, {backgroundColor: theme.primary}]}>
              <View
                style={[styles.imageOptionIcon, {backgroundColor: theme.surface}]}>
                <View style={[styles.cameraIcon, {borderColor: theme.primary}]}>
                  <View
                    style={[styles.cameraLensIcon, {backgroundColor: theme.primary}]}
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
  );
};
