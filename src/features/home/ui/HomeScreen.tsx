import React, {useCallback, useMemo, useState} from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {Note} from '../../../entities/note/types';
import type {
  ThemePreferencesController,
  ThemePreferencesInput,
} from '../../../shared/theme/useThemePreferences';
import {useHomeNotes} from '../model/useHomeNotes';
import {HomeEditorModal} from './HomeEditorModal';
import {HomeHeader} from './HomeHeader';
import {HomeNoteItem} from './HomeNoteItem';
import {HomeOverlayModals} from './HomeOverlayModals';
import {HomeSearchPanel} from './HomeSearchPanel';
import {homeScreenStyles} from './homeScreenStyles';
import {ProfileEntry} from '../../profile/ui/ProfileEntry';

type HomeScreenProps = {
  onSignOut: () => Promise<void>;
  setUser: React.Dispatch<
    React.SetStateAction<{
      avatar?: string;
      isLoggedIn: boolean;
      username: string;
    }>
  >;
  theme: ThemePreferencesController['theme'];
  themePreferences: ThemePreferencesInput;
  user: {
    avatar?: string;
    isLoggedIn: boolean;
    username: string;
  };
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSignOut,
  setUser,
  theme,
  themePreferences,
  user,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  const handleLogout = useCallback(async () => {
    try {
      setShowLogoutConfirm(false);
      await syncNotesNow();
      await onSignOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [onSignOut, syncNotesNow]);

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
      <ProfileEntry
        isDarkMode={themePreferences.isDarkMode}
        notesCount={notes.length}
        onRequestLogout={() => setShowLogoutConfirm(true)}
        onThemeColorChange={themePreferences.onThemeColorChange}
        onToggleDarkMode={themePreferences.onToggleDarkMode}
        setUser={setUser}
        theme={theme}
        themeColor={themePreferences.themeColor}
        user={user}>
        {openProfile => (
          <HomeHeader onOpenProfile={openProfile} theme={theme} user={user} />
        )}
      </ProfileEntry>
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
