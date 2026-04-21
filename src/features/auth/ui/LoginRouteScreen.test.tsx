import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {LoginRouteScreen} from './LoginRouteScreen';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRedirect = jest.fn();
const mockSignIn = jest.fn();
const mockUseAuthSession = jest.fn();
const mockLoginScreen = jest.fn((props: unknown) => props);

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

jest.mock('../model/AuthSessionProvider', () => ({
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

jest.mock('./LoginScreen', () => ({
  LoginScreen: (props: unknown) => {
    mockLoginScreen(props);
    return null;
  },
}));

describe('LoginRouteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthSession.mockReturnValue({
      isHydrating: false,
      signIn: mockSignIn,
      user: {
        avatar: undefined,
        isLoggedIn: false,
        username: '',
      },
    });
  });

  test('renders login screen and pushes register route', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<LoginRouteScreen />);
    });

    expect(mockLoginScreen).toHaveBeenCalledTimes(1);

    const props = mockLoginScreen.mock.calls[0]?.[0] as {
      onLogin: (username: string, password: string) => Promise<void>;
      onRegister: () => void;
    };

    props.onRegister();
    expect(mockPush).toHaveBeenCalledWith('/(auth)/register');

    await props.onLogin('alice', '123456');
    expect(mockSignIn).toHaveBeenCalledWith('alice', '123456');
    expect(mockReplace).toHaveBeenCalledWith('/(notes)');
  });

  test('redirects authenticated user to notes route', async () => {
    mockUseAuthSession.mockReturnValue({
      isHydrating: false,
      signIn: mockSignIn,
      user: {
        avatar: undefined,
        isLoggedIn: true,
        username: 'alice',
      },
    });

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<LoginRouteScreen />);
    });

    expect(mockRedirect).toHaveBeenCalledWith('/(notes)');
    expect(mockLoginScreen).not.toHaveBeenCalled();
  });
});
