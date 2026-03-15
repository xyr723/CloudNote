import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useCallback, useMemo, useState} from 'react';
import type {AuthTheme} from '../../auth/ui/types';
import {ProfileModal} from './ProfileModal';
import {profileThemeOptions} from './profileThemeOptions';
import {SettingsModal} from './SettingsModal';

type ProfileEntryUser = {
  avatar?: string;
  isLoggedIn: boolean;
  username: string;
};

type ProfileEntryProps = {
  children: (openProfile: () => void) => React.ReactNode;
  isDarkMode: boolean;
  notesCount: number;
  onRequestLogout: () => Promise<void> | void;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  setThemeColor: React.Dispatch<React.SetStateAction<string>>;
  setUser: React.Dispatch<React.SetStateAction<ProfileEntryUser>>;
  theme: AuthTheme;
  themeColor: string;
  user: ProfileEntryUser;
};

export const ProfileEntry: React.FC<ProfileEntryProps> = ({
  children,
  isDarkMode,
  notesCount,
  onRequestLogout,
  setIsDarkMode,
  setThemeColor,
  setUser,
  theme,
  themeColor,
  user,
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const selectedThemeColor = useMemo(
    () =>
      profileThemeOptions.find(option => option.name === themeColor)?.value ??
      themeColor,
    [themeColor],
  );

  const openProfile = useCallback(() => {
    setShowProfile(true);
  }, []);

  const handleThemeColorChange = useCallback(
    (color: string) => {
      const nextThemeColor =
        profileThemeOptions.find(option => option.value === color)?.name ??
        '薄荷生巧';

      setThemeColor(nextThemeColor);
      AsyncStorage.setItem('themeColor', nextThemeColor).catch(error => {
        console.error('保存主题颜色失败:', error);
      });
    },
    [setThemeColor],
  );

  const handleToggleDarkMode = useCallback(
    (value: boolean) => {
      setIsDarkMode(value);
      AsyncStorage.setItem('isDarkMode', value.toString()).catch(error => {
        console.error('保存深色模式设置失败:', error);
      });
    },
    [setIsDarkMode],
  );

  const handleUpdateAvatar = useCallback(
    (avatarUri: string) => {
      setUser(previousUser => ({...previousUser, avatar: avatarUri}));
    },
    [setUser],
  );

  const handleRequestLogout = useCallback(async () => {
    await onRequestLogout();
  }, [onRequestLogout]);

  return (
    <>
      {children(openProfile)}

      {showProfile ? (
        <ProfileModal
          avatar={user.avatar}
          notesCount={notesCount}
          onClose={() => setShowProfile(false)}
          onLogout={handleRequestLogout}
          onOpenSettings={() => setShowSettings(true)}
          onUpdateAvatar={handleUpdateAvatar}
          theme={theme}
          username={user.username}
          visible={showProfile}
        />
      ) : null}

      {showSettings ? (
        <SettingsModal
          isDarkMode={isDarkMode}
          onClose={() => setShowSettings(false)}
          onThemeColorChange={handleThemeColorChange}
          onToggleDarkMode={handleToggleDarkMode}
          theme={theme}
          themeColor={selectedThemeColor}
          visible={showSettings}
        />
      ) : null}
    </>
  );
};
