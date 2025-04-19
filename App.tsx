/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useCallback, useMemo} from 'react';
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
  Image,
} from 'react-native';

import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import EditNotePage from './app/components/EditNotePage';
import ProfilePage from './app/components/ProfilePage';
import LoginPage from './app/components/LoginPage';
import RegisterPage from './app/components/RegisterPage';
import SettingsPage from './app/components/SettingsPage';
import { generateThemeColors } from './app/theme/colors';

interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  images?: string[];
  fontSize?: number;
  textSegments?: { text: string; fontSize: number }[];
}

type SortType = 'editDate' | 'createDate' | 'title';
type SortOrder = 'asc' | 'desc';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent({user, setUser}: {user: {username: string; isLoggedIn: boolean; avatar?: string}; setUser: React.Dispatch<React.SetStateAction<{username: string; isLoggedIn: boolean; avatar?: string}>>}): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: '欢迎使用云笔记',
      content: '这是一个简单的笔记示例：\n\n今天的待办：\n1. 早起晨跑\n2. 准备早餐\n3. 阅读一小时\n4. 整理房间\n\n小贴士：\n- 点击笔记可以编辑内容\n- 点击右下角的"+"按钮创建新笔记\n- 长按笔记可以删除\n- 在顶部搜索框搜索笔记\n- 保持记录的习惯\n- 整理思维，提高效率',
      timestamp: new Date(),
    },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentNote, setCurrentNote] = useState<{id?: string; title: string; content: string; images?: string[]; fontSize?: number; textSegments?: { text: string; fontSize: number }[]}>({
    title: '',
    content: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeColor, setThemeColor] = useState('薄荷生巧');
  const [sortType, setSortType] = useState<SortType>('editDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const theme = useMemo(() => {
    try {
      return generateThemeColors(themeColor, isDarkMode);
    } catch (error) {
      console.error('Theme generation error:', error);
      return generateThemeColors('薄荷生巧', isDarkMode); // 使用默认主题
    }
  }, [themeColor, isDarkMode]);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      let comparison = 0;
      switch (sortType) {
        case 'editDate':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'createDate':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [notes, sortType, sortOrder]);

  const filteredNotes = sortedNotes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    setUser({username: '', isLoggedIn: false});
    setShowProfile(false);
    navigation.navigate('Login');
  };

  const handleSave = () => {
    if (currentNote.title.trim() || currentNote.content.trim()) {
      if (isEditing && currentNote.id) {
        // 更新现有笔记
        setNotes(notes.map(note => 
          note.id === currentNote.id 
            ? {...note, 
                title: currentNote.title, 
                content: currentNote.content, 
                timestamp: new Date(), 
                images: currentNote.images, 
                fontSize: currentNote.fontSize,
                textSegments: currentNote.textSegments
              }
            : note
        ));
      } else {
        // 创建新笔记
        const newNote: Note = {
          id: Date.now().toString(),
          title: currentNote.title,
          content: currentNote.content,
          timestamp: new Date(),
          images: currentNote.images,
          fontSize: currentNote.fontSize,
          textSegments: currentNote.textSegments,
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
      images: note.images,
      fontSize: note.fontSize,
      textSegments: note.textSegments,
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

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const handleThemeColorChange = (color: string) => {
    // 根据颜色值找到对应的主题名称
    const themeMap: { [key: string]: string } = {
      '#DCC6EA': '葡萄冰萃',
      '#B7CCDF': '清冽冰川',
      '#938368': '流金岁月',
      '#BBE1E4': '薄荷生巧',
      '#FBD7D7': '桃桃乌龙',
    };
    setThemeColor(themeMap[color] || '薄荷生巧');
  };

  const handleUpdateAvatar = (avatarUri: string) => {
    setUser(prev => ({...prev, avatar: avatarUri}));
  };

  const renderNoteItem = ({item}: {item: Note}) => {
    // 提取第一张图片（如果有）
    const firstImageMatch = item.content.match(/\[图片(\d+)\]/);
    const firstImageIndex = firstImageMatch ? parseInt(firstImageMatch[1]) : -1;
    const firstImage = firstImageIndex >= 0 && item.images ? item.images[firstImageIndex] : null;

    // 处理内容显示，移除图片标记
    const displayContent = item.content.replace(/\[图片\d+\]/g, '').trim();

    return (
      <TouchableOpacity 
        style={[styles.noteItem, { borderColor: theme.border }]}
        onPress={() => handleEditNote(item)}
        onLongPress={() => handleDeleteNote(item.id)}
      >
        <Text style={[styles.noteTitle, { color: theme.primaryDark }]}>{item.title}</Text>
        {firstImage && (
          <Image
            source={{ uri: firstImage }}
            style={styles.notePreviewImage}
            resizeMode="cover"
          />
        )}
        <Text style={[styles.noteContent, { color: theme.text }]} numberOfLines={2}>
          {displayContent}
        </Text>
        <Text style={[styles.noteTime, { color: theme.accent }]}>
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
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.title}>云笔记 -{navigation.getState().routes[navigation.getState().index].name}</Text>
        <TouchableOpacity 
          style={[styles.profileButton, { backgroundColor: theme.surface }]} 
          onPress={() => setShowProfile(true)}>
          {user.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={styles.profileImage}
            />
          ) : (
            <Text style={[styles.profileButtonText, { color: theme.primary }]}>
              {user.username ? user.username[0].toUpperCase() : '?'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { 
            borderColor: theme.primary,
            backgroundColor: theme.surface,
            color: theme.text
          }]}
          placeholder="搜索笔记..."
          placeholderTextColor={theme.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>
            💡 小贴士：长按笔记可以删除哦 (◕‿◕✿)
          </Text>
        </View>
        <View style={styles.sortMenu}>
          <TouchableOpacity 
            style={[styles.sortMenuButton, { backgroundColor: theme.primaryLight }]}
            onPress={() => setShowSortMenu(!showSortMenu)}>
            <Text style={[styles.sortMenuButtonText, { color: theme.text }]}>
              {sortType === 'editDate' ? '编辑日期' : 
               sortType === 'createDate' ? '创建日期' : '标题'}
            </Text>
            <Text style={[styles.sortMenuArrow, { color: theme.text }]}>
              {showSortMenu ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          {showSortMenu && (
            <View style={[styles.sortMenuContent, { backgroundColor: theme.surface }]}>
              <View style={styles.sortMenuSection}>
                <Text style={[styles.sortMenuTitle, { color: theme.textLight }]}>排序方式</Text>
                <TouchableOpacity
                  style={[
                    styles.sortMenuItem,
                    sortType === 'editDate' && { backgroundColor: theme.primaryLight }
                  ]}
                  onPress={() => {
                    setSortType('editDate');
                    setShowSortMenu(false);
                  }}>
                  <Text style={[
                    styles.sortMenuItemText,
                    { color: theme.text }
                  ]}>编辑日期</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortMenuItem,
                    sortType === 'createDate' && { backgroundColor: theme.primaryLight }
                  ]}
                  onPress={() => {
                    setSortType('createDate');
                    setShowSortMenu(false);
                  }}>
                  <Text style={[
                    styles.sortMenuItemText,
                    { color: theme.text }
                  ]}>创建日期</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortMenuItem,
                    sortType === 'title' && { backgroundColor: theme.primaryLight }
                  ]}
                  onPress={() => {
                    setSortType('title');
                    setShowSortMenu(false);
                  }}>
                  <Text style={[
                    styles.sortMenuItemText,
                    { color: theme.text }
                  ]}>标题</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.sortMenuSection}>
                <Text style={[styles.sortMenuTitle, { color: theme.textLight }]}>排序顺序</Text>
                <TouchableOpacity
                  style={[
                    styles.sortMenuItem,
                    sortOrder === 'desc' && { backgroundColor: theme.primaryLight }
                  ]}
                  onPress={() => {
                    setSortOrder('desc');
                    setShowSortMenu(false);
                  }}>
                  <Text style={[
                    styles.sortMenuItemText,
                    { color: theme.text }
                  ]}>降序</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortMenuItem,
                    sortOrder === 'asc' && { backgroundColor: theme.primaryLight }
                  ]}
                  onPress={() => {
                    setSortOrder('asc');
                    setShowSortMenu(false);
                  }}>
                  <Text style={[
                    styles.sortMenuItemText,
                    { color: theme.text }
                  ]}>升序</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={filteredNotes}
        renderItem={renderNoteItem}
        keyExtractor={item => item.id}
        style={styles.noteList}
      />

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.accent }]}
        onPress={() => {
          setCurrentNote({title: '', content: ''});
          setIsEditing(false);
          setModalVisible(true);
        }}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={[styles.deleteModalContainer, { backgroundColor: theme.primaryTransparent }]}>
          <View style={[styles.deleteModalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.deleteIconContainer, { backgroundColor: theme.primaryLight }]}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </View>
            <Text style={[styles.deleteTitle, { color: theme.primaryDark }]}>删除笔记</Text>
            <Text style={[styles.deleteMessage, { color: theme.text }]}>确定要删除这条笔记吗？</Text>
            <Text style={[styles.deleteSubMessage, { color: theme.accent }]}>删除后将无法恢复哦 (｡•́︿•̀｡)</Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity
                style={[styles.deleteButton, styles.cancelDeleteButton, { 
                  backgroundColor: theme.surface,
                  borderColor: theme.primary 
                }]}
                onPress={() => setDeleteModalVisible(false)}>
                <Text style={[styles.cancelDeleteButtonText, { color: theme.primary }]}>再想想</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, styles.confirmDeleteButton, { backgroundColor: theme.error }]}
                onPress={confirmDelete}>
                <Text style={[styles.confirmDeleteButtonText, { color: theme.surface }]}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showProfile && (
        <ProfilePage
          visible={showProfile}
          username={user.username}
          avatar={user.avatar}
          notesCount={notes.length}
          onLogout={handleLogout}
          onClose={() => setShowProfile(false)}
          onOpenSettings={handleOpenSettings}
          onUpdateAvatar={handleUpdateAvatar}
          theme={theme}
        />
      )}

      {showSettings && (
        <SettingsPage
          visible={showSettings}
          onClose={handleCloseSettings}
          isDarkMode={isDarkMode}
          onToggleDarkMode={setIsDarkMode}
          themeColor={themeColor}
          onThemeColorChange={handleThemeColorChange}
          theme={theme}
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
          onChangeImages={(images) => setCurrentNote({...currentNote, images})}
          onChangeFontSize={(size) => setCurrentNote({...currentNote, fontSize: size})}
          _onChangeTextSegments={(segments) => setCurrentNote({...currentNote, textSegments: segments})}
          theme={theme}
        />
      )}
    </SafeAreaView>
  );
}

