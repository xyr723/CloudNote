import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {providerRegistry} from '../../../providers/providerRegistry';
import type {AuthTheme} from './types';
import {LoginScreen} from './LoginScreen';
import {RegisterScreen} from './RegisterScreen';

type AuthStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
};

type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export type AuthFlowUser = {
  avatar?: string;
  isLoggedIn: boolean;
  username: string;
};

type AuthFlowProps = {
  children: (props: {
    onSignOut: () => Promise<void>;
    setUser: React.Dispatch<React.SetStateAction<AuthFlowUser>>;
    user: AuthFlowUser;
  }) => React.ReactNode;
  theme: AuthTheme;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const guestUser: AuthFlowUser = {
  username: '',
  isLoggedIn: false,
};

export const AuthFlow: React.FC<AuthFlowProps> = ({children, theme}) => {
  const [user, setUser] = useState<AuthFlowUser>(guestUser);
  const authProvider = useMemo(() => providerRegistry.getAuthProvider(), []);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const session = await authProvider.getSession();

        if (!isMounted) {
          return;
        }

        if (session.isLoggedIn && session.user) {
          setUser({
            avatar: session.user.avatar,
            isLoggedIn: true,
            username: session.user.username,
          });
          return;
        }

        setUser(guestUser);
      } catch (error) {
        console.error('检查登录状态失败:', error);
      }
    };

    restoreSession().catch(error => {
      console.error('检查登录状态失败:', error);
    });

    return () => {
      isMounted = false;
    };
  }, [authProvider]);

  const handleLogin = useCallback(
    async (username: string, password: string) => {
      const account = await authProvider.signIn({username, password});

      setUser({
        avatar: account.avatar,
        isLoggedIn: true,
        username: account.username,
      });
    },
    [authProvider],
  );

  const handleRegister = useCallback(
    async (username: string, password: string) => {
      await authProvider.signUp({username, password});
    },
    [authProvider],
  );

  const handleSignOut = useCallback(async () => {
    await authProvider.signOut();
    setUser(guestUser);
  }, [authProvider]);

  if (user.isLoggedIn) {
    return (
      <Stack.Navigator
        screenOptions={{
          animation: 'none',
          headerShown: false,
          presentation: 'card',
        }}>
        <Stack.Screen name="Home">
          {() => children({onSignOut: handleSignOut, setUser, user})}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        animation: 'none',
        headerShown: false,
        presentation: 'card',
      }}>
      <Stack.Screen name="Login">
        {({navigation}: {navigation: AuthNavigationProp}) => (
          <LoginScreen
            onLogin={handleLogin}
            onRegister={() => navigation.navigate('Register')}
            theme={theme}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {({navigation}: {navigation: AuthNavigationProp}) => (
          <RegisterScreen
            onBack={() => navigation.navigate('Login')}
            onRegister={handleRegister}
            theme={theme}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
