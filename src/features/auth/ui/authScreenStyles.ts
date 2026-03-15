import {StyleSheet} from 'react-native';

export const authScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: -12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: 50,
  },
  inputContainer: {
    width: '100%',
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  inputWrapper: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  passwordTip: {
    fontSize: 12,
    marginBottom: 24,
    marginLeft: 4,
    marginTop: -8,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    elevation: 2,
    height: 50,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
