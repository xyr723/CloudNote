import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import {generateThemeColors} from '../../../shared/theme/colors';
import {ProfileEntry} from './ProfileEntry';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('./ProfileModal', () => {
  const {Text: MockText, TouchableOpacity: MockTouchableOpacity} =
    require('react-native');

  return {
    ProfileModal: ({
      onOpenSettings,
      onUpdateAvatar,
      visible,
    }: {
      onOpenSettings: () => void;
      onUpdateAvatar: (avatarUri: string) => void;
      visible: boolean;
    }) =>
      visible ? (
        <>
          <MockText>Mock Profile Modal</MockText>
          <MockTouchableOpacity onPress={onOpenSettings}>
            <MockText>打开设置</MockText>
          </MockTouchableOpacity>
          <MockTouchableOpacity
            onPress={() => onUpdateAvatar('file:///avatar-updated.jpg')}>
            <MockText>更新头像</MockText>
          </MockTouchableOpacity>
        </>
      ) : null,
  };
});

jest.mock('./SettingsModal', () => {
  const {Text: MockText, TouchableOpacity: MockTouchableOpacity} =
    require('react-native');

  return {
    SettingsModal: ({
      onThemeColorChange,
      onToggleDarkMode,
      visible,
    }: {
      onThemeColorChange: (color: string) => void;
      onToggleDarkMode: (value: boolean) => void;
      visible: boolean;
    }) =>
      visible ? (
        <>
          <MockText>Mock Settings Modal</MockText>
          <MockTouchableOpacity onPress={() => onThemeColorChange('#FBD7D7')}>
            <MockText>切换主题</MockText>
          </MockTouchableOpacity>
          <MockTouchableOpacity onPress={() => onToggleDarkMode(true)}>
            <MockText>切换深色模式</MockText>
          </MockTouchableOpacity>
        </>
      ) : null,
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

const renderProfileEntry = (overrides?: {
  setIsDarkMode?: jest.Mock;
  setThemeColor?: jest.Mock;
  setUser?: jest.Mock;
}) => {
  const setIsDarkMode = overrides?.setIsDarkMode ?? jest.fn();
  const setThemeColor = overrides?.setThemeColor ?? jest.fn();
  const setUser = overrides?.setUser ?? jest.fn();

  const renderer = ReactTestRenderer.create(
    <ProfileEntry
      isDarkMode={false}
      notesCount={3}
      onRequestLogout={() => {}}
      setIsDarkMode={setIsDarkMode}
      setThemeColor={setThemeColor}
      setUser={setUser}
      theme={theme}
      themeColor="薄荷生巧"
      user={{avatar: undefined, isLoggedIn: true, username: 'alice'}}
    >
      {openProfile => (
        <TouchableOpacity onPress={openProfile}>
          <Text>打开个人中心</Text>
        </TouchableOpacity>
      )}
    </ProfileEntry>,
  );

  return {renderer, setIsDarkMode, setThemeColor, setUser};
};

describe('ProfileEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('opens profile modal from feature entry trigger', async () => {
    const {renderer} = renderProfileEntry();

    const button = findButtonByText(renderer, '打开个人中心');

    await ReactTestRenderer.act(async () => {
      await button.props.onPress();
    });

    expect(
      renderer.root.findAll(
        node =>
          node.type === Text && node.props.children === 'Mock Profile Modal',
      ).length,
    ).toBeGreaterThan(0);
  });

  test('opens settings modal from profile modal', async () => {
    const {renderer} = renderProfileEntry();

    await ReactTestRenderer.act(async () => {
      await findButtonByText(renderer, '打开个人中心').props.onPress();
    });

    await ReactTestRenderer.act(async () => {
      await findButtonByText(renderer, '打开设置').props.onPress();
    });

    expect(
      renderer.root.findAll(
        node =>
          node.type === Text && node.props.children === 'Mock Settings Modal',
      ).length,
    ).toBeGreaterThan(0);
  });

  test('persists theme and dark mode changes from settings entry', async () => {
    const setThemeColor = jest.fn();
    const setIsDarkMode = jest.fn();
    const {renderer} = renderProfileEntry({setIsDarkMode, setThemeColor});

    await ReactTestRenderer.act(async () => {
      await findButtonByText(renderer, '打开个人中心').props.onPress();
      await findButtonByText(renderer, '打开设置').props.onPress();
      await findButtonByText(renderer, '切换主题').props.onPress();
      await findButtonByText(renderer, '切换深色模式').props.onPress();
    });

    expect(setThemeColor).toHaveBeenCalledWith('桃桃乌龙');
    expect(setIsDarkMode).toHaveBeenCalledWith(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('themeColor', '桃桃乌龙');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('isDarkMode', 'true');
  });

  test('updates avatar through setUser state updater', async () => {
    const setUser = jest.fn();
    const {renderer} = renderProfileEntry({setUser});

    await ReactTestRenderer.act(async () => {
      await findButtonByText(renderer, '打开个人中心').props.onPress();
      await findButtonByText(renderer, '更新头像').props.onPress();
    });

    expect(setUser).toHaveBeenCalledTimes(1);

    const updateUser = setUser.mock.calls[0][0] as ((
      user: {
        avatar?: string;
        isLoggedIn: boolean;
        username: string;
      },
    ) => {
      avatar?: string;
      isLoggedIn: boolean;
      username: string;
    });

    expect(
      updateUser({avatar: undefined, isLoggedIn: true, username: 'alice'}),
    ).toEqual({
      avatar: 'file:///avatar-updated.jpg',
      isLoggedIn: true,
      username: 'alice',
    });
  });
});