function App(): React.JSX.Element {
  const theme = useMemo(() => {
    try {
      return generateThemeColors('薄荷生巧', false);
    } catch (error) {
      console.error('Theme generation error:', error);
      return generateThemeColors('薄荷生巧', false);
    }
  }, []);

  const [user, setUser] = useState<{username: string; isLoggedIn: boolean; avatar?: string}>({
    username: '',
    isLoggedIn: false,
  });

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen 
          name="Login" 
          component={({ navigation }: { navigation: NavigationProp }) => (
            <LoginPage
              onLogin={(username, _password) => {
                setUser({username, isLoggedIn: true});
                navigation.navigate('Home');
              }}
              onRegister={() => navigation.navigate('Register')}
              theme={theme}
            />
          )}
        />
        <Stack.Screen 
          name="Register" 
          component={({ navigation }: { navigation: NavigationProp }) => (
            <RegisterPage
              onRegister={() => navigation.navigate('Login')}
              onBack={() => navigation.navigate('Login')}
              theme={theme}
              navigation={navigation}
            />
          )}
        />
        <Stack.Screen 
          name="Home" 
          component={() => <AppContent user={user} setUser={setUser} />} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
  },
  noteList: {
    flex: 1,
    paddingTop: 8,
  },
  noteItem: {
    margin: 10,
    marginTop: 6,
    marginBottom: 8,
    padding: 15,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  noteTime: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  addButton: {
    position: 'absolute',
    right: 30,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
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
    paddingBottom: 8,
  },
  searchInput: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 12,
    paddingLeft: 20,
    fontSize: 15,
  },
  tipContainer: {
    padding: 6,
    paddingTop: 4,
    paddingLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    alignSelf: 'center',
    width: '90%',
  },
  tipText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deleteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#FDFAFF',
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
    color: '#A98DB8',
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
    color: '#E5A4C4',
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
    backgroundColor: '#FDFAFF',
    borderWidth: 1,
    borderColor: '#C5A3E6',
  },
  confirmDeleteButton: {
    backgroundColor: '#E5A4C4',
  },
  cancelDeleteButtonText: {
    color: '#A98DB8',
    fontWeight: '600',
    fontSize: 15,
  },
  confirmDeleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  sortMenu: {
    marginTop: 8,
    position: 'relative',
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  sortMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sortMenuButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  sortMenuArrow: {
    fontSize: 12,
    marginLeft: 4,
  },
  sortMenuContent: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    borderRadius: 12,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
    minWidth: 160,
  },
  sortMenuSection: {
    marginBottom: 8,
  },
  sortMenuTitle: {
    fontSize: 12,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  sortMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sortMenuItemText: {
    fontSize: 14,
  },
  notePreviewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginVertical: 8,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
});

export default App;
