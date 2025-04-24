import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFetchBlob from 'react-native-blob-util';
import { Platform } from 'react-native';
import { OSSClient } from './ossUpload';

interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  images?: string[];
  fontSize?: number;
  textSegments?: { text: string; fontSize: number }[];
}

export class NoteStorage {
  private static getNotesKey(username: string): string {
    return `notes_${username}`;
  }

  private static getImagePath(username: string, noteId: string, imageIndex: number): string {
    return `${RNFetchBlob.fs.dirs.DocumentDir}/images/${username}/${noteId}_${imageIndex}.jpg`;
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

      // 将笔记数据转换为 JSON 字符串
      const notesString = JSON.stringify(notes);
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
      
      const notes = await response.json();
      return notes.map((note: any) => ({
        ...note,
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
      const notesString = JSON.stringify(notes);
      console.log(`正在保存笔记，用户: ${username}, 笔记数量: ${notes.length}`);
      
      // 先保存到本地
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
      const notes = JSON.parse(notesString);
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
      // 将时间字符串转换回 Date 对象
      return notes.map((note: any) => ({
        ...note,
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
} 