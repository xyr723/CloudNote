import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AuthSessionProvider, type AuthSessionUser, useAuthSession} from '../model/AuthSessionProvider';
import type {AuthTheme} from './types';
import {LoginScreen} from './LoginScreen';
import {RegisterScreen} from './RegisterScreen';

type AuthStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
};

type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export type AuthFlowUser = AuthSessionUser;

type AuthFlowProps = {
  children: (props: {
    onSignOut: () => Promise<void>;
    setUser: React.Dispatch<React.SetStateAction<AuthFlowUser>>;
    user: AuthFlowUser;
  }) => React.ReactNode;
  theme: AuthTheme;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthFlowContent: React.FC<AuthFlowProps> = ({children, theme}) => {
  const {setUser, signIn, signOut, signUp, user} = useAuthSession();

  if (user.isLoggedIn) {
    return (
      <Stack.Navigator
        screenOptions={{
          animation: 'none',
          headerShown: false,
          presentation: 'card',
        }}>
        <Stack.Screen name="Home">
          {() => children({onSignOut: signOut, setUser, user})}
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
            onLogin={signIn}
            onRegister={() => navigation.navigate('Register')}
            theme={theme}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {({navigation}: {navigation: AuthNavigationProp}) => (
          <RegisterScreen
            onBack={() => navigation.navigate('Login')}
            onRegister={signUp}
            theme={theme}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export const AuthFlow: React.FC<AuthFlowProps> = ({children, theme}) => {
  return (
    <AuthSessionProvider>
      <AuthFlowContent theme={theme}>{children}</AuthFlowContent>
    </AuthSessionProvider>
  );
};
