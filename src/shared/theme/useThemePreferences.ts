import AsyncStorage from '@react-native-async-storage/async-storage';
import {useCallback, useMemo, useState} from 'react';
import {generateThemeColors} from './colors';

export type ThemePreferencesController = {
  isDarkMode: boolean;
  onThemeColorChange: (themeName: string) => void;
  onToggleDarkMode: (value: boolean) => void;
  theme: ReturnType<typeof generateThemeColors>;
  themeColor: string;
};

export type ThemePreferencesInput = Omit<ThemePreferencesController, 'theme'>;

export function useThemePreferences(): ThemePreferencesController {
  const [themeColor, setThemeColor] = useState('薄荷生巧');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = useMemo(
    () => generateThemeColors(themeColor, isDarkMode),
    [isDarkMode, themeColor],
  );

  const handleThemeColorChange = useCallback((nextThemeColor: string) => {
    setThemeColor(nextThemeColor);
    AsyncStorage.setItem('themeColor', nextThemeColor).catch(error => {
      console.error('保存主题颜色失败:', error);
    });
  }, []);

  const handleToggleDarkMode = useCallback((value: boolean) => {
    setIsDarkMode(value);
    AsyncStorage.setItem('isDarkMode', value.toString()).catch(error => {
      console.error('保存深色模式设置失败:', error);
    });
  }, []);

  return {
    isDarkMode,
    onThemeColorChange: handleThemeColorChange,
    onToggleDarkMode: handleToggleDarkMode,
    theme,
    themeColor,
  };
}
