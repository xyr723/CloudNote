import React, {useEffect, useMemo, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import LoginPage from './app/components/LoginPage';
import RegisterPage from './app/components/RegisterPage';
import {generateThemeColors} from './app/theme/colors';
import {HomeScreen} from './src/features/home/ui/HomeScreen';
import {providerRegistry} from './src/providers/providerRegistry';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  const [themeColor, setThemeColor] = useState('薄荷生巧');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<{
    avatar?: string;
    isLoggedIn: boolean;
    username: string;
  }>({
    username: '',
    isLoggedIn: false,
  });
  const authProvider = useMemo(() => providerRegistry.getAuthProvider(), []);
  const theme = useMemo(
    () => generateThemeColors(themeColor, isDarkMode),
    [isDarkMode, themeColor],
  );

  useEffect(() => {
    const checkLoginState = async () => {
      try {
        const session = await authProvider.getSession();

        if (session.isLoggedIn && session.user) {
          setUser({
            username: session.user.username,
            isLoggedIn: true,
            avatar: session.user.avatar,
          });
        }
      } catch (error) {
        console.error('检查登录状态失败:', error);
      }
    };

    checkLoginState().catch(error => {
      console.error('检查登录状态失败:', error);
    });
  }, [authProvider]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={user.isLoggedIn ? 'authenticated' : 'guest'}
        initialRouteName={user.isLoggedIn ? 'Home' : 'Login'}
        screenOptions={{
          headerShown: false,
          animation: 'none',
          presentation: 'card',
        }}>
        <Stack.Screen
          name="Login"
          component={({navigation}: {navigation: NavigationProp}) => (
            <LoginPage
              onLogin={async (username, password) => {
                const account = await authProvider.signIn({username, password});
                navigation.navigate('Home');

                setTimeout(() => {
                  setUser({
                    username: account.username,
                    isLoggedIn: true,
                    avatar: account.avatar,
                  });
                }, 0);
              }}
              onRegister={() => navigation.navigate('Register')}
              theme={theme}
            />
          )}
        />
        <Stack.Screen
          name="Register"
          component={({navigation}: {navigation: NavigationProp}) => (
            <RegisterPage
              onRegister={async (username, password) => {
                await authProvider.signUp({username, password});
              }}
              onBack={() => navigation.navigate('Login')}
              theme={theme}
            />
          )}
        />
        <Stack.Screen
          name="Home"
          component={() => (
            <HomeScreen
              user={user}
              setUser={setUser}
              themeColor={themeColor}
              setThemeColor={setThemeColor}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
            />
          )}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
