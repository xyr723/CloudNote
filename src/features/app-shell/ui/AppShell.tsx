import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AuthFlow} from '../../auth/ui/AuthFlow';
import {HomeScreen} from '../../home/ui/HomeScreen';
import {useThemePreferences} from '../../../shared/theme/useThemePreferences';

export const AppShell: React.FC = () => {
  const {theme, ...themePreferences} = useThemePreferences();

  return (
    <NavigationContainer>
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
    </NavigationContainer>
  );
};
