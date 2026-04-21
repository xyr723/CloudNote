import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {NoteEditorRouteScreen} from './NoteEditorRouteScreen';

const mockPushNotes = jest.fn();
const mockPullNotes = jest.fn();
const mockRedirect = jest.fn();
const mockReplace = jest.fn();
const mockUseAuthSession = jest.fn();
const mockUseLocalSearchParams = jest.fn();
const mockNoteEditorModal = jest.fn((props: unknown) => props);

jest.mock('expo-router', () => ({
  Redirect: ({href}: {href: string}) => {
    mockRedirect(href);
    return null;
  },
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('../../auth/model/AuthSessionProvider', () => ({
  useAuthSession: () => mockUseAuthSession(),
}));

jest.mock('../../../shared/theme/useThemePreferences', () => ({
  useThemePreferences: () => ({
    isDarkMode: false,
    onThemeColorChange: jest.fn(),
    onToggleDarkMode: jest.fn(),
    theme: {
      background: '#fff',
      border: '#eee',
      error: '#f00',
      primary: '#000',
      primaryDark: '#111',
      primaryLight: '#222',
      surface: '#fff',
      text: '#333',
      textLight: '#666',
    },
    themeColor: '薄荷生巧',
  }),
}));

jest.mock('../../../providers/providerRegistry', () => ({
  providerRegistry: {
    getNoteSyncProvider: () => ({
      pullNotes: (...args: unknown[]) => mockPullNotes(...args),
      pushNotes: (...args: unknown[]) => mockPushNotes(...args),
    }),
  },
}));

jest.mock('./NoteEditorModal', () => ({
  __esModule: true,
  default: (props: unknown) => {
    mockNoteEditorModal(props);
    return null;
  },
}));

describe('NoteEditorRouteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({});
    mockUseAuthSession.mockReturnValue({
      isHydrating: false,
      user: {
        avatar: undefined,
        isLoggedIn: true,
        username: 'alice',
      },
    });
    mockPullNotes.mockResolvedValue([
      {
        content: '旧内容',
        id: 'note-1',
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
        title: '旧标题',
      },
    ]);
  });

  test('loads existing note draft and saves changes back to notes route', async () => {
    mockUseLocalSearchParams.mockReturnValue({noteId: 'note-1'});

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<NoteEditorRouteScreen />);
    });

    const props = mockNoteEditorModal.mock.calls.at(-1)?.[0] as {
      isEditing: boolean;
      note: {
        title: string;
      };
      onChangeTitle: (value: string) => void;
      onSave: () => Promise<void>;
    };

    expect(props.isEditing).toBe(true);
    expect(props.note.title).toBe('旧标题');

    await ReactTestRenderer.act(async () => {
      props.onChangeTitle('新标题');
    });

    const nextProps = mockNoteEditorModal.mock.calls.at(-1)?.[0] as {
      onSave: () => Promise<void>;
    };

    await ReactTestRenderer.act(async () => {
      await nextProps.onSave();
    });

    expect(mockPushNotes).toHaveBeenCalledWith(
      'alice',
      expect.arrayContaining([
        expect.objectContaining({
          id: 'note-1',
          title: '新标题',
        }),
      ]),
    );
    expect(mockReplace).toHaveBeenCalledWith('/(notes)');
  });

  test('creates new note and returns to notes route after save', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<NoteEditorRouteScreen />);
    });

    const props = mockNoteEditorModal.mock.calls.at(-1)?.[0] as {
      isEditing: boolean;
      onChangeContent: (value: string) => void;
      onChangeTitle: (value: string) => void;
    };

    expect(props.isEditing).toBe(false);

    await ReactTestRenderer.act(async () => {
      props.onChangeTitle('新笔记');
      props.onChangeContent('新正文[图片0]');
    });

    const nextProps = mockNoteEditorModal.mock.calls.at(-1)?.[0] as {
      note: {
        document?: {
          plainText?: string;
        };
      };
      onSave: () => Promise<void>;
    };

    expect(nextProps.note.document?.plainText).toBe('新正文\n\n图片占位 1');

    await ReactTestRenderer.act(async () => {
      await nextProps.onSave();
    });

    expect(mockPushNotes).toHaveBeenCalledWith(
      'alice',
      expect.arrayContaining([
        expect.objectContaining({
          title: '新笔记',
          content: '新正文[图片0]',
        }),
      ]),
    );
    expect(mockReplace).toHaveBeenCalledWith('/(notes)');
  });
});
