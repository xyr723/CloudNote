import React from 'react';
import {Redirect, useRouter} from 'expo-router';
import type {Note} from '../../../entities/note/types';
import {useThemePreferences} from '../../../shared/theme/useThemePreferences';
import {useAuthSession} from '../../auth/model/AuthSessionProvider';
import {HomeScreen} from './HomeScreen';

export const NotesRouteScreen: React.FC = () => {
  const router = useRouter();
  const {theme, ...themePreferences} = useThemePreferences();
  const {isHydrating, setUser, signOut, user} = useAuthSession();

  if (isHydrating) {
    return null;
  }

  if (!user.isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <HomeScreen
      editorPresentation="route"
      onOpenCreateEditorRoute={() => {
        router.push('/(notes)/editor');
      }}
      onOpenEditEditorRoute={(note: Pick<Note, 'id'>) => {
        router.push(`/(notes)/editor?noteId=${encodeURIComponent(note.id)}`);
      }}
      onSignOut={async () => {
        await signOut();
        router.replace('/(auth)/login');
      }}
      setUser={setUser}
      theme={theme}
      themePreferences={themePreferences}
      user={user}
    />
  );
};

export default NotesRouteScreen;
