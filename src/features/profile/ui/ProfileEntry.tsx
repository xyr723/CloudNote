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
  onThemeColorChange: (themeName: string) => void;
  onToggleDarkMode: (value: boolean) => void;
  setUser: React.Dispatch<React.SetStateAction<ProfileEntryUser>>;
  theme: AuthTheme;
  themeColor: string;
  user: ProfileEntryUser;
};

export const ProfileEntry: React.FC<ProfileEntryProps> = ({
  children,
  isDarkMode,
  notesCount,
  onThemeColorChange,
  onRequestLogout,
  onToggleDarkMode,
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

      onThemeColorChange(nextThemeColor);
    },
    [onThemeColorChange],
  );

  const handleToggleDarkMode = useCallback(
    (value: boolean) => {
      onToggleDarkMode(value);
    },
    [onToggleDarkMode],
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
