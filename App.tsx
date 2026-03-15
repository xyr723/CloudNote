import React, {useMemo, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {generateThemeColors} from './src/shared/theme/colors';
import {HomeScreen} from './src/features/home/ui/HomeScreen';
import {AuthFlow} from './src/features/auth/ui/AuthFlow';

function App(): React.JSX.Element {
  const [themeColor, setThemeColor] = useState('薄荷生巧');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = useMemo(
    () => generateThemeColors(themeColor, isDarkMode),
    [isDarkMode, themeColor],
  );

  return (
    <NavigationContainer>
      <AuthFlow theme={theme}>
        {({onSignOut, setUser, user}) => (
          <HomeScreen
            isDarkMode={isDarkMode}
            onSignOut={onSignOut}
            setIsDarkMode={setIsDarkMode}
            setThemeColor={setThemeColor}
            setUser={setUser}
            themeColor={themeColor}
            user={user}
          />
        )}
      </AuthFlow>
    </NavigationContainer>
  );
}

export default App;
