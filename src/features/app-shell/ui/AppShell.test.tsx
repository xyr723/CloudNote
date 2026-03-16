import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {AppShell} from './AppShell';

const mockHomeScreen = jest.fn((props: unknown) => props);

jest.mock('../../home/ui/HomeScreen', () => ({
  HomeScreen: (props: unknown) => {
    mockHomeScreen(props);
    return null;
  },
}));

jest.mock('../../auth/ui/AuthFlow', () => ({
  AuthFlow: ({
    children,
  }: {
    children: (props: {
      onSignOut: () => Promise<void>;
      setUser: React.Dispatch<React.SetStateAction<{
        avatar?: string;
        isLoggedIn: boolean;
        username: string;
      }>>;
      user: {
        avatar?: string;
        isLoggedIn: boolean;
        username: string;
      };
    }) => React.ReactNode;
  }) =>
    children({
      onSignOut: async () => {},
      setUser: jest.fn(),
      user: {avatar: undefined, isLoggedIn: true, username: 'alice'},
    }),
}));

describe('AppShell', () => {
  test('passes theme and themePreferences to HomeScreen', async () => {
    mockHomeScreen.mockClear();

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<AppShell />);
    });

    expect(mockHomeScreen).toHaveBeenCalledTimes(1);

    const props = mockHomeScreen.mock.calls[0]?.[0] as unknown as {
      theme?: {primary?: string};
      themePreferences?: {
        isDarkMode: boolean;
        onThemeColorChange: (themeName: string) => void;
        onToggleDarkMode: (value: boolean) => void;
        themeColor: string;
      };
    };

    expect(props.theme?.primary).toBeDefined();
    expect(props.themePreferences).toMatchObject({
      isDarkMode: false,
      themeColor: '薄荷生巧',
    });
    expect(props.themePreferences?.onThemeColorChange).toEqual(
      expect.any(Function),
    );
    expect(props.themePreferences?.onToggleDarkMode).toEqual(
      expect.any(Function),
    );
  });
});
