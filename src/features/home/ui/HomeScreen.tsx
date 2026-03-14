import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useCallback, useMemo, useState} from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ProfilePage from '../../../../app/components/ProfilePage';
import SettingsPage from '../../../../app/components/SettingsPage';
import {generateThemeColors} from '../../../shared/theme/colors';
import type {Note} from '../../../entities/note/types';
import {useHomeNotes} from '../model/useHomeNotes';
import {providerRegistry} from '../../../providers/providerRegistry';
import {HomeEditorModal} from './HomeEditorModal';
import {HomeHeader} from './HomeHeader';
import {HomeNoteItem} from './HomeNoteItem';
import {HomeOverlayModals} from './HomeOverlayModals';
import {HomeSearchPanel} from './HomeSearchPanel';
import {homeScreenStyles} from './homeScreenStyles';

type HomeScreenProps = {
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  setThemeColor: React.Dispatch<React.SetStateAction<string>>;
  setUser: React.Dispatch<
    React.SetStateAction<{
      avatar?: string;
      isLoggedIn: boolean;
      username: string;
    }>
  >;
  themeColor: string;
  user: {
    avatar?: string;
    isLoggedIn: boolean;
    username: string;
  };
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  isDarkMode,
  setIsDarkMode,
  setThemeColor,
  setUser,
  themeColor,
  user,
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const authProvider = useMemo(() => providerRegistry.getAuthProvider(), []);
  const {
    confirmDelete,
    currentNote,
    deleteModalVisible,
    deleteSuccessModalVisible,
    filteredNotes,
    handleCloseModal,
    handleCreateNote,
    handleDeleteNote,
    handleEditNote,
    handleRefresh,
    handleSave,
    isEditing,
    isLoading,
    isRefreshing,
    modalVisible,
    notes,
    searchQuery,
    setCurrentNote,
    setDeleteModalVisible,
    setDeleteSuccessModalVisible,
    setSearchQuery,
    setShowSaveErrorModal,
    setShowSaveSuccessModal,
    setShowSortMenu,
    setShowSyncErrorModal,
    setSortOrder,
    setSortType,
    showSaveErrorModal,
    showSaveSuccessModal,
    showSortMenu,
    showSyncErrorModal,
    sortOrder,
    sortType,
    syncNotesNow,
  } = useHomeNotes({
    isLoggedIn: user.isLoggedIn,
    username: user.username,
  });

  const theme = useMemo(() => {
    try {
      return generateThemeColors(themeColor, isDarkMode);
    } catch (error) {
      console.error('Theme generation error:', error);
      return generateThemeColors('薄荷生巧', isDarkMode);
    }
  }, [isDarkMode, themeColor]);

  const handleLogout = useCallback(async () => {
    try {
      setShowLogoutConfirm(false);
      setShowProfile(false);
      await syncNotesNow();
      await authProvider.signOut();
      setUser({username: '', isLoggedIn: false});
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [authProvider, setUser, syncNotesNow]);

  const handleThemeColorChange = useCallback(
    (color: string) => {
      const themeMap: {[key: string]: string} = {
        '#DCC6EA': '葡萄冰萃',
        '#B7CCDF': '清冽冰川',
        '#938368': '流金岁月',
        '#BBE1E4': '薄荷生巧',
        '#FBD7D7': '桃桃乌龙',
      };
      const nextThemeColor = themeMap[color] || '薄荷生巧';
      setThemeColor(nextThemeColor);
      AsyncStorage.setItem('themeColor', nextThemeColor).catch(error => {
        console.error('保存主题颜色失败:', error);
      });
    },
    [setThemeColor],
  );

  const handleToggleDarkMode = useCallback(
    (value: boolean) => {
      setIsDarkMode(value);
      AsyncStorage.setItem('isDarkMode', value.toString()).catch(error => {
        console.error('保存深色模式设置失败:', error);
      });
    },
    [setIsDarkMode],
  );

  const handleUpdateAvatar = useCallback(
    (avatarUri: string) => {
      setUser(previousUser => ({...previousUser, avatar: avatarUri}));
    },
    [setUser],
  );

  const footerContent = useMemo(() => {
    if (filteredNotes.length > 0) {
      return null;
    }

    return (
      <View style={homeScreenStyles.emptyContainer}>
        <Text style={[homeScreenStyles.emptyText, {color: theme.textLight}]}>
          {searchQuery ? '未找到相关笔记' : '没有更多笔记了'}
        </Text>
      </View>
    );
  }, [filteredNotes.length, searchQuery, theme.textLight]);

  const renderNoteItem = useCallback(
    ({item}: {item: Note}) => (
      <HomeNoteItem
        note={item}
        onPress={() => handleEditNote(item)}
        onLongPress={() => handleDeleteNote(item.id)}
        theme={theme}
      />
    ),
    [handleDeleteNote, handleEditNote, theme],
  );

  return (
    <SafeAreaView
      style={[homeScreenStyles.container, {backgroundColor: theme.background}]}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
      <HomeHeader
        onOpenProfile={() => setShowProfile(true)}
        theme={theme}
        user={user}
      />
      <HomeSearchPanel
        isLoading={isLoading}
        onChangeSearchQuery={setSearchQuery}
        onSelectSortOrder={(nextSortOrder) => {
          setSortOrder(nextSortOrder);
          setShowSortMenu(false);
        }}
        onSelectSortType={(nextSortType) => {
          setSortType(nextSortType);
          setShowSortMenu(false);
        }}
        onToggleSortMenu={() => setShowSortMenu(!showSortMenu)}
        searchQuery={searchQuery}
        showSortMenu={showSortMenu}
        sortOrder={sortOrder}
        sortType={sortType}
        theme={theme}
      />

      <FlatList
        data={filteredNotes}
        renderItem={renderNoteItem}
        keyExtractor={item => item.id}
        style={homeScreenStyles.noteList}
        contentContainerStyle={homeScreenStyles.noteListContent}
        ListFooterComponent={footerContent}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      <TouchableOpacity
        style={[homeScreenStyles.addButton, {backgroundColor: theme.accent}]}
        onPress={handleCreateNote}>
        <Text style={homeScreenStyles.addButtonText}>+</Text>
      </TouchableOpacity>
      <HomeOverlayModals
        confirmDelete={confirmDelete}
        deleteModalVisible={deleteModalVisible}
        deleteSuccessModalVisible={deleteSuccessModalVisible}
        onCloseDeleteModal={() => setDeleteModalVisible(false)}
        onCloseDeleteSuccessModal={() => setDeleteSuccessModalVisible(false)}
        onCloseLogoutConfirm={() => setShowLogoutConfirm(false)}
        onCloseSaveError={() => setShowSaveErrorModal(false)}
        onCloseSaveSuccess={() => setShowSaveSuccessModal(false)}
        onCloseSyncError={() => setShowSyncErrorModal(false)}
        onConfirmLogout={handleLogout}
        showLogoutConfirm={showLogoutConfirm}
        showSaveErrorModal={showSaveErrorModal}
        showSaveSuccessModal={showSaveSuccessModal}
        showSyncErrorModal={showSyncErrorModal}
        theme={theme}
      />

      {showProfile && (
        <ProfilePage
          visible={showProfile}
          username={user.username}
          avatar={user.avatar}
          notesCount={notes.length}
          onLogout={async () => {
            setShowLogoutConfirm(true);
          }}
          onClose={() => setShowProfile(false)}
          onOpenSettings={() => setShowSettings(true)}
          onUpdateAvatar={handleUpdateAvatar}
          theme={theme}
        />
      )}

      {showSettings && (
        <SettingsPage
          visible={showSettings}
          onClose={() => setShowSettings(false)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          themeColor={themeColor}
          onThemeColorChange={handleThemeColorChange}
          theme={theme}
        />
      )}
      <HomeEditorModal
        currentNote={currentNote}
        isEditing={isEditing}
        modalVisible={modalVisible}
        onChangeAudios={(audios) =>
          setCurrentNote(previousNote => ({...previousNote, audios}))
        }
        onChangeContent={(text) =>
          setCurrentNote(previousNote => ({...previousNote, content: text}))
        }
        onChangeFontSize={(fontSize) =>
          setCurrentNote(previousNote => ({...previousNote, fontSize}))
        }
        onChangeImages={(images) =>
          setCurrentNote(previousNote => ({...previousNote, images}))
        }
        onChangeTextSegments={(textSegments) =>
          setCurrentNote(previousNote => ({...previousNote, textSegments}))
        }
        onChangeTitle={(title) =>
          setCurrentNote(previousNote => ({...previousNote, title}))
        }
        onClose={handleCloseModal}
        onSave={handleSave}
        theme={theme}
      />
    </SafeAreaView>
  );
};
