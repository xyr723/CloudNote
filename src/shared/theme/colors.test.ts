import {generateThemeColors, themePresets} from './colors';

describe('shared theme colors', () => {
  test('returns preset theme colors by theme name', () => {
    expect(generateThemeColors('薄荷生巧', false)).toEqual(
      themePresets['薄荷生巧'].light,
    );
  });

  test('falls back to 薄荷生巧 when theme name is unknown', () => {
    expect(generateThemeColors('不存在的主题', true)).toEqual(
      themePresets['薄荷生巧'].light,
    );
  });
});
