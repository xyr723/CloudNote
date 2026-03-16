import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {useThemePreferences} from './useThemePreferences';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(() => Promise.resolve()),
  },
}));

type ThemePreferencesSnapshot = ReturnType<typeof useThemePreferences>;

const renderHookHarness = () => {
  let latestSnapshot: ThemePreferencesSnapshot | undefined;

  const HookHarness = () => {
    latestSnapshot = useThemePreferences();
    return null;
  };

  const renderer = ReactTestRenderer.create(<HookHarness />);

  return {
    getSnapshot: () => latestSnapshot,
    renderer,
  };
};

describe('useThemePreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns default theme preferences', () => {
    const {getSnapshot} = renderHookHarness();

    expect(getSnapshot()).toMatchObject({
      themeColor: '薄荷生巧',
      isDarkMode: false,
    });
    expect(getSnapshot()?.theme.primary).toBeDefined();
  });

  test('updates theme color and persists selection', async () => {
    const {getSnapshot} = renderHookHarness();

    await ReactTestRenderer.act(async () => {
      getSnapshot()?.onThemeColorChange('桃桃乌龙');
    });

    expect(getSnapshot()?.themeColor).toBe('桃桃乌龙');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'themeColor',
      '桃桃乌龙',
    );
  });

  test('updates dark mode and persists selection', async () => {
    const {getSnapshot} = renderHookHarness();

    await ReactTestRenderer.act(async () => {
      getSnapshot()?.onToggleDarkMode(true);
    });

    expect(getSnapshot()?.isDarkMode).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('isDarkMode', 'true');
  });
});
