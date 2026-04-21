import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {providerRegistry} from '../../../providers/providerRegistry';

export type AuthSessionUser = {
  avatar?: string;
  isLoggedIn: boolean;
  username: string;
};

type AuthSessionContextValue = {
  isHydrating: boolean;
  setUser: React.Dispatch<React.SetStateAction<AuthSessionUser>>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  user: AuthSessionUser;
};

const guestUser: AuthSessionUser = {
  username: '',
  isLoggedIn: false,
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

type AuthSessionProviderProps = {
  children: React.ReactNode;
};

export const AuthSessionProvider: React.FC<AuthSessionProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthSessionUser>(guestUser);
  const [isHydrating, setIsHydrating] = useState(true);
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
      } finally {
        if (isMounted) {
          setIsHydrating(false);
        }
      }
    };

    restoreSession().catch(error => {
      console.error('检查登录状态失败:', error);
      if (isMounted) {
        setIsHydrating(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [authProvider]);

  const signIn = useCallback(
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

  const signUp = useCallback(
    async (username: string, password: string) => {
      await authProvider.signUp({username, password});
    },
    [authProvider],
  );

  const signOut = useCallback(async () => {
    await authProvider.signOut();
    setUser(guestUser);
  }, [authProvider]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      isHydrating,
      setUser,
      signIn,
      signOut,
      signUp,
      user,
    }),
    [isHydrating, signIn, signOut, signUp, user],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
};

export const useAuthSession = (): AuthSessionContextValue => {
  const value = useContext(AuthSessionContext);

  if (!value) {
    throw new Error('useAuthSession 必须在 AuthSessionProvider 内使用');
  }

  return value;
};
