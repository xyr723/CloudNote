import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {HomeScreen} from './HomeScreen';
import {generateThemeColors} from '../../../shared/theme/colors';

const mockHomeEditorModal = jest.fn((props: unknown) => props);
const mockHandleCloseModal = jest.fn();
const mockHandleCreateNote = jest.fn();
const mockHandleDeleteNote = jest.fn();
const mockHandleEditNote = jest.fn();
const mockHandleRefresh = jest.fn();
const mockHandleSave = jest.fn().mockResolvedValue(undefined);
const mockSetDeleteModalVisible = jest.fn();
const mockSetDeleteSuccessModalVisible = jest.fn();
const mockSetSearchQuery = jest.fn();
const mockSetShowSaveErrorModal = jest.fn();
const mockSetShowSaveSuccessModal = jest.fn();
const mockSetShowSortMenu = jest.fn();
const mockSetShowSyncErrorModal = jest.fn();
const mockSetSortOrder = jest.fn();
const mockSetSortType = jest.fn();
const mockSyncNotesNow = jest.fn().mockResolvedValue(undefined);

jest.mock('react-native', () => {
  const React = require('react');

  return {
    FlatList: ({
      ListFooterComponent,
    }: {
      ListFooterComponent?: React.ReactNode;
    }) => {
      if (typeof ListFooterComponent === 'function') {
        return React.createElement(ListFooterComponent);
      }

      return React.createElement(
        React.Fragment,
        null,
        ListFooterComponent ?? null,
      );
    },
    SafeAreaView: 'SafeAreaView',
    StatusBar: 'StatusBar',
    StyleSheet: {
      create: <T,>(styles: T) => styles,
    },
    Text: 'Text',
    TouchableOpacity: 'TouchableOpacity',
    View: 'View',
  };
});

jest.mock('../model/useHomeNotes', () => {
  const React = require('react');
  const {createEmptyNoteDraft} = require('../../../entities/note/draft');

  return {
    useHomeNotes: () => {
      const [currentNote, setCurrentNote] = React.useState(createEmptyNoteDraft());

      return {
        confirmDelete: jest.fn(),
        currentNote,
        deleteModalVisible: false,
        deleteSuccessModalVisible: false,
        filteredNotes: [],
        handleCloseModal: mockHandleCloseModal,
        handleCreateNote: mockHandleCreateNote,
        handleDeleteNote: mockHandleDeleteNote,
        handleEditNote: mockHandleEditNote,
        handleRefresh: mockHandleRefresh,
        handleSave: mockHandleSave,
        isEditing: false,
        isLoading: false,
        isRefreshing: false,
        modalVisible: true,
        notes: [],
        searchQuery: '',
        setCurrentNote,
        setDeleteModalVisible: mockSetDeleteModalVisible,
        setDeleteSuccessModalVisible: mockSetDeleteSuccessModalVisible,
        setSearchQuery: mockSetSearchQuery,
        setShowSaveErrorModal: mockSetShowSaveErrorModal,
        setShowSaveSuccessModal: mockSetShowSaveSuccessModal,
        setShowSortMenu: mockSetShowSortMenu,
        setShowSyncErrorModal: mockSetShowSyncErrorModal,
        setSortOrder: mockSetSortOrder,
        setSortType: mockSetSortType,
        showSaveErrorModal: false,
        showSaveSuccessModal: false,
        showSortMenu: false,
        showSyncErrorModal: false,
        sortOrder: 'desc',
        sortType: 'editDate',
        syncNotesNow: mockSyncNotesNow,
      };
    },
  };
});

jest.mock('./HomeEditorModal', () => ({
  HomeEditorModal: (props: unknown) => {
    mockHomeEditorModal(props);
    return null;
  },
}));

jest.mock('./HomeHeader', () => ({
  HomeHeader: () => null,
}));

jest.mock('./HomeNoteItem', () => ({
  HomeNoteItem: () => null,
}));

jest.mock('./HomeOverlayModals', () => ({
  HomeOverlayModals: () => null,
}));

jest.mock('./HomeSearchPanel', () => ({
  HomeSearchPanel: () => null,
}));

jest.mock('../../profile/ui/ProfileEntry', () => ({
  ProfileEntry: ({children}: {children: (openProfile: () => void) => React.ReactNode}) =>
    children(jest.fn()),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('refreshes current draft document mirror when modal editor content changes', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <HomeScreen
          onSignOut={jest.fn().mockResolvedValue(undefined)}
          setUser={jest.fn()}
          theme={generateThemeColors('薄荷生巧')}
          themePreferences={{
            isDarkMode: false,
            onThemeColorChange: jest.fn(),
            onToggleDarkMode: jest.fn(),
            themeColor: '薄荷生巧',
          }}
          user={{
            avatar: undefined,
            isLoggedIn: true,
            username: 'alice',
          }}
        />,
      );
    });

    const props = mockHomeEditorModal.mock.calls.at(-1)?.[0] as {
      currentNote: {
        document?: {
          plainText?: string;
        };
      };
      onChangeContent: (value: string) => void;
    };

    expect(props.currentNote.document?.plainText).toBe('');

    await ReactTestRenderer.act(async () => {
      props.onChangeContent('新正文[图片0]');
    });

    const nextProps = mockHomeEditorModal.mock.calls.at(-1)?.[0] as {
      currentNote: {
        content: string;
        document?: {
          plainText?: string;
        };
      };
    };

    expect(nextProps.currentNote.content).toBe('新正文[图片0]');
    expect(nextProps.currentNote.document?.plainText).toBe(
      '新正文\n\n图片占位 1',
    );
  });
});
