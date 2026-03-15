import {
  validateConfirmPassword,
  validatePassword,
  validateUsername,
} from './authValidation';

describe('authValidation', () => {
  test('rejects blank usernames', () => {
    expect(validateUsername('')).toBe('用户名不能为空');
  });

  test('rejects short passwords', () => {
    expect(validatePassword('123')).toBe('密码至少需要6个字符');
  });

  test('rejects mismatched confirm passwords', () => {
    expect(validateConfirmPassword('123456', '654321')).toBe(
      '两次输入的密码不一致',
    );
  });

  test('accepts valid credentials', () => {
    expect(validateUsername('alice')).toBeNull();
    expect(validatePassword('123456')).toBeNull();
    expect(validateConfirmPassword('123456', '123456')).toBeNull();
  });
});
