import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AuthFlow} from '../../auth/ui/AuthFlow';
import {HomeScreen} from '../../home/ui/HomeScreen';
import {useThemePreferences} from '../../../shared/theme/useThemePreferences';

type AppShellProps = {
  withNavigationContainer?: boolean;
};

export const AppShell: React.FC<AppShellProps> = ({
  withNavigationContainer = true,
}) => {
  const {theme, ...themePreferences} = useThemePreferences();
  const content = (
    <AuthFlow theme={theme}>
      {({onSignOut, setUser, user}) => (
        <HomeScreen
          onSignOut={onSignOut}
          setUser={setUser}
          theme={theme}
          themePreferences={themePreferences}
          user={user}
        />
      )}
    </AuthFlow>
  );

  if (!withNavigationContainer) {
    return content;
  }

  return <NavigationContainer>{content}</NavigationContainer>;
};
