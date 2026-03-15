import React from 'react';
import {Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {generateThemeColors} from '../theme/colors';

type FeedbackModalProps = {
  buttonLabel: string;
  message: string;
  onClose: () => void;
  theme: ReturnType<typeof generateThemeColors>;
  title: string;
  visible: boolean;
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  buttonLabel,
  message,
  onClose,
  theme,
  title,
  visible,
}) => {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <View style={styles.overlay}>
        <View style={[styles.content, {backgroundColor: theme.surface}]}>
          <Text style={[styles.title, {color: theme.primaryDark}]}>{title}</Text>
          <Text style={[styles.message, {color: theme.text}]}>{message}</Text>
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, {backgroundColor: theme.primary}]}>
              <Text style={[styles.buttonText, {color: theme.surface}]}>
                {buttonLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    minWidth: 100,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});
