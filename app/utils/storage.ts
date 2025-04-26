import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFetchBlob from 'react-native-blob-util';
import { Platform } from 'react-native';
import { OSSClient } from './ossUpload';
import { Buffer } from 'buffer';

// 添加 Base64 编码/解码函数
const btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
const atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  images?: string[];
  fontSize?: number;
  textSegments?: { text: string; fontSize: number }[];
}

interface UserLoginState {
  username: string;
  lastLoginTime: string;
}

export class NoteStorage {
  private static readonly LOGIN_STATE_KEY = 'user_login_state';

  private static getNotesKey(username: string): string {
    return `notes_${username}`;
  }

  private static getImagePath(username: string, noteId: string, imageIndex: number): string {
    return `${RNFetchBlob.fs.dirs.DocumentDir}/images/${username}/${noteId}_${imageIndex}.jpg`;
  }

  private static getAvatarKey(username: string): string {
    return `user-avatar/${username}.jpg`;
  }

  private static async uploadNotesToOSS(username: string, notes: Note[]): Promise<void> {
    const client = new OSSClient({
      accessKeyId: 'LTAI5tP7uEC3XekfkG4nRp5x',
      accessKeySecret: 'yLvMJLA9MrfJy4nA0oXwuZSXKBaX2o',
      bucket: 'native-123',
      region: 'cn-beijing',
    });

    try {
      const objectKey = `user-notes/${username}.json`;
      const localPath = `${RNFetchBlob.fs.dirs.DocumentDir}/${username}_notes.json`;

      // 将笔记数据转换为 JSON 字符串，并确保使用 UTF-8 编码
      const notesString = JSON.stringify(notes, (key, value) => {
        if (typeof value === 'string') {
          return btoa(unescape(encodeURIComponent(value)));
        }
        return value;
      });
      
      // 使用 UTF-8 编码保存文件
      await RNFetchBlob.fs.writeFile(localPath, notesString, 'utf8');
      
      const filePath = Platform.OS === 'android' ? `file://${localPath}` : localPath;
      await client.put(objectKey, filePath);
      
      console.log('✅ 笔记同步到云端成功');
    } catch (error) {
      console.error('❌ 笔记同步到云端失败:', error);
      throw error;
    }
  }

  private static async downloadNotesFromOSS(username: string): Promise<Note[] | null> {
    try {
      const url = `https://native-123.oss-cn-beijing.aliyuncs.com/user-notes/${username}.json`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`下载失败: ${response.status}`);
      }
      
      // 获取响应文本并确保使用 UTF-8 编码解析
      const text = await response.text();
      const notes = JSON.parse(text, (key, value) => {
        if (typeof value === 'string') {
          try {
            return decodeURIComponent(escape(atob(value)));
          } catch (e) {
            return value;
          }
        }
        return value;
      });
      
