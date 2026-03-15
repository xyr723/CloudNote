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
import {
  validateConfirmPassword,
  validatePassword,
} from '../../../entities/account/validation';
import {authScreenStyles} from '../../auth/ui/authScreenStyles';
import {FeedbackModal} from '../../../shared/ui/FeedbackModal';
import {profileScaffoldStyles} from './profileScaffoldStyles';
import type {AuthTheme} from '../../auth/ui/types';

type ChangePasswordScreenProps = {
  onBack: () => void;
  onChangePassword: (
    username: string,
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  theme: AuthTheme;
  username: string;
};

type FeedbackState = {
  message: string;
  title: string;
  visible: boolean;
};

const createHiddenFeedback = (): FeedbackState => ({
  message: '',
  title: '',
  visible: false,
});

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({
  onBack,
  onChangePassword,
  theme,
  username,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPasswordError, setOldPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(
    createHiddenFeedback(),
  );

  const applyOldPassword = (value: string): boolean => {
    const error = value.trim() ? null : '请输入当前密码';
    setOldPasswordError(error ?? '');
    return !error;
  };

  const applyNewPassword = (value: string): boolean => {
    const error = validatePassword(value);
    setNewPasswordError(error ?? '');
    return !error;
  };

  const applyConfirmPassword = (
    nextPassword: string,
    nextConfirmPassword: string,
  ): boolean => {
    const error = validateConfirmPassword(
      nextPassword,
      nextConfirmPassword,
      '请确认新密码',
    );
    setConfirmPasswordError(error ?? '');
    return !error;
  };

  const handleChangePassword = async (): Promise<void> => {
    if (
      !applyOldPassword(oldPassword) ||
      !applyNewPassword(newPassword) ||
      !applyConfirmPassword(newPassword, confirmPassword)
    ) {
      return;
    }

    setIsLoading(true);

    try {
      await onChangePassword(username, oldPassword, newPassword);
      setFeedback({
        message: '密码已成功修改！(=✪ᆽ✪=)',
        title: '修改成功',
        visible: true,
      });

      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '发生未知错误，请稍后重试';

      setFeedback({
        message,
        title: '修改失败',
        visible: true,
      });
      console.error('Change password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        profileScaffoldStyles.container,
        {backgroundColor: theme.background},
      ]}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
      <View style={[profileScaffoldStyles.header, {backgroundColor: theme.primary}]}>
        <TouchableOpacity onPress={onBack} style={profileScaffoldStyles.closeButton}>
          <Text
            style={[
              profileScaffoldStyles.closeButtonText,
              {color: theme.surface},
            ]}>
            ×
          </Text>
        </TouchableOpacity>
        <Text style={[profileScaffoldStyles.headerTitle, {color: theme.surface}]}>
          修改密码
        </Text>
        <View style={profileScaffoldStyles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={authScreenStyles.keyboardAvoidingView}>
        <View style={styles.content}>
          <View style={authScreenStyles.inputContainer}>
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
                  setOldPassword(value);
                  applyOldPassword(value);
                }}
                placeholder="当前密码"
                placeholderTextColor={theme.textLight}
                secureTextEntry
                style={[authScreenStyles.input, {color: theme.text}]}
                value={oldPassword}
              />
            </View>
            {oldPasswordError ? (
              <Text style={[authScreenStyles.errorText, {color: theme.error}]}>
                {oldPasswordError}
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
                  setNewPassword(value);
                  applyNewPassword(value);
                  applyConfirmPassword(value, confirmPassword);
                }}
                placeholder="新密码"
                placeholderTextColor={theme.textLight}
                secureTextEntry
                style={[authScreenStyles.input, {color: theme.text}]}
                value={newPassword}
              />
            </View>
            {newPasswordError ? (
              <Text style={[authScreenStyles.errorText, {color: theme.error}]}>
                {newPasswordError}
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
                  applyConfirmPassword(newPassword, value);
                }}
                placeholder="确认新密码"
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
                !oldPassword.trim() ||
                !newPassword.trim() ||
                !confirmPassword.trim()
              }
              onPress={handleChangePassword}
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
                {isLoading ? '修改中...' : '确认修改'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <FeedbackModal
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
  content: {
    flex: 1,
    padding: 20,
  },
  primaryButtonLoading: {
    opacity: 0.7,
  },
});

export default ChangePasswordScreen;
