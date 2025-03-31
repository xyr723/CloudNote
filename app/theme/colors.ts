type ThemeColors = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryTransparent: string;
  text: string;
  textLight: string;
  textDark: string;
  background: string;
  surface: string;
  border: string;
  borderLight: string;
  shadow: string;
  accent: string;
  accentLight: string;
  error: string;
};

type ThemePresets = {
  [key: string]: {
    light: ThemeColors;
    dark: ThemeColors;
  };
};

export const themePresets: ThemePresets = {
  '葡萄冰萃': {
    light: {
      primary: '#DCC6EA',
      primaryLight: '#C4A7D6',
      primaryDark: '#B094C9',
      primaryTransparent: '#DCC6EA40',
      text: '#666666',
      textLight: '#999999',
      textDark: '#333333',
      background: '#FDFAFF',
      surface: '#FFFFFF',
      border: '#E8E2EF',
      borderLight: '#F5F1F9',
      shadow: '#DCC6EA20',
      accent: '#B29EA1',
      accentLight: '#F0D1CF',
      error: '#B29EA1',
    },
    dark: {
      primary: '#6A4C93',
      primaryLight: '#8B6BB3',
      primaryDark: '#4A2C73',
      primaryTransparent: '#6A4C9340',
      text: '#E0E0E0',
      textLight: '#B0B0B0',
      textDark: '#FFFFFF',
      background: '#1A1A1A',
      surface: '#2D2D2D',
      border: '#3D3D3D',
      borderLight: '#4D4D4D',
      shadow: '#00000040',
      accent: '#B29EA1',
      accentLight: '#8B6BB3',
      error: '#E57373',
    }
  },
  '清冽冰川': {
    light: {
      primary: '#B7CCDF',
      primaryLight: '#A5B8C6',
      primaryDark: '#8BA7C4',
      primaryTransparent: '#B7CCDF40',
      text: '#666666',
      textLight: '#999999',
      textDark: '#333333',
      background: '#E1EFFA90',
      surface: '#FFFFFF',
      border: '#E2E8EF',
      borderLight: '#F1F5F9',
      shadow: '#B7CCDF20',
      accent: '#9BB4D3',
      accentLight: '#D1EAEC',
      error: '#9BB4D3',
    },
    dark: {
      primary: '#4B6CB7',
      primaryLight: '#6B8CD7',
      primaryDark: '#2B4C97',
      primaryTransparent: '#4B6CB740',
      text: '#E0E0E0',
      textLight: '#B0B0B0',
      textDark: '#FFFFFF',
      background: '#1A1A1A',
      surface: '#2D2D2D',
      border: '#3D3D3D',
      borderLight: '#4D4D4D',
      shadow: '#00000040',
      accent: '#9BB4D3',
      accentLight: '#6B8CD7',
      error: '#E57373',
    }
  },
  '流金岁月': {
    light: {
      primary: '#938368',
      primaryLight: '#FBE6A9',
      primaryDark: '#AB833C',
      primaryTransparent: '#93836840',
      text: '#666666',
      textLight: '#999999',
      textDark: '#333333',
      background: '#F2EBB270',
      surface: '#FFFFFF',
      border: '#EFE6E5',
      borderLight: '#F9F5F4',
      shadow: '#93836820',
      accent: '#202C26',
      accentLight: '#E8DBEF',
      error: '#202C26',
    },
    dark: {
      primary: '#E5D6A4',
      primaryLight: '#F5E6B4',
      primaryDark: '#D5C694',
      primaryTransparent: '#E5D6A440',
      text: '#E0E0E0',
      textLight: '#B0B0B0',
      textDark: '#FFFFFF',
      background: '#1A1A1A',
      surface: '#2D2D2D',
      border: '#3D3D3D',
      borderLight: '#4D4D4D',
      shadow: '#00000040',
      accent: '#E5D6A4',
      accentLight: '#F5E6B4',
      error: '#E57373',
    }
  },
  '薄荷生巧': {
    light: {
      primary: '#BBE1E4',
      primaryLight: '#C2DCC7',
      primaryDark: '#A3D1D5',
      primaryTransparent: '#BBE1E440',
      text: '#666666',
      textLight: '#999999',
      textDark: '#333333',
      background: '#ECDBC170',
      surface: '#FFFFFF',
      border: '#E5EFEF',
      borderLight: '#F4F9F9',
      shadow: '#BBE1E420',
      accent: '#58433A',
      accentLight: '#F0D1CF',
      error: '#58433A',
    },
    dark: {
      primary: '#4A7B4A',
      primaryLight: '#6A9B6A',
      primaryDark: '#2A5B2A',
      primaryTransparent: '#4A7B4A40',
      text: '#E0E0E0',
      textLight: '#B0B0B0',
      textDark: '#FFFFFF',
      background: '#1A1A1A',
      surface: '#2D2D2D',
      border: '#3D3D3D',
      borderLight: '#4D4D4D',
      shadow: '#00000040',
      accent: '#4A7B4A',
      accentLight: '#6A9B6A',
      error: '#E57373',
    }
  },
  '桃桃乌龙': {
    light: {
      primary: '#FBD7D7',
      primaryLight: '#FCBEC3',
      primaryDark: '#F8C5C5',
      primaryTransparent: '#FBD7D740',
      text: '#666666',
      textLight: '#999999',
      textDark: '#333333',
      background: '#F2B3AF35',
      surface: '#FFFFFF',
      border: '#F5E6E6',
      borderLight: '#FAF2F2',
      shadow: '#FBD7D720',
      accent: '#F2B3AF',
      accentLight: '#D1EAEC',
      error: '#E57373',
    },
    dark: {
      primary: '#B76E79',
      primaryLight: '#D78E99',
      primaryDark: '#974E59',
      primaryTransparent: '#B76E7940',
      text: '#E0E0E0',
      textLight: '#B0B0B0',
      textDark: '#FFFFFF',
      background: '#1A1A1A',
      surface: '#2D2D2D',
      border: '#3D3D3D',
      borderLight: '#4D4D4D',
      shadow: '#00000040',
      accent: '#B76E79',
      accentLight: '#D78E99',
      error: '#E57373',
    }
  },
  // ... 可以继续添加更多预设主题
};

export const generateThemeColors = (themeName: string, isDarkMode: boolean = false) => {
  return themePresets[themeName]?.[isDarkMode ? 'dark' : 'light'] || themePresets['薄荷生巧'].light;
};