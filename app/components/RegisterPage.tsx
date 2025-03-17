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
  Alert,
} from 'react-native';

interface RegisterPageProps {
  onRegister: (username: string, password: string) => void;
  onBack: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({onRegister, onBack}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = () => {
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('提示', '请填写所有字段');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      Alert.alert('提示', '密码长度至少为6位');
      return;
    }

    onRegister(username, password);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#C5A3E6" barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← 返回登录</Text>
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>创建账号</Text>
            <Text style={styles.headerSubtitle}>开始你的云笔记之旅</Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="设置用户名"
                value={username}
                onChangeText={setUsername}
                placeholderTextColor="#A98DB8"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="设置密码"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#A98DB8"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="确认密码"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor="#A98DB8"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.passwordTip}>
              密码长度至少为6位，建议使用字母、数字和符号的组合
            </Text>

            <TouchableOpacity
              style={[
                styles.registerButton,
                (!username.trim() ||
                  !password.trim() ||
                  !confirmPassword.trim()) &&
                  styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={
                !username.trim() || !password.trim() || !confirmPassword.trim()
              }>
              <Text style={styles.registerButtonText}>注 册</Text>
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
    backgroundColor: '#FDFAFF',
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
    color: '#A98DB8',
    fontSize: 16,
    fontWeight: '500',
  },
  headerContainer: {
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#A98DB8',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#B088C9',
  },
  inputContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EFE6F7',
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
    color: '#666666',
  },
  passwordTip: {
    color: '#B088C9',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 24,
    marginLeft: 4,
  },
  registerButton: {
    backgroundColor: '#C5A3E6',
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
  registerButtonDisabled: {
    backgroundColor: '#E0D1F0',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RegisterPage; 