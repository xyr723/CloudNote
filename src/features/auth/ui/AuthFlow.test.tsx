import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {AuthFlow} from './AuthFlow';

const mockGetSession = jest.fn();
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();

jest.mock('../../../providers/providerRegistry', () => ({
  providerRegistry: {
    getAuthProvider: () => ({
      getSession: (...args: unknown[]) => mockGetSession(...args),
      signIn: (...args: unknown[]) => mockSignIn(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      updatePassword: jest.fn(),
      updateAvatar: jest.fn(),
      getAvatar: jest.fn(),
    }),
  },
}));

jest.mock('./LoginScreen', () => {
  const {Text: MockText, TouchableOpacity: MockTouchableOpacity} =
    require('react-native');

  return {
    LoginScreen: ({
      onLogin,
      onRegister,
    }: {
      onLogin: (username: string, password: string) => Promise<void>;
      onRegister: () => void;
    }) => (
      <>
        <MockText>Mock Login Screen</MockText>
        <MockTouchableOpacity onPress={() => onLogin('alice', '123456')}>
          <MockText>触发登录</MockText>
        </MockTouchableOpacity>
        <MockTouchableOpacity onPress={onRegister}>
          <MockText>去注册</MockText>
        </MockTouchableOpacity>
      </>
    ),
  };
});

jest.mock('./RegisterScreen', () => {
  const {Text: MockText, TouchableOpacity: MockTouchableOpacity} =
    require('react-native');

  return {
    RegisterScreen: ({
      onBack,
      onRegister,
    }: {
      onBack: () => void;
      onRegister: (username: string, password: string) => Promise<void>;
    }) => (
      <>
        <MockText>Mock Register Screen</MockText>
        <MockTouchableOpacity onPress={() => onRegister('alice', '123456')}>
          <MockText>触发注册</MockText>
        </MockTouchableOpacity>
        <MockTouchableOpacity onPress={onBack}>
          <MockText>返回登录</MockText>
        </MockTouchableOpacity>
      </>
    ),
  };
});

const theme = generateThemeColors('薄荷生巧', false);

const findButtonByText = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) => {
  return renderer.root.find(node => {
    if (node.type !== TouchableOpacity) {
      return false;
    }

    return (
      node.findAll(
        child => child.type === Text && child.props.children === label,
      ).length > 0
    );
  });
};

const renderAuthFlow = async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <NavigationContainer>
        <AuthFlow theme={theme}>
          {({onSignOut, user}) => (
            <TouchableOpacity onPress={onSignOut}>
              <Text>Mock Home</Text>
              <Text>{user.username}</Text>
              <Text>触发登出</Text>
            </TouchableOpacity>
          )}
        </AuthFlow>
      </NavigationContainer>,
    );
  });

  return renderer!;
};

describe('AuthFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows login entry when there is no active session', async () => {
    mockGetSession.mockResolvedValue({isLoggedIn: false, user: null});

    const renderer = await renderAuthFlow();

    expect(mockGetSession).toHaveBeenCalledTimes(1);
    expect(
      renderer.root.findAll(
        node =>
          node.type === Text && node.props.children === 'Mock Login Screen',
      ).length,
    ).toBeGreaterThan(0);
  });

  test('renders authenticated slot from restored session', async () => {
    mockGetSession.mockResolvedValue({
      isLoggedIn: true,
      user: {avatar: 'file:///avatar.jpg', id: 'alice', username: 'alice'},
    });

    const renderer = await renderAuthFlow();

    expect(
      renderer.root.findAll(
        node => node.type === Text && node.props.children === 'Mock Home',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      renderer.root.findAll(
        node => node.type === Text && node.props.children === 'alice',
      ).length,
    ).toBeGreaterThan(0);
  });

  test('signs in and signs out through auth flow orchestration', async () => {
    mockGetSession.mockResolvedValue({isLoggedIn: false, user: null});
    mockSignIn.mockResolvedValue({
      avatar: undefined,
      id: 'alice',
      username: 'alice',
    });
    mockSignOut.mockResolvedValue(undefined);

    const renderer = await renderAuthFlow();

    await ReactTestRenderer.act(async () => {
      await findButtonByText(renderer, '触发登录').props.onPress();
    });

    expect(mockSignIn).toHaveBeenCalledWith({
      password: '123456',
      username: 'alice',
    });
    expect(
      renderer.root.findAll(
        node => node.type === Text && node.props.children === 'Mock Home',
      ).length,
    ).toBeGreaterThan(0);

    await ReactTestRenderer.act(async () => {
      await findButtonByText(renderer, '触发登出').props.onPress();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(
      renderer.root.findAll(
        node =>
          node.type === Text && node.props.children === 'Mock Login Screen',
      ).length,
    ).toBeGreaterThan(0);
  });
});
