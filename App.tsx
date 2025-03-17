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
} from 'react-native';
import EditNotePage from './app/components/EditNotePage';
import ProfilePage from './app/components/ProfilePage';
import LoginPage from './app/components/LoginPage';
import RegisterPage from './app/components/RegisterPage';

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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState<{username: string; isLoggedIn: boolean}>({
    username: '云笔记',
    isLoggedIn: false,
  });

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogin = (username: string, _password: string) => {
    // 这里暂时直接登录成功，后续添加实际的登录验证
    setUser({username, isLoggedIn: true});
  };

  const handleRegister = (_username: string, _password: string) => {
    // 这里暂时直接注册成功，后续添加实际的注册逻辑
    setShowRegister(false);
  };

  const handleLogout = () => {
    setUser({username: '', isLoggedIn: false});
    setShowProfile(false);
  };

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
    setNoteToDelete(noteId);
    setDeleteModalVisible(true);
  }, []);

  const confirmDelete = () => {
    if (noteToDelete) {
      setNotes(notes.filter(note => note.id !== noteToDelete));
      setDeleteModalVisible(false);
      setNoteToDelete(null);
    }
  };

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
        {item.timestamp.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })}
      </Text>
    </TouchableOpacity>
  );

  if (!user.isLoggedIn) {
    if (showRegister) {
      return (
        <RegisterPage
          onRegister={handleRegister}
          onBack={() => setShowRegister(false)}
        />
      );
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        onRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#C5A3E6" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>云笔记</Text>
        <TouchableOpacity 
          style={styles.profileButton} 
          onPress={() => setShowProfile(true)}>
          <Text style={styles.profileButtonText}>
            {user.username[0].toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索笔记..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>💡 小贴士：长按笔记可以删除哦 (◕‿◕✿)</Text>
        </View>
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
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.deleteModalContainer}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteIconContainer}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </View>
            <Text style={styles.deleteTitle}>删除笔记</Text>
            <Text style={styles.deleteMessage}>确定要删除这条笔记吗？</Text>
            <Text style={styles.deleteSubMessage}>删除后将无法恢复哦 (｡•́︿•̀｡)</Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity
                style={[styles.deleteButton, styles.cancelDeleteButton]}
                onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.cancelDeleteButtonText}>再想想</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, styles.confirmDeleteButton]}
                onPress={confirmDelete}>
                <Text style={styles.confirmDeleteButtonText}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showProfile && (
        <ProfilePage
          visible={showProfile}
          username={user.username}
          notesCount={notes.length}
          onLogout={handleLogout}
          onClose={() => setShowProfile(false)}
        />
      )}

      {modalVisible && (
        <EditNotePage
          visible={modalVisible}
          isEditing={isEditing}
          note={currentNote}
          onSave={handleSave}
          onClose={handleCloseModal}
          onChangeTitle={(text) => setCurrentNote({...currentNote, title: text})}
          onChangeContent={(text) => setCurrentNote({...currentNote, content: text})}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFAFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#C5A3E6',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  profileButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C5A3E6',
  },
  noteList: {
    flex: 1,
    paddingTop: 8,
  },
  noteItem: {
    backgroundColor: '#FFFFFF',
    margin: 10,
    marginTop: 6,
    marginBottom: 8,
    padding: 15,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EFE6F7',  // 更淡的紫色边框
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A98DB8',  // 更柔和的深紫色
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
  noteTime: {
    fontSize: 12,
    color: '#E5A4C4',  // 更柔和的粉色
    fontStyle: 'italic',
  },
  addButton: {
    position: 'absolute',
    right: 30,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5A4C4',  // 更柔和的粉色
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  addButtonText: {
    fontSize: 32,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  searchContainer: {
    padding: 15,
    paddingBottom: 2,
  },
  searchInput: {
    borderWidth: 1.5,
    borderColor: '#C5A3E6',  // 更柔和的紫色边框
    borderRadius: 20,
    padding: 12,
    paddingLeft: 20,
    fontSize: 15,
    color: '#666666',
    backgroundColor: '#FFFFFF',
  },
  tipContainer: {
    padding: 8,
    paddingTop: 5,
    paddingLeft: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    fontSize: 13,
    color: '#E5A4C4',  // 更柔和的粉色
    fontStyle: 'italic',
    textAlign: 'center',
    backgroundColor: '#FDFAFF',  // 更淡的背景色
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F7E6EF',  // 更淡的粉色边框
  },
  deleteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(197, 163, 230, 0.25)',  // 更淡的半透明紫色
  },
  deleteModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '80%',
    elevation: 5,
  },
  deleteIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FDFAFF',  // 更淡的背景色
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  deleteIcon: {
    fontSize: 32,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#A98DB8',  // 更柔和的深紫色
    marginBottom: 10,
  },
  deleteMessage: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteSubMessage: {
    fontSize: 14,
    color: '#E5A4C4',  // 更柔和的粉色
    marginBottom: 20,
    textAlign: 'center',
  },
  deleteButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  deleteButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelDeleteButton: {
    backgroundColor: '#FDFAFF',  // 更淡的背景色
    borderWidth: 1,
    borderColor: '#C5A3E6',  // 更柔和的紫色边框
  },
  confirmDeleteButton: {
    backgroundColor: '#E5A4C4',  // 更柔和的粉色
  },
  cancelDeleteButtonText: {
    color: '#A98DB8',  // 更柔和的深紫色
    fontWeight: '600',
    fontSize: 15,
  },
  confirmDeleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default App;
