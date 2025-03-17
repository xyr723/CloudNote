export const generateThemeColors = (primaryColor: string) => {
  // 使用 HSL 颜色空间来生成和谐的配色
  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // 从主色调生成不同亮度和饱和度的变体
  const getHSL = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return [h * 360, s * 100, l * 100];
  };

  const [h, s, l] = getHSL(primaryColor);

  return {
    primary: primaryColor,
    primaryLight: hslToHex(h, s * 0.8, l * 1.2),
    primaryDark: hslToHex(h, s * 1.2, l * 0.8),
    primaryTransparent: `${primaryColor}40`,
    text: '#666666',
    textLight: '#999999',
    textDark: '#333333',
    background: '#FDFAFF',
    surface: '#FFFFFF',
    border: hslToHex(h, s * 0.3, l * 0.9),
    borderLight: hslToHex(h, s * 0.2, l * 0.95),
    shadow: `${primaryColor}20`,
    accent: hslToHex((h + 60) % 360, s * 0.8, l * 0.8),
    accentLight: hslToHex((h + 60) % 360, s * 0.6, l * 0.9),
    error: '#E57373',
    success: '#81C784',
    warning: '#FFB74D',
  };
}; 