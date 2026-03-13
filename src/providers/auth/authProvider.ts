import type {Account, AccountSession} from '../../entities/account/types';

export interface SignInInput {
  username: string;
  password: string;
}

export interface SignUpInput {
  username: string;
  password: string;
}

export interface UpdatePasswordInput {
  username: string;
  currentPassword: string;
  newPassword: string;
}

export interface AuthProvider {
  getSession(): Promise<AccountSession>;
  signIn(input: SignInInput): Promise<Account>;
  signUp(input: SignUpInput): Promise<Account>;
  signOut(): Promise<void>;
  updatePassword(input: UpdatePasswordInput): Promise<void>;
  updateAvatar(username: string, avatarUri: string): Promise<string>;
  getAvatar(username: string): Promise<string | null>;
}
