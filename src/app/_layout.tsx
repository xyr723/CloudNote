import React from 'react';
import {Stack} from 'expo-router';
import {AuthSessionProvider} from '../features/auth/model/AuthSessionProvider';

export default function RootLayout(): React.JSX.Element {
  return (
    <AuthSessionProvider>
      <Stack screenOptions={{headerShown: false}} />
    </AuthSessionProvider>
  );
}
