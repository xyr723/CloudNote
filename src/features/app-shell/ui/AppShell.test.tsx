import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {AppShell} from './AppShell';

const mockHomeScreen = jest.fn((props: unknown) => props);
const mockNavigationContainer = jest.fn((children: React.ReactNode) => children);

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({children}: {children: React.ReactNode}) => {
    mockNavigationContainer(children);
    return children;
  },
}));

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
  beforeEach(() => {
    mockHomeScreen.mockClear();
    mockNavigationContainer.mockClear();
  });

  test('passes theme and themePreferences to HomeScreen', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<AppShell />);
    });

    expect(mockHomeScreen).toHaveBeenCalledTimes(1);
    expect(mockNavigationContainer).toHaveBeenCalledTimes(1);

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

  test('can render without NavigationContainer for expo router entry', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<AppShell withNavigationContainer={false} />);
    });

    expect(mockHomeScreen).toHaveBeenCalledTimes(1);
    expect(mockNavigationContainer).not.toHaveBeenCalled();
  });
});
