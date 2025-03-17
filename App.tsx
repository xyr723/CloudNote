/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useCallback} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  StatusBar,
  Alert,
} from 'react-native';

interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
}

function App(): React.JSX.Element {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: '欢迎使用云笔记',
      content: '这是一个简单的笔记示例：\n\n今天的待办：\n1. 早起晨跑\n2. 准备早餐\n3. 阅读一小时\n4. 整理房间\n\n小贴士：\n- 点击笔记可以编辑内容\n- 点击右下角的"+"按钮创建新笔记\n- 长按笔记可以删除\n- 在顶部搜索框搜索笔记\n- 保持记录的习惯\n- 整理思维，提高效率',
      timestamp: new Date(),
    },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentNote, setCurrentNote] = useState<{id?: string; title: string; content: string}>({
    title: '',
    content: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = () => {
    if (currentNote.title.trim() || currentNote.content.trim()) {
      if (isEditing && currentNote.id) {
        // 更新现有笔记
        setNotes(notes.map(note => 
          note.id === currentNote.id 
            ? {...note, title: currentNote.title, content: currentNote.content, timestamp: new Date()}
            : note
        ));
      } else {
        // 创建新笔记
        const newNote: Note = {
          id: Date.now().toString(),
          title: currentNote.title,
          content: currentNote.content,
          timestamp: new Date(),
        };
        setNotes([newNote, ...notes]);
      }
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setCurrentNote({title: '', content: ''});
    setIsEditing(false);
  };

  const handleEditNote = (note: Note) => {
    setCurrentNote({
      id: note.id,
      title: note.title,
      content: note.content,
    });
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleDeleteNote = useCallback((noteId: string) => {
    Alert.alert(
      '删除笔记',
      '确定要删除这条笔记吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '删除',
          onPress: () => {
            setNotes(notes.filter(note => note.id !== noteId));
          },
          style: 'destructive',
        },
      ],
      {cancelable: true},
    );
  }, [notes]);

  const renderNoteItem = ({item}: {item: Note}) => (
    <TouchableOpacity 
      style={styles.noteItem}
      onPress={() => handleEditNote(item)}
      onLongPress={() => handleDeleteNote(item.id)}
    >
      <Text style={styles.noteTitle}>{item.title}</Text>
      <Text style={styles.noteContent} numberOfLines={2}>
        {item.content}
      </Text>
      <Text style={styles.noteTime}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7FB3D5" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的云笔记</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索笔记..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredNotes}
        renderItem={renderNoteItem}
        keyExtractor={item => item.id}
        style={styles.noteList}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setCurrentNote({title: '', content: ''});
          setIsEditing(false);
          setModalVisible(true);
        }}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? '编辑笔记' : '新建笔记'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="标题"
              value={currentNote.title}
              onChangeText={text =>
                setCurrentNote({...currentNote, title: text})
              }
            />
            <TextInput
              style={[styles.input, styles.contentInput]}
              placeholder="开始写笔记..."
              multiline
              value={currentNote.content}
              onChangeText={text =>
                setCurrentNote({...currentNote, content: text})
              }
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCloseModal}>
                <Text style={styles.buttonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}>
                <Text style={styles.buttonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#7FB3D5',
    padding: 20,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  noteList: {
    flex: 1,
    paddingTop: 8,
  },
  noteItem: {
    backgroundColor: '#FFFFFF',
    margin: 10,
    padding: 15,
    borderRadius: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E8EEF2',
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    color: '#34495E',
    marginBottom: 8,
    lineHeight: 20,
  },
  noteTime: {
    fontSize: 12,
    color: '#95A5A6',
  },
  addButton: {
    position: 'absolute',
    right: 30,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7FB3D5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  addButtonText: {
    fontSize: 28,
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(44, 62, 80, 0.4)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8EEF2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    color: '#2C3E50',
    backgroundColor: '#F8F9FA',
  },
  contentInput: {
    height: 150,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#BDC3C7',
  },
  saveButton: {
    backgroundColor: '#7FB3D5',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
    textAlign: 'center',
  },
  searchContainer: {
    padding: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E8EEF2',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#2C3E50',
    backgroundColor: '#F8F9FA',
  },
});

export default App;
