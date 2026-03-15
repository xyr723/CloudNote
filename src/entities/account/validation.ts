const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 20;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 20;

export function validateUsername(username: string): string | null {
  if (!username.trim()) {
    return '用户名不能为空';
  }

  if (username.length < MIN_USERNAME_LENGTH) {
    return '用户名至少需要3个字符';
  }

  if (username.length > MAX_USERNAME_LENGTH) {
    return '用户名不能超过20个字符';
  }

  return null;
}

export function validatePassword(password: string): string | null {
  if (!password.trim()) {
    return '密码不能为空';
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return '密码至少需要6个字符';
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return '密码不能超过20个字符';
  }

  return null;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
  emptyMessage = '请确认密码',
): string | null {
  if (!confirmPassword.trim()) {
    return emptyMessage;
  }

  if (password !== confirmPassword) {
    return '两次输入的密码不一致';
  }

  return null;
}
