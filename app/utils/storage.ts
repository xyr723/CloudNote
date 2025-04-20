import AsyncStorage from '@react-native-async-storage/async-storage';

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

  static async saveNotes(username: string, notes: Note[]): Promise<void> {
    try {
      const key = this.getNotesKey(username);
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
      console.log(`笔记清除成功，用户: ${username}`);
    } catch (error) {
      console.error('清除笔记失败:', error);
      throw error;
    }
  }
} 