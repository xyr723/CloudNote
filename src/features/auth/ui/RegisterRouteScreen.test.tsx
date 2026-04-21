import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {RegisterRouteScreen} from './RegisterRouteScreen';

const mockReplace = jest.fn();
const mockRedirect = jest.fn();
const mockRegister = jest.fn();
const mockUseAuthSession = jest.fn();
const mockRegisterScreen = jest.fn((props: unknown) => props);

jest.mock('expo-router', () => ({
  Redirect: ({href}: {href: string}) => {
    mockRedirect(href);
    return null;
  },
  useRouter: () => ({
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

jest.mock('./RegisterScreen', () => ({
  RegisterScreen: (props: unknown) => {
    mockRegisterScreen(props);
    return null;
  },
}));

describe('RegisterRouteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthSession.mockReturnValue({
      isHydrating: false,
      signUp: mockRegister,
      user: {
        avatar: undefined,
        isLoggedIn: false,
        username: '',
      },
    });
  });

  test('renders register screen and routes back to login', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<RegisterRouteScreen />);
    });

    expect(mockRegisterScreen).toHaveBeenCalledTimes(1);

    const props = mockRegisterScreen.mock.calls[0]?.[0] as {
      onBack: () => void;
      onRegister: (username: string, password: string) => Promise<void>;
    };

    props.onBack();
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');

    await props.onRegister('alice', '123456');
    expect(mockRegister).toHaveBeenCalledWith('alice', '123456');
  });

  test('redirects authenticated user to notes route', async () => {
    mockUseAuthSession.mockReturnValue({
      isHydrating: false,
      signUp: mockRegister,
      user: {
        avatar: undefined,
        isLoggedIn: true,
        username: 'alice',
      },
    });

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<RegisterRouteScreen />);
    });

    expect(mockRedirect).toHaveBeenCalledWith('/(notes)');
    expect(mockRegisterScreen).not.toHaveBeenCalled();
  });
});
