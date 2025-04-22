import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFetchBlob from 'react-native-blob-util';
import { Platform } from 'react-native';

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
      await AsyncStorage.setItem(key, notesString);
      console.log(`笔记保存成功，用户: ${username}`);
    } catch (error) {
      console.error('保存笔记失败:', error);
      throw error;
    }
  }

  static async loadNotes(username: string): Promise<Note[]> {
    try {
      const key = this.getNotesKey(username);
      console.log(`正在加载笔记，用户: ${username}`);
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