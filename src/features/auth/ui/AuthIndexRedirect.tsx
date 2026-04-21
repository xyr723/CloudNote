import React from 'react';
import {Redirect} from 'expo-router';
import {useAuthSession} from '../model/AuthSessionProvider';

export const AuthIndexRedirect: React.FC = () => {
  const {isHydrating, user} = useAuthSession();

  if (isHydrating) {
    return null;
  }

  return user.isLoggedIn ? (
    <Redirect href="/(notes)" />
  ) : (
    <Redirect href="/(auth)/login" />
  );
};

export default AuthIndexRedirect;
