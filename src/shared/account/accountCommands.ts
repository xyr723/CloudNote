import type {UpdatePasswordInput} from '../../providers/auth/authProvider';
import {providerRegistry} from '../../providers/providerRegistry';

export async function saveUserAvatar(
  username: string,
  avatarUri: string,
): Promise<string> {
  return providerRegistry.getAuthProvider().updateAvatar(username, avatarUri);
}

export async function updateUserPassword(
  input: UpdatePasswordInput,
): Promise<void> {
  await providerRegistry.getAuthProvider().updatePassword(input);
}
