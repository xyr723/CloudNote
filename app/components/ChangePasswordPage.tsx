import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import {generateThemeColors} from '../theme/colors';

interface ChangePasswordPageProps {
  username: string;
  theme: ReturnType<typeof generateThemeColors>;
  onBack: () => void;
  onChangePassword: (
    username: string,
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
}

const ChangePasswordPage: React.FC<ChangePasswordPageProps> = ({
  username,
  theme,
  onBack,
  onChangePassword,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPasswordError, setOldPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const showError = (title: string, message: string): void => {
    setErrorTitle(title);
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const validateOldPassword = (text: string): boolean => {
    if (!text.trim()) {
      setOldPasswordError('请输入当前密码');
      return false;
    }

    setOldPasswordError('');
    return true;
  };

  const validateNewPassword = (text: string): boolean => {
    if (!text.trim()) {
      setNewPasswordError('请输入新密码');
      return false;
    }

    if (text.length < 6) {
      setNewPasswordError('密码至少需要6个字符');
      return false;
    }

    if (text.length > 20) {
      setNewPasswordError('密码不能超过20个字符');
      return false;
    }

    setNewPasswordError('');
    return true;
  };

  const validateConfirmPassword = (text: string): boolean => {
    if (!text.trim()) {
      setConfirmPasswordError('请确认新密码');
      return false;
    }

    if (text !== newPassword) {
      setConfirmPasswordError('两次输入的密码不一致');
      return false;
    }

    setConfirmPasswordError('');
    return true;
  };

  const handleChangePassword = async (): Promise<void> => {
    if (
      !validateOldPassword(oldPassword) ||
      !validateNewPassword(newPassword) ||
      !validateConfirmPassword(confirmPassword)
    ) {
      return;
    }

    setIsLoading(true);

    try {
      await onChangePassword(username, oldPassword, newPassword);
      showError('修改成功', '密码已成功修改！(=✪ᆽ✪=)');
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '发生未知错误，请稍后重试';

      showError('修改失败', message);
      console.error('Change password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
      <View style={[styles.header, {backgroundColor: theme.primary}]}>
        <TouchableOpacity style={styles.closeButton} onPress={onBack}>
          <Text style={[styles.closeButtonText, {color: theme.surface}]}>×</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.surface}]}>
          修改密码
        </Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, {color: theme.text}]}
                placeholder="当前密码"
                value={oldPassword}
                onChangeText={text => {
                  setOldPassword(text);
                  validateOldPassword(text);
                }}
                secureTextEntry
                placeholderTextColor={theme.textLight}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {oldPasswordError ? (
              <Text style={[styles.errorText, {color: theme.error}]}>
                {oldPasswordError}
              </Text>
            ) : null}

            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, {color: theme.text}]}
                placeholder="新密码"
                value={newPassword}
                onChangeText={text => {
                  setNewPassword(text);
                  validateNewPassword(text);
                  validateConfirmPassword(confirmPassword);
                }}
                secureTextEntry
                placeholderTextColor={theme.textLight}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {newPasswordError ? (
              <Text style={[styles.errorText, {color: theme.error}]}>
                {newPasswordError}
              </Text>
            ) : null}

            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, {color: theme.text}]}
                placeholder="确认新密码"
                value={confirmPassword}
                onChangeText={text => {
                  setConfirmPassword(text);
                  validateConfirmPassword(text);
                }}
                secureTextEntry
                placeholderTextColor={theme.textLight}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {confirmPasswordError ? (
              <Text style={[styles.errorText, {color: theme.error}]}>
                {confirmPasswordError}
              </Text>
            ) : null}

            <Text style={[styles.passwordTip, {color: theme.primaryLight}]}>
              密码长度至少为6位，建议使用字母、数字和符号的组合
            </Text>

            <TouchableOpacity
              style={[
                styles.changeButton,
                {
                  backgroundColor: theme.primary,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleChangePassword}
              disabled={
                isLoading ||
                !oldPassword.trim() ||
                !newPassword.trim() ||
                !confirmPassword.trim()
              }>
              <Text style={[styles.changeButtonText, {color: theme.surface}]}>
                {isLoading ? '修改中...' : '确认修改'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={errorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: theme.surface}]}>
            <Text style={[styles.errorTitle, {color: theme.primaryDark}]}>
              {errorTitle}
            </Text>
            <Text style={[styles.errorMessage, {color: theme.text}]}>
              {errorMessage}
            </Text>
            <View style={styles.errorButtons}>
              <TouchableOpacity
                style={[styles.errorButton, {backgroundColor: theme.primary}]}
                onPress={() => setErrorModalVisible(false)}>
                <Text style={[styles.errorButtonText, {color: theme.surface}]}>
                  知道了
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  passwordTip: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 24,
    marginLeft: 4,
  },
  changeButton: {
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  changeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    maxHeight: '80%',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
  },
  errorButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  errorButton: {
    padding: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChangePasswordPage;
