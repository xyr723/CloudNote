import React, {useEffect, useState} from 'react';
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
import {
  validateConfirmPassword,
  validatePassword,
  validateUsername,
} from '../model/authValidation';
import {AuthFeedbackModal} from './AuthFeedbackModal';
import {authScreenStyles} from './authScreenStyles';
import type {AuthFeedbackState, AuthTheme} from './types';

type RegisterScreenProps = {
  onBack: () => void;
  onRegister: (username: string, password: string) => Promise<void>;
  theme: AuthTheme;
};

const createHiddenFeedback = (): AuthFeedbackState => ({
  message: '',
  title: '',
  visible: false,
});

const SUCCESS_TITLE = '注册成功';

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onBack,
  onRegister,
  theme,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [feedback, setFeedback] = useState<AuthFeedbackState>(
    createHiddenFeedback(),
  );

  useEffect(() => {
    if (!feedback.visible || feedback.title !== SUCCESS_TITLE) {
      return;
    }

    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(previousCount => Math.max(previousCount - 1, 0));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [feedback.title, feedback.visible]);

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

  const applyConfirmPassword = (
    nextPassword: string,
    nextConfirmPassword: string,
  ): boolean => {
    const error = validateConfirmPassword(nextPassword, nextConfirmPassword);
    setConfirmPasswordError(error ?? '');
    return !error;
  };

  const handleRegister = async (): Promise<void> => {
    if (
      !applyUsername(username) ||
      !applyPassword(password) ||
      !applyConfirmPassword(password, confirmPassword)
    ) {
      return;
    }

    setIsLoading(true);

    try {
      await onRegister(username, password);
      setFeedback({
        message: '您的账号已成功创建！(=✪ᆽ✪=)',
        title: SUCCESS_TITLE,
        visible: true,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '发生未知错误，请稍后重试';

      setFeedback({
        message,
        title: '注册失败',
        visible: true,
      });
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
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
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
                placeholder="设置用户名"
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
                  applyConfirmPassword(value, confirmPassword);
                }}
                placeholder="设置密码"
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
                  setConfirmPassword(value);
                  applyConfirmPassword(password, value);
                }}
                placeholder="确认密码"
                placeholderTextColor={theme.textLight}
                secureTextEntry
                style={[authScreenStyles.input, {color: theme.text}]}
                value={confirmPassword}
              />
            </View>
            {confirmPasswordError ? (
              <Text style={[authScreenStyles.errorText, {color: theme.error}]}>
                {confirmPasswordError}
              </Text>
            ) : null}

            <Text style={[authScreenStyles.passwordTip, {color: theme.primaryLight}]}>
              密码长度至少为6位，建议使用字母、数字和符号的组合
            </Text>

            <TouchableOpacity
              disabled={
                isLoading ||
                !username.trim() ||
                !password.trim() ||
                !confirmPassword.trim()
              }
              onPress={handleRegister}
              style={[
                authScreenStyles.primaryButton,
                {backgroundColor: theme.primary},
                isLoading ? styles.primaryButtonLoading : null,
              ]}>
              <Text
                style={[
                  authScreenStyles.primaryButtonText,
                  {color: theme.surface},
                ]}>
                {isLoading ? '注册中...' : '注 册'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <AuthFeedbackModal
        buttonLabel={
          feedback.title === SUCCESS_TITLE ? `返回登录 (${countdown}s)` : '好嘟'
        }
        message={feedback.message}
        onClose={() => {
          setFeedback(createHiddenFeedback());

          if (feedback.title === SUCCESS_TITLE) {
            onBack();
          }
        }}
        theme={theme}
        title={feedback.title}
        visible={feedback.visible}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    marginBottom: 32,
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    marginBottom: 40,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  primaryButtonLoading: {
    opacity: 0.7,
  },
});

export default RegisterScreen;
