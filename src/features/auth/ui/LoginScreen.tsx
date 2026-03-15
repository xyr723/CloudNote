import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {validatePassword, validateUsername} from '../model/authValidation';
import {AuthFeedbackModal} from './AuthFeedbackModal';
import {authScreenStyles} from './authScreenStyles';
import type {AuthFeedbackState, AuthTheme} from './types';

type LoginScreenProps = {
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: () => void;
  theme: AuthTheme;
};

const createHiddenFeedback = (): AuthFeedbackState => ({
  message: '',
  title: '',
  visible: false,
});

const updateFeedback = (
  setFeedback: React.Dispatch<React.SetStateAction<AuthFeedbackState>>,
  title: string,
  message: string,
): void => {
  setFeedback({
    title,
    message,
    visible: true,
  });
};

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onRegister,
  theme,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<AuthFeedbackState>(
    createHiddenFeedback(),
  );

  const applyUsername = (value: string): boolean => {
    const error = validateUsername(value);
    setUsernameError(error ?? '');
    return !error;
  };

  const applyPassword = (value: string): boolean => {
    const error = validatePassword(value);
    setPasswordError(error ?? '');
    return !error;
  };

  const handleLogin = async (): Promise<void> => {
    if (!applyUsername(username) || !applyPassword(password)) {
      return;
    }

    setIsLoading(true);

    try {
      await onLogin(username, password);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '发生未知错误，请稍后重试 (｡•́︿•̀｡)';

      updateFeedback(setFeedback, '登录失败', message);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[authScreenStyles.container, {backgroundColor: theme.background}]}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={authScreenStyles.keyboardAvoidingView}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View
              style={[styles.logoBackground, {backgroundColor: theme.primary}]}>
              <Text style={[styles.logoText, {color: theme.surface}]}>✎</Text>
            </View>
            <Text style={[styles.appName, {color: theme.primaryDark}]}>
              云笔记
            </Text>
            <Text style={[styles.welcomeText, {color: theme.primaryLight}]}>
              欢迎回来
            </Text>
          </View>

          <View style={authScreenStyles.inputContainer}>
            <View
              style={[
                authScreenStyles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <Text style={authScreenStyles.inputIcon}>👤</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={value => {
                  setUsername(value);
                  applyUsername(value);
                }}
                placeholder="用户名"
                placeholderTextColor={theme.textLight}
                style={[authScreenStyles.input, {color: theme.text}]}
                value={username}
              />
            </View>
            {usernameError ? (
              <Text style={[authScreenStyles.errorText, {color: theme.error}]}>
                {usernameError}
              </Text>
            ) : null}

            <View
              style={[
                authScreenStyles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <Text style={authScreenStyles.inputIcon}>🔒</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={value => {
                  setPassword(value);
                  applyPassword(value);
                }}
                placeholder="密码"
                placeholderTextColor={theme.textLight}
                secureTextEntry
                style={[authScreenStyles.input, {color: theme.text}]}
                value={password}
              />
            </View>
            {passwordError ? (
              <Text style={[authScreenStyles.errorText, {color: theme.error}]}>
                {passwordError}
              </Text>
            ) : null}

            <TouchableOpacity style={styles.forgotPassword}>
              <Text
                style={[styles.forgotPasswordText, {color: theme.primaryDark}]}>
                忘记密码？
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isLoading || !username.trim() || !password.trim()}
              onPress={handleLogin}
              style={[
                authScreenStyles.primaryButton,
                {backgroundColor: theme.primary},
                (isLoading || !username.trim() || !password.trim()) && {
                  backgroundColor: theme.primaryLight,
                },
              ]}>
              <Text
                style={[
                  authScreenStyles.primaryButtonText,
                  {color: theme.surface},
                ]}>
                {isLoading ? '正在登录...' : '登 录'}
              </Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, {color: theme.text}]}>
                还没有账号？
              </Text>
              <TouchableOpacity onPress={onRegister}>
                <Text style={[styles.registerLink, {color: theme.primary}]}>
                  立即注册
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <AuthFeedbackModal
        buttonLabel="知道了"
        message={feedback.message}
        onClose={() => setFeedback(createHiddenFeedback())}
        theme={theme}
        title={feedback.title}
        visible={feedback.visible}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  logoBackground: {
    alignItems: 'center',
    borderRadius: 40,
    elevation: 4,
    height: 80,
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: 80,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 40,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  registerText: {
    fontSize: 14,
  },
  welcomeText: {
    fontSize: 16,
  },
});

export default LoginScreen;
