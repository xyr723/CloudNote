import type {Account, AccountSession} from '../../../entities/account/types';
import {localAccountStore} from '../../../shared/lib/localAccountStore';
import type {
  AuthProvider,
  SignInInput,
  SignUpInput,
  UpdatePasswordInput,
} from '../authProvider';

export class LocalAuthProvider implements AuthProvider {
  async getSession(): Promise<AccountSession> {
    return localAccountStore.getSession();
  }

  async signIn(input: SignInInput): Promise<Account> {
    return localAccountStore.verifyAccount(input.username, input.password);
  }

  async signUp(input: SignUpInput): Promise<Account> {
    return localAccountStore.createAccount(input.username, input.password);
  }

  async signOut(): Promise<void> {
    await localAccountStore.clearSession();
  }

  async updatePassword(input: UpdatePasswordInput): Promise<void> {
    await localAccountStore.updatePassword(
      input.username,
      input.currentPassword,
      input.newPassword,
    );
  }

  async updateAvatar(username: string, avatarUri: string): Promise<string> {
    return localAccountStore.saveAvatar(username, avatarUri);
  }

  async getAvatar(username: string): Promise<string | null> {
    return localAccountStore.getAvatar(username);
  }
}
