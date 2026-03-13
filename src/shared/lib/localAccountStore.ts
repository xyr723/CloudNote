import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import RNFetchBlob from 'react-native-blob-util';
import type {Account, AccountSession} from '../../entities/account/types';
import {
  copyManagedFile,
  fileExists,
  toPlatformFileUri,
} from './localFileStore';

type StoredAccount = Account & {
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
};

type SessionRecord = {
  username: string;
  lastLoginTime: string;
};

const ACCOUNT_KEY_PREFIX = 'account_';
const SESSION_KEY = 'user_login_state';

const getAccountKey = (username: string): string => {
  return `${ACCOUNT_KEY_PREFIX}${username}`;
};

const hashPassword = (password: string, salt: string): string => {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 1000,
  }).toString(CryptoJS.enc.Hex);
};

const toPublicAccount = (account: StoredAccount): Account => {
  return {
    id: account.id,
    username: account.username,
    avatar: account.avatar,
  };
};

const readStoredAccount = async (
  username: string,
): Promise<StoredAccount | null> => {
  const accountString = await AsyncStorage.getItem(getAccountKey(username));

  if (!accountString) {
    return null;
  }

  const parsedValue: unknown = JSON.parse(accountString);

  if (
    typeof parsedValue !== 'object' ||
    parsedValue === null ||
    Array.isArray(parsedValue)
  ) {
    return null;
  }

  const account = parsedValue as Record<string, unknown>;

  if (
    typeof account.id !== 'string' ||
    typeof account.username !== 'string' ||
    typeof account.passwordHash !== 'string' ||
    typeof account.passwordSalt !== 'string' ||
    typeof account.createdAt !== 'string' ||
    typeof account.updatedAt !== 'string'
  ) {
    return null;
  }

  return {
    id: account.id,
    username: account.username,
    avatar: typeof account.avatar === 'string' ? account.avatar : undefined,
    passwordHash: account.passwordHash,
    passwordSalt: account.passwordSalt,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
};

const writeStoredAccount = async (account: StoredAccount): Promise<void> => {
  await AsyncStorage.setItem(getAccountKey(account.username), JSON.stringify(account));
};

export const localAccountStore = {
  async createAccount(username: string, password: string): Promise<Account> {
    const existingAccount = await readStoredAccount(username);

    if (existingAccount) {
      throw new Error('该用户名已存在');
    }

    const passwordSalt = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
    const now = new Date().toISOString();
    const account: StoredAccount = {
      id: username,
      username,
      passwordHash: hashPassword(password, passwordSalt),
      passwordSalt,
      createdAt: now,
      updatedAt: now,
    };

    await writeStoredAccount(account);
    return toPublicAccount(account);
  },

  async verifyAccount(username: string, password: string): Promise<Account> {
    const account = await readStoredAccount(username);

    if (!account) {
      throw new Error('用户不存在');
    }

    const passwordHash = hashPassword(password, account.passwordSalt);

    if (passwordHash !== account.passwordHash) {
      throw new Error('密码错误');
    }

    await this.saveSession(username);
    const avatar = await this.getAvatar(username);
    return {
      ...toPublicAccount(account),
      avatar: avatar ?? undefined,
    };
  },

  async getAccount(username: string): Promise<Account | null> {
    const account = await readStoredAccount(username);

    if (!account) {
      return null;
    }

    const avatar = await this.getAvatar(username);
    return {
      ...toPublicAccount(account),
      avatar: avatar ?? undefined,
    };
  },

  async saveSession(username: string): Promise<void> {
    const sessionRecord: SessionRecord = {
      username,
      lastLoginTime: new Date().toISOString(),
    };

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionRecord));
  },

  async getSession(): Promise<AccountSession> {
    const sessionString = await AsyncStorage.getItem(SESSION_KEY);

    if (!sessionString) {
      return {
        user: null,
        isLoggedIn: false,
      };
    }

    const sessionValue: unknown = JSON.parse(sessionString);

    if (
      typeof sessionValue !== 'object' ||
      sessionValue === null ||
      Array.isArray(sessionValue)
    ) {
      return {
        user: null,
        isLoggedIn: false,
      };
    }

    const sessionRecord = sessionValue as Record<string, unknown>;
    const username =
      typeof sessionRecord.username === 'string' ? sessionRecord.username : null;

    if (!username) {
      return {
        user: null,
        isLoggedIn: false,
      };
    }

    const account = await this.getAccount(username);

    return {
      user: account,
      isLoggedIn: account !== null,
    };
  },

  async clearSession(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_KEY);
  },

  async updatePassword(
    username: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const account = await readStoredAccount(username);

    if (!account) {
      throw new Error('用户不存在');
    }

    const currentPasswordHash = hashPassword(
      currentPassword,
      account.passwordSalt,
    );

    if (currentPasswordHash !== account.passwordHash) {
      throw new Error('当前密码错误');
    }

    const nextPasswordSalt = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
    const updatedAccount: StoredAccount = {
      ...account,
      passwordSalt: nextPasswordSalt,
      passwordHash: hashPassword(newPassword, nextPasswordSalt),
      updatedAt: new Date().toISOString(),
    };

    await writeStoredAccount(updatedAccount);
  },

  async saveAvatar(username: string, avatarUri: string): Promise<string> {
    const account = await readStoredAccount(username);

    if (!account) {
      throw new Error('用户不存在');
    }

    const fileExtension = avatarUri.split('.').pop()?.split('?')[0] || 'jpg';
    const targetPath = `${RNFetchBlob.fs.dirs.DocumentDir}/avatars/${username}_${Date.now()}.${fileExtension}`;
    const avatarPath = await copyManagedFile(avatarUri, targetPath);
    const updatedAccount: StoredAccount = {
      ...account,
      avatar: avatarPath,
      updatedAt: new Date().toISOString(),
    };

    await writeStoredAccount(updatedAccount);
    return avatarPath;
  },

  async getAvatar(username: string): Promise<string | null> {
    const account = await readStoredAccount(username);

    if (!account?.avatar) {
      return null;
    }

    if (/^https?:\/\//.test(account.avatar)) {
      return account.avatar;
    }

    const exists = await fileExists(account.avatar);
    return exists ? toPlatformFileUri(account.avatar) : null;
  },
};
