import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {NotesRouteScreen} from './NotesRouteScreen';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRedirect = jest.fn();
const mockSignOut = jest.fn();
const mockSetUser = jest.fn();
const mockUseAuthSession = jest.fn();
const mockHomeScreen = jest.fn((props: unknown) => props);

jest.mock('expo-router', () => ({
  Redirect: ({href}: {href: string}) => {
    mockRedirect(href);
    return null;
  },
  useRouter: () => ({
    push: mockPush,
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
      accent: '#444',
      background: '#fff',
      border: '#eee',
      primary: '#000',
      surface: '#fff',
      text: '#333',
      textLight: '#666',
    },
    themeColor: '薄荷生巧',
  }),
}));

jest.mock('./HomeScreen', () => ({
  HomeScreen: (props: unknown) => {
    mockHomeScreen(props);
    return null;
  },
}));

describe('NotesRouteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthSession.mockReturnValue({
      isHydrating: false,
      setUser: mockSetUser,
      signOut: mockSignOut,
      user: {
        avatar: undefined,
        isLoggedIn: true,
        username: 'alice',
      },
    });
  });

  test('redirects guest user to login route', async () => {
    mockUseAuthSession.mockReturnValue({
      isHydrating: false,
      setUser: mockSetUser,
      signOut: mockSignOut,
      user: {
        avatar: undefined,
        isLoggedIn: false,
        username: '',
      },
    });

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<NotesRouteScreen />);
    });

    expect(mockRedirect).toHaveBeenCalledWith('/(auth)/login');
    expect(mockHomeScreen).not.toHaveBeenCalled();
  });

  test('renders home screen and signs out through router orchestration', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<NotesRouteScreen />);
    });

    expect(mockHomeScreen).toHaveBeenCalledTimes(1);

    const props = mockHomeScreen.mock.calls[0]?.[0] as {
      onSignOut: () => Promise<void>;
      setUser: typeof mockSetUser;
      user: {
        username: string;
      };
    };

    expect(props.user.username).toBe('alice');
    expect(props.setUser).toBe(mockSetUser);

    await props.onSignOut();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  test('routes note editor entry through expo router page', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<NotesRouteScreen />);
    });

    const props = mockHomeScreen.mock.calls[0]?.[0] as {
      editorPresentation: 'route' | 'modal';
      onOpenCreateEditorRoute: () => void;
      onOpenEditEditorRoute: (note: {id: string}) => void;
    };

    expect(props.editorPresentation).toBe('route');

    props.onOpenCreateEditorRoute();
    expect(mockPush).toHaveBeenCalledWith('/(notes)/editor');

    props.onOpenEditEditorRoute({id: 'note-1'});
    expect(mockPush).toHaveBeenCalledWith('/(notes)/editor?noteId=note-1');
  });
});
