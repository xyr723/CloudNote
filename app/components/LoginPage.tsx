import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import axios from 'axios';
import { generateThemeColors } from '../theme/colors';

interface LoginPageProps {
  onLogin: (username: string, password: string) => void;
  onRegister: () => void;
  theme: ReturnType<typeof generateThemeColors>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin: onLoginProp, onRegister, theme }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // 加载状态

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

  const handleLogin = async () => {
    if (!validateUsername(username) || !validatePassword(password)) {
      return;
    }

    setIsLoading(true);

    try {
      const url = `https://native-123.oss-cn-beijing.aliyuncs.com/user-data/${username}.json`;
      const res = await axios.get(url, {
        timeout: 5000,
      });
      const userData = res.data;

      if (userData.password === password) {
        console.log('登录成功');
        onLoginProp(username, password);
      } else {
        Alert.alert('登录失败', '密码错误，请重试');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          Alert.alert('登录失败', '网络请求超时，请检查网络连接');
        } else if (error.response?.status === 404) {
          Alert.alert('登录失败', '用户不存在');
        } else {
          Alert.alert('登录失败', '网络连接异常，请稍后重试');
        }
      } else {
        Alert.alert('登录失败', '发生未知错误，请稍后重试');
      }
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoBackground, { backgroundColor: theme.primary }]}>
              <Text style={[styles.logoText, { color: theme.surface }]}>✎</Text>
            </View>
            <Text style={[styles.appName, { color: theme.primaryDark }]}>云笔记</Text>
            <Text style={[styles.welcomeText, { color: theme.primaryLight }]}>欢迎回来</Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="用户名"
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
            {usernameError ? <Text style={[styles.errorText, { color: theme.error }]}>{usernameError}</Text> : null}

            <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="密码"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  validatePassword(text);
                }}
                secureTextEntry
                placeholderTextColor={theme.textLight}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {passwordError ? <Text style={[styles.errorText, { color: theme.error }]}>{passwordError}</Text> : null}

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: theme.primaryDark }]}>忘记密码？</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.loginButton,
                { backgroundColor: theme.primary },
                (!username.trim() || !password.trim() || isLoading) && { backgroundColor: theme.primaryLight },
              ]}
              onPress={handleLogin}
              disabled={isLoading || !username.trim() || !password.trim()}
            >
              <Text style={[styles.loginButtonText, { color: theme.surface }]}>
                {isLoading ? '正在登录...' : '登 录'}
              </Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, { color: theme.text }]}>还没有账号？</Text>
              <TouchableOpacity onPress={onRegister}>
                <Text style={[styles.registerLink, { color: theme.primary }]}>立即注册</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoText: {
    fontSize: 40,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
  },
  inputContainer: {
    width: '100%',
    paddingHorizontal: 20,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginButton: {
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
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
  },
});

export default LoginPage;
