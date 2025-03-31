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
} from 'react-native';
import { generateThemeColors } from '../theme/colors';

interface RegisterPageProps {
  onRegister: (username: string, password: string) => void;
  onBack: () => void;
  theme: ReturnType<typeof generateThemeColors>;
}

const RegisterPage: React.FC<RegisterPageProps> = ({onRegister, onBack, theme}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateUsername = (text: string) => {
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

  const validatePassword = (text: string) => {
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

  const validateConfirmPassword = (text: string) => {
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

  const handleRegister = () => {
    if (!validateUsername(username) || 
        !validatePassword(password) || 
        !validateConfirmPassword(confirmPassword)) {
      return;
    }
    onRegister(username, password);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={[styles.backButtonText, { color: theme.primaryDark }]}>← 返回登录</Text>
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={[styles.headerTitle, { color: theme.primaryDark }]}>创建账号</Text>
            <Text style={[styles.headerSubtitle, { color: theme.primaryLight }]}>开始你的云笔记之旅</Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { 
              backgroundColor: theme.surface,
              borderColor: theme.border 
            }]}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="设置用户名"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  validateUsername(text);
                }}
                placeholderTextColor={theme.textLight}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {usernameError ? (
              <Text style={[styles.errorText, { color: theme.error }]}>{usernameError}</Text>
            ) : null}

            <View style={[styles.inputWrapper, { 
              backgroundColor: theme.surface,
              borderColor: theme.border 
            }]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="设置密码"
                value={password}
                onChangeText={(text) => {
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
              <Text style={[styles.errorText, { color: theme.error }]}>{passwordError}</Text>
            ) : null}

            <View style={[styles.inputWrapper, { 
              backgroundColor: theme.surface,
              borderColor: theme.border 
            }]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="确认密码"
                value={confirmPassword}
                onChangeText={(text) => {
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
              <Text style={[styles.errorText, { color: theme.error }]}>{confirmPasswordError}</Text>
            ) : null}

            <Text style={[styles.passwordTip, { color: theme.primaryLight }]}>
              密码长度至少为6位，建议使用字母、数字和符号的组合
            </Text>

            <TouchableOpacity
              style={[
                styles.registerButton,
                { backgroundColor: theme.primary },
                (!username.trim() ||
                  !password.trim() ||
                  !confirmPassword.trim()) &&
                  { backgroundColor: theme.primaryLight }
              ]}
              onPress={handleRegister}
              disabled={
                !username.trim() || !password.trim() || !confirmPassword.trim()
              }>
              <Text style={[styles.registerButtonText, { color: theme.surface }]}>注 册</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
});

export default RegisterPage; 