      return notes.map((note: any) => ({
        ...note,
        title: note.title || '',
        content: note.content || '',
        timestamp: new Date(note.timestamp)
      }));
    } catch (error) {
      console.error('❌ 从云端下载笔记失败:', error);
      return null;
    }
  }

  static async saveImage(username: string, noteId: string, imageIndex: number, imageUri: string): Promise<string> {
    try {
      const imagePath = this.getImagePath(username, noteId, imageIndex);
      
      // 确保目录存在，如果已存在则忽略错误
      const dir = `${RNFetchBlob.fs.dirs.DocumentDir}/images/${username}`;
      try {
        await RNFetchBlob.fs.mkdir(dir);
      } catch (error: any) {
        // 如果文件夹已存在，忽略错误
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
      
      // 检查源文件是否存在
      const sourceExists = await RNFetchBlob.fs.exists(imageUri);
      if (!sourceExists) {
        console.log('源图片文件不存在，跳过保存:', imageUri);
        return imageUri; // 返回原始路径
      }
      
      // 复制图片到本地存储
      await RNFetchBlob.fs.cp(imageUri, imagePath);
      
      return imagePath;
    } catch (error) {
      console.error('保存图片失败:', error);
      throw error;
    }
  }

  static async loadImage(username: string, noteId: string, imageIndex: number): Promise<string | null> {
    try {
      const imagePath = this.getImagePath(username, noteId, imageIndex);
      
      // 检查文件是否存在
      const exists = await RNFetchBlob.fs.exists(imagePath);
      if (!exists) {
        return null;
      }
      
      return Platform.OS === 'android' ? `file://${imagePath}` : imagePath;
    } catch (error) {
      console.error('加载图片失败:', error);
      return null;
    }
  }

  static async saveNotes(username: string, notes: Note[]): Promise<void> {
    try {
      const key = this.getNotesKey(username);
      // 确保目录存在，如果已存在则忽略错误
      const dir = `${RNFetchBlob.fs.dirs.DocumentDir}/images/${username}`;
      try {
        await RNFetchBlob.fs.mkdir(dir);
      } catch (error: any) {
        // 如果文件夹已存在，忽略错误
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
      
      // 保存图片并更新笔记中的图片引用
      for (const note of notes) {
        if (note.images) {
          const savedImages = await Promise.all(
            note.images.map(async (imageUri, index) => {
              return await this.saveImage(username, note.id, index, imageUri);
            })
          );
          note.images = savedImages;
        }
      }
      
      // 确保所有文本内容都使用 UTF-8 编码
      const notesString = JSON.stringify(notes, (key, value) => {
        if (typeof value === 'string') {
          return btoa(unescape(encodeURIComponent(value)));
        }
        return value;
      });
      
      console.log(`正在保存笔记，用户: ${username}, 笔记数量: ${notes.length}`);
      
      // 先保存到本地，使用 UTF-8 编码
      await AsyncStorage.setItem(key, notesString);
      console.log(`笔记保存到本地成功，用户: ${username}`);
      
      // 尝试同步到云端，如果失败则记录到待同步队列
      try {
        await this.uploadNotesToOSS(username, notes);
        console.log(`笔记同步到云端成功，用户: ${username}`);
      } catch (error) {
        console.warn('笔记同步到云端失败，将在下次联网时重试:', error);
        // 将笔记标记为需要同步
        await AsyncStorage.setItem(`${key}_needs_sync`, 'true');
      }
    } catch (error) {
      console.error('保存笔记失败:', error);
      throw error;
    }
  }

  // 添加同步方法，用于在应用启动或网络恢复时调用
  static async syncNotes(username: string): Promise<void> {
    try {
      const key = this.getNotesKey(username);
      const needsSync = await AsyncStorage.getItem(`${key}_needs_sync`);
      
      if (needsSync === 'true') {
        console.log(`检测到未同步的笔记，开始同步，用户: ${username}`);
        const notesString = await AsyncStorage.getItem(key);
        if (notesString) {
          const notes = JSON.parse(notesString);
          await this.uploadNotesToOSS(username, notes);
          console.log(`笔记同步成功，用户: ${username}`);
          // 清除同步标记
          await AsyncStorage.removeItem(`${key}_needs_sync`);
        }
      }
    } catch (error) {
      console.error('同步笔记失败:', error);
    }
  }

  static async loadNotes(username: string): Promise<Note[]> {
    try {
      // 首先尝试从云端加载
      const cloudNotes = await this.downloadNotesFromOSS(username);
      if (cloudNotes) {
        console.log('从云端加载笔记成功');
        return cloudNotes;
      }

      // 如果云端没有，则从本地加载
      const key = this.getNotesKey(username);
      console.log(`正在加载本地笔记，用户: ${username}`);
      const notesString = await AsyncStorage.getItem(key);
      if (!notesString) {
        console.log(`未找到笔记，用户: ${username}`);
        return [];
      }
      
      // 解析 JSON 并确保使用 UTF-8 编码
      const notes = JSON.parse(notesString, (key, value) => {
        if (typeof value === 'string') {
          try {
            return decodeURIComponent(escape(atob(value)));
          } catch (e) {
            return value;
          }
        }
        return value;
      });
      
      // 加载图片并更新笔记中的图片引用
      for (const note of notes) {
        if (note.images) {
          const loadedImages = await Promise.all(
            note.images.map(async (_: string, index: number) => {
              return await this.loadImage(username, note.id, index);
            })
          );
          note.images = loadedImages.filter(Boolean);
        }
      }
      
      console.log(`成功加载笔记，用户: ${username}, 笔记数量: ${notes.length}`);
      // 将时间字符串转换回 Date 对象，并确保文本内容使用 UTF-8 编码
      return notes.map((note: any) => ({
        ...note,
        title: note.title || '',
        content: note.content || '',
        timestamp: new Date(note.timestamp)
      }));
    } catch (error) {
      console.error('加载笔记失败:', error);
      return [];
    }
  }

  static async clearNotes(username: string): Promise<void> {
    try {
      const key = this.getNotesKey(username);
      console.log(`正在清除笔记，用户: ${username}`);
      await AsyncStorage.removeItem(key);
      
      // 清除图片目录
      const imageDir = `${RNFetchBlob.fs.dirs.DocumentDir}/images/${username}`;
      await RNFetchBlob.fs.unlink(imageDir);
      
      console.log(`笔记清除成功，用户: ${username}`);
    } catch (error) {
      console.error('清除笔记失败:', error);
      throw error;
    }
  }

  static async saveImageToLocal(imageUri: string, imageIndex: number): Promise<string> {
    try {
      const imagePath = this.getImagePath('', '', imageIndex);
      
      // 确保目录存在，如果已存在则忽略错误
      const dir = `${RNFetchBlob.fs.dirs.DocumentDir}/images`;
      try {
        await RNFetchBlob.fs.mkdir(dir);
      } catch (error: any) {
        // 如果文件夹已存在，忽略错误
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
      
      // 复制图片到本地存储
      await RNFetchBlob.fs.cp(imageUri, imagePath);
      
      return Platform.OS === 'android' ? `file://${imagePath}` : imagePath;
    } catch (error) {
      console.error('保存图片到本地失败:', error);
      throw error;
    }
  }

  // 保存登录状态
  static async saveLoginState(username: string): Promise<void> {
    try {
      const loginState: UserLoginState = {
        username,
        lastLoginTime: new Date().toISOString()
      };
      await AsyncStorage.setItem(this.LOGIN_STATE_KEY, JSON.stringify(loginState));
      console.log('✅ 登录状态保存成功');
    } catch (error) {
      console.error('❌ 保存登录状态失败:', error);
      throw error;
    }
  }

  // 获取登录状态
  static async getLoginState(): Promise<UserLoginState | null> {
    try {
      const loginStateString = await AsyncStorage.getItem(this.LOGIN_STATE_KEY);
      if (!loginStateString) {
        return null;
      }
      return JSON.parse(loginStateString);
    } catch (error) {
      console.error('❌ 获取登录状态失败:', error);
      return null;
    }
  }

  // 清除登录状态
  static async clearLoginState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.LOGIN_STATE_KEY);
      console.log('✅ 登录状态清除成功');
    } catch (error) {
      console.error('❌ 清除登录状态失败:', error);
      throw error;
    }
  }

  static async clearAvatar(username: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`avatar_${username}`);
      console.log('✅ 头像缓存清除成功');
    } catch (error) {
      console.error('❌ 清除头像缓存失败:', error);
      throw error;
    }
  }

  private static async uploadAvatarToOSS(username: string, avatarUri: string): Promise<string> {
    const client = new OSSClient({
      accessKeyId: 'LTAI5tP7uEC3XekfkG4nRp5x',
      accessKeySecret: 'yLvMJLA9MrfJy4nA0oXwuZSXKBaX2o',
      bucket: 'native-123',
      region: 'cn-beijing',
    });

    try {
      const objectKey = this.getAvatarKey(username);
      const localPath = `${RNFetchBlob.fs.dirs.DocumentDir}/${username}_avatar.jpg`;

      console.log('开始复制图片到本地:', avatarUri, '->', localPath);
      // 复制图片到本地临时文件
      await RNFetchBlob.fs.cp(avatarUri, localPath);
      console.log('图片复制到本地成功');
      
      const filePath = Platform.OS === 'android' ? `file://${localPath}` : localPath;
      console.log('开始上传图片到 OSS:', filePath);
      await client.put(objectKey, filePath);
      console.log('图片上传到 OSS 成功');
      
      // 获取头像的 OSS URL，添加时间戳参数避免缓存
      const timestamp = new Date().getTime();
      const avatarUrl = `https://native-123.oss-cn-beijing.aliyuncs.com/${objectKey}?t=${timestamp}`;
      console.log('生成的头像 URL:', avatarUrl);
      
      // 验证 URL 是否可以访问
      const response = await fetch(avatarUrl);
      if (!response.ok) {
        throw new Error(`头像 URL 无法访问: ${response.status}`);
      }
      console.log('头像 URL 验证成功');
      
      return avatarUrl;
    } catch (error) {
      console.error('❌ 头像上传到云端失败:', error);
      throw error;
    }
  }

  static async saveAvatar(username: string, avatarUri: string): Promise<string> {
    try {
      // 上传到 OSS
      const avatarUrl = await this.uploadAvatarToOSS(username, avatarUri);
      
      // 保存头像 URL 到本地存储
      await AsyncStorage.setItem(`avatar_${username}`, avatarUrl);
      
      return avatarUrl;
    } catch (error) {
      console.error('保存头像失败:', error);
      throw error;
    }
  }

  static async getAvatar(username: string): Promise<string | null> {
    try {
      // 先从本地获取头像 URL
      const avatarUrl = await AsyncStorage.getItem(`avatar_${username}`);
      if (avatarUrl) {
        // 添加时间戳参数避免缓存
        const timestamp = new Date().getTime();
        return `${avatarUrl.split('?')[0]}?t=${timestamp}`;
      }

      // 如果本地没有，尝试从 OSS 获取
      const objectKey = this.getAvatarKey(username);
      const url = `https://native-123.oss-cn-beijing.aliyuncs.com/${objectKey}`;
      
      // 检查头像是否存在
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        // 保存到本地存储
        const timestamp = new Date().getTime();
        const avatarUrl = `${url}?t=${timestamp}`;
        await AsyncStorage.setItem(`avatar_${username}`, url);
        return avatarUrl;
      }
      
      return null;
    } catch (error) {
      console.error('获取头像失败:', error);
      return null;
    }
  }
} 