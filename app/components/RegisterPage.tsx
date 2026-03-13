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

interface RegisterPageProps {
  onRegister: (username: string, password: string) => Promise<void>;
  onBack: () => void;
  theme: ReturnType<typeof generateThemeColors>;
}

const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegister,
  onBack,
  theme,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(3);

  const showError = (title: string, message: string): void => {
    setErrorTitle(title);
    setErrorMessage(message);
    setErrorModalVisible(true);

    if (title !== '注册成功') {
      return;
    }

    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  const validateUsername = (text: string): boolean => {
    if (!text.trim()) {
      setUsernameError('用户名不能为空');
      return false;
    }

    if (text.length < 3) {
      setUsernameError('用户名至少需要3个字符');
      return false;
    }

    if (text.length > 20) {
      setUsernameError('用户名不能超过20个字符');
      return false;
    }

    setUsernameError('');
    return true;
  };

  const validatePassword = (text: string): boolean => {
    if (!text.trim()) {
      setPasswordError('密码不能为空');
      return false;
    }

    if (text.length < 6) {
      setPasswordError('密码至少需要6个字符');
      return false;
    }

    if (text.length > 20) {
      setPasswordError('密码不能超过20个字符');
      return false;
    }

    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (text: string): boolean => {
    if (!text.trim()) {
      setConfirmPasswordError('请确认密码');
      return false;
    }

    if (text !== password) {
      setConfirmPasswordError('两次输入的密码不一致');
      return false;
    }

    setConfirmPasswordError('');
    return true;
  };

  const handleRegister = async (): Promise<void> => {
    if (
      !validateUsername(username) ||
      !validatePassword(password) ||
      !validateConfirmPassword(confirmPassword)
    ) {
      return;
    }

    setIsLoading(true);

    try {
      await onRegister(username, password);
      showError('注册成功', '您的账号已成功创建！(=✪ᆽ✪=)');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '发生未知错误，请稍后重试';

      showError('注册失败', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={[styles.backButtonText, {color: theme.primaryDark}]}>
              ← 返回登录
            </Text>
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={[styles.headerTitle, {color: theme.primaryDark}]}>
              创建账号
            </Text>
            <Text style={[styles.headerSubtitle, {color: theme.primaryLight}]}>
              开始你的云笔记之旅
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={[styles.input, {color: theme.text}]}
                placeholder="设置用户名"
                value={username}
                onChangeText={text => {
                  setUsername(text);
                  validateUsername(text);
                }}
                placeholderTextColor={theme.textLight}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {usernameError ? (
              <Text style={[styles.errorText, {color: theme.error}]}>
                {usernameError}
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
                placeholder="设置密码"
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  validatePassword(text);
                  validateConfirmPassword(confirmPassword);
                }}
                secureTextEntry
                placeholderTextColor={theme.textLight}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {passwordError ? (
              <Text style={[styles.errorText, {color: theme.error}]}>
                {passwordError}
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
                placeholder="确认密码"
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
                styles.registerButton,
                {
                  backgroundColor: theme.primary,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleRegister}
              disabled={
                isLoading ||
                !username.trim() ||
                !password.trim() ||
                !confirmPassword.trim()
              }>
              <Text style={[styles.registerButtonText, {color: theme.surface}]}>
                {isLoading ? '注册中...' : '注 册'}
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
                onPress={() => {
                  setErrorModalVisible(false);

                  if (errorTitle === '注册成功') {
                    onBack();
                  }
                }}>
                <Text style={[styles.errorButtonText, {color: theme.surface}]}>
                  {errorTitle === '注册成功' ? `返回登录 (${countdown}s)` : '好嘟'}
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
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backButton: {
    marginTop: 16,
    marginBottom: 32,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerContainer: {
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
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
  registerButton: {
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
  registerButtonText: {
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

export default RegisterPage;
