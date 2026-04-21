import React from 'react';
import {Redirect, useRouter} from 'expo-router';
import {useThemePreferences} from '../../../shared/theme/useThemePreferences';
import {useAuthSession} from '../model/AuthSessionProvider';
import {LoginScreen} from './LoginScreen';

export const LoginRouteScreen: React.FC = () => {
  const router = useRouter();
  const {theme} = useThemePreferences();
  const {isHydrating, signIn, user} = useAuthSession();

  if (isHydrating) {
    return null;
  }

  if (user.isLoggedIn) {
    return <Redirect href="/(notes)" />;
  }

  return (
    <LoginScreen
      onLogin={async (username, password) => {
        await signIn(username, password);
        router.replace('/(notes)');
      }}
      onRegister={() => router.push('/(auth)/register')}
      theme={theme}
    />
  );
};

export default LoginRouteScreen;
