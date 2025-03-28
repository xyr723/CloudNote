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
  [key: string]: ThemeColors;
};

export const themePresets: ThemePresets = {
  '葡萄冰萃': {
    primary: '#DCC6EA',
    primaryLight: '#FDE9E7',
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
    error: '#E57373',
  },
  '清冽冰川': {
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
    error: '#E57373',
  },
  '流金岁月': {
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
    error: '#E57373',
  },
  '薄荷生巧': {
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
    error: '#E57373',
  },
  '桃桃乌龙': {
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
  // ... 可以继续添加更多预设主题
};

export const generateThemeColors = (themeName: string) => {
  return themePresets[themeName] || themePresets['葡萄冰萃']; // 默认使用葡萄冰萃主题
}; 