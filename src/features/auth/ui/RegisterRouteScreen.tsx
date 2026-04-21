import React from 'react';
import {Redirect, useRouter} from 'expo-router';
import {useThemePreferences} from '../../../shared/theme/useThemePreferences';
import {useAuthSession} from '../model/AuthSessionProvider';
import {RegisterScreen} from './RegisterScreen';

export const RegisterRouteScreen: React.FC = () => {
  const router = useRouter();
  const {theme} = useThemePreferences();
  const {isHydrating, signUp, user} = useAuthSession();

  if (isHydrating) {
    return null;
  }

  if (user.isLoggedIn) {
    return <Redirect href="/(notes)" />;
  }

  return (
    <RegisterScreen
      onBack={() => router.replace('/(auth)/login')}
      onRegister={signUp}
      theme={theme}
    />
  );
};

export default RegisterRouteScreen;